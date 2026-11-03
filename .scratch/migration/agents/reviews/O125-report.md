# O125 report: group heading strips, sticky table header rows, the Calendar's header rows and the diff's file header paint solid over a wallpaper

Everything in the brief is done, under the rulings of `agents/briefs/O125-cases.md` (items 1 to 8, cases C1 to C17). The landing's look in a browser is still owed: it is the proof the brief names for C1, C2, C4, C5, C6, C7, C11, C13, C15 and C17, because a builder runs no page.

## Open items of the state file, verbatim

These are quoted from the worktree's copy of `.scratch/migration/orchestrator-state.md:166-167`. The orchestrator says this copy predates rulings 637 and 638 on main's `plan.md`, so 638 still shows here as open.

- Open item 638 (2026-11-03), from O125's /spec. Ruling 637 makes a group's heading strip solid over a wallpaper so nothing scrolling under it shows through. Two other strips that stay in place over scrolling rows have the same show-through and are not group headings, so 637 does not name them: a table's sticky header row, painted at `panel_opacity` over its rows (`src/lib/ui/display/table/Table.svelte:136-139`), and the Calendar's header rows, painted at `popover_opacity` (`src/lib/views/personal/calendar/Calendar.svelte:376-380`). (a) Recommended, a judgment: both paint solid `--panel` over a wallpaper, as a group heading does after O125, so no heading row anywhere has text behind it; one step after O125, two small style rules and the comments that describe them (`tokens.css`'s wallpaper comment among them). (b) Keep both translucent; this is the lazy option, it leaves table and calendar headings readable through over bright rows.
- Open item 639 (2026-11-03), from Axel's look at the Sessions tab of the Explorer. Seen on 8790: the list's fold, its group strips (research-hub, Terminals) and the Details section follow each other with no line between them; the group strips are `GroupHead` bands with a fold glyph and bold words (`SessionWorkspace.svelte:210`, `TerminalRows.svelte:117`), unlike the tree rows around them; in Changes, 'Touched by this session' and 'The repository' are flat capital sub-headings that do not fold and carry no count (`ChangesTouched.svelte:42`, `ChangesRepo.svelte:66`), and Changed and Untracked are `ChangeGroups.svelte`'s always-open heads, where the Repositories view draws its groups as tree rows that fold, with the count as a badge at the right edge (`views/sources/repositories/changes/Changes.svelte:290-358`); Details is a block of capital labels, a select, a text field, three buttons and wrapping measurement lines (`DetailsBody.svelte`). Three parts. Part 1, the divider: (a) recommended, a judgment: a 1 px line in `--line` across the pane between the list's fold and the first section, in the Sessions tab only; (b) leave it, the lazy option. Part 2, the headings: (a) recommended, a judgment: every heading inside the Sessions tab and a Session tab becomes a group row of the Repositories look (fold chevron, the words in normal case at the row's size, the count as a badge at the right edge, one step in, folding, its fold kept in the tab's state, its actions on hover): the workspace groups, Terminals, Touched by this session, the repository, and Merge, Staged, Changed and Untracked; the repository's groups are drawn by the Repositories view's own Changes partial, so the session's changes gain what that view has (list and tree mode, selection, the right-click menu, virtual rows for long lists) and `ChangeGroups.svelte` is deleted; (b) only restyle the heads and keep `ChangeGroups.svelte` as a second implementation of the same groups, the lazy option. Part 3, Details: (a) recommended, a judgment: Details becomes rows of the tree in the Files look, in three group rows of part 2's look, Session (title, folder, branch, kind, status, pid, version, started, hook), Model (model, effort, mode) and Usage (context with its meter in the row, tokens, prompt cache), each one line with its name muted at the left and its value at the right, cut with the whole value in its tooltip; the controls become icon actions on the Details head: Rename (opening the title field the list's double press opens), Pin (a menu of the areas, as the select offers), Resume (asking once, as now) and Open the transcript; nothing shown now is dropped; (b) keep the block and fix only the wrapping lines, the lazy option.

## The cases' first run, the rulings, and the result after the change

How the rules rank: Svelte scopes each component's selectors to that component. On the unchanged tree, `:global(body.wall) .strip` (`GroupHead.svelte:213-216` at the base) beat the base `.strip`, and `:global(body.wall [data-float-place='free']) .strip` (:219-222 at the base) beat both. Nothing outside the component reaches a GroupHead strip:
- `git grep -n '\.strip' -- src` lists, besides GroupHead, only rules scoped to `SplitView.svelte`, `ActionStrip.svelte` and `Tabs.svelte`, and `TabFace.svelte`'s `:global(.strip.unfocused) .tab`, which needs the class `unfocused` and targets `.tab`.
- The only `h3` rule in the tree is ScheduleDialog's, scoped to that component (`ScheduleDialog.svelte:253`).
- `--panel-on-wall` was redefined only at `UpdateTray.svelte:265` (base) and at `Pane.svelte:71`, the latter only with a `share` (`git grep -n -e '--panel-on-wall:' -e 'style:--panel-on-wall' -- src`).

After the change, `grep -n 'background\|backdrop' src/lib/ui/controls/heads/GroupHead.svelte` prints only `200:        background: var(--panel);`. So the base rule `.strip { ... background: var(--panel); ... }` (`GroupHead.svelte:189-203`) decides every strip case, with no backdrop filter.

**Rulings carried (`agents/briefs/O125-cases.md`):**
1. C13 uses the Status Gallery's tones table (`Gallery.svelte:341`, outside any surface) and Problems (`Problems.svelte:313`, inside its tinted pane). The Processes table is not a `stays` table and is unchanged. The first run found that it is `ProcessTable.svelte`, a hand-drawn table inside `<Pane ... tinted>` (`Processes.svelte:66`). Its box scrolls only sideways (`Processes.svelte:124-126`), and its header paints transparent over a wallpaper (`ProcessTable.svelte:136-138`). Its actions column stays out of the step (open item 640).
2. Option (a): the multi-file diff's file header paints solid `--panel` over a wallpaper (item 8, case C17), under ruling 638 that no heading row has text behind it.
3. The write list widens to the comments the change makes false: `Table.svelte` whole, `Problems.svelte` 47-48, `Gallery.svelte` 36-38, `Calendar.svelte` 39-40 and `FileHeader.svelte`.
4. "What it must do" covers items 1 to 8.

| Case | First run (unchanged tree): rule and result | After the change: rule and result |
|---|---|---|
| C1 Status Gallery strip, untinted pane (`Status.svelte:108`), the strip in `<div class="samples">` outside the Surface (`Status.svelte:132-143`), `panel_opacity` 0.8 | `body.wall .strip` (:213-216): `--panel-on-wall` (80 % panel) with blur; rows show through at 20 %. Unmet. | `.strip` (:189-203): `--panel`, no blur. Met by reading; look owed. |
| C2 Account setup strip (`AccountSetup.svelte:117`) inside `<Pane ... tinted>` (:98) | same rule; the tinted pane sets no `--panel-on-wall` without a share: 80 % with blur, a second layer over the pane's. Unmet. | `--panel`, no blur. Met by reading; look owed. |
| C3 tinted pane with `share` (none draws a GroupHead) | `Pane.svelte:71` puts `--editor-on-wall` or `--terminal-on-wall` in place; strip rule :213: the share's mix. Unmet. | The strip paints `--panel` and reads no `--*-on-wall`, so the share does not reach it. Met by reading only, as the brief says. |
| C4 free float | `[data-float-place='free'] .strip` (:219-222): popover mix (default `popover_opacity` 0.97, `config/defaults/appearance.yml:99`), no blur. Unmet. | `--panel`, no blur. Met by reading; look owed. |
| C5 card, lane or `Surface` (Status's LineCounts and Hooks strips inside the Surface at `Status.svelte:110-131`; lanes carry `data-surface`, `Lanes.svelte:212`) | `body.wall .strip` has no `data-surface` exemption: 80 % with blur over the surface. Unmet. | `--panel`. Met by reading; look owed. |
| C6 no wallpaper | `.strip { background: var(--panel) }`. Met. | Unchanged. Met. |
| C7 nested strip (Gallery's Chips strip) | both strips 80 % with blur; `top: var(--group-above)` (:191). Paint unmet. | Both `--panel`; `top` (:191) and the `--group-strip` sum (:173) unchanged. Met by reading; look owed. |
| C8 tree-row strip (`SessionWorkspace.svelte:210-217`, `row`) | 80 % with blur; `.strip:focus-visible` (:206-209). Paint unmet. | `--panel`; `.strip:focus-visible` (:206-209) unchanged. Met by reading. |
| C9 theme switch | paints `var(--panel-on-wall)`, which follows `--panel` (`tokens.css` declaration on body). | Paints `var(--panel)`, the token, so it takes the new theme's colour. Met. |
| C10 `panel_blur` 0, `panel_opacity` 1 | `--wall-panel` at 100 % makes `--panel-on-wall` solid; in a free float and in the tray the strip was popover-mixed (0.97 by default). | Solid everywhere. Outside a free float and the tray nothing changes; inside them the strip goes from 97 % to 100 %. |
| C11 Update tray strips | `body.wall .strip` read the tray's redefinition (`UpdateTray.svelte:265` at the base): popover mix with blur over the tray's popover mix with blur. Unmet. | Strips `--panel`, no blur. The tray (`UpdateTray.svelte:262-265`) paints `color-mix(in srgb, var(--panel) var(--wall-popover), transparent)` with `blur(var(--wall-blur))`, the same values as the base. Met by reading; look owed. |
| C12 docked float (no `data-surface`; it paints transparent, `FloatLayer.svelte:213-215`) | `body.wall .strip`: 80 % with blur. Unmet. | `--panel`, no blur. Met by reading. |
| C13 `stays` header (ruled: Gallery tones table outside a surface, Problems inside one) | `:global(body.wall) .stays th` (`Table.svelte:136-139` at the base): `--panel-on-wall` with blur, in both. Unmet. | `:global(body.wall) .stays th { background: var(--panel); }` (`Table.svelte:135-137`), no backdrop filter, inside a surface or not. The rows' rules (:139-147) are unchanged. Met by reading; look owed. |
| C14 non-`stays` header | `:global(body.wall) th { background: transparent; }` (:132-134 at the base). Met. | The same rule (:131-133). Met. |
| C15 Calendar day headings and list date headings, today's included (tinted pane, `Calendar.svelte:239`) | `body.wall .grid .ec-header, .ec-list .ec-day-head` (:376-380 at the base): popover mix with blur; the chip laid again (:381-383). Unmet. | The two `body.wall` rules are removed, so `.grid :global(.ec-header), .grid :global(.ec-list .ec-day-head) { background-color: var(--panel); }` (:368-371) and `.grid :global(.ec-list .ec-day-head) { background-image: linear-gradient(var(--ec-day-bg-color), ...) }` (:372-374) hold in every mode. Solid, no blur, today's chip kept. `grep -n 'body.wall' Calendar.svelte` prints nothing. Met by reading; look owed. |
| C16 no wallpaper, table and Calendar | `th { background: var(--panel) }` (`Table.svelte:112`); Calendar :369-375 at the base. Met. | Unchanged (`Table.svelte:112`, `Calendar.svelte:368-374`). Met. |
| C17 multi-file diff file header, wallpaper on (ruled) | `:global(body.wall) .header.stays` (`FileHeader.svelte:124-127` at the base): `--chip-on-wall` with blur. Unmet. | `:global(body.wall) .header.stays { background: var(--panel); }` (`FileHeader.svelte:124-126`), no backdrop filter. A header that does not stay keeps `transparent` (:120-122). No rule outside reaches it: `git grep -n 'data-file-header' -- src` lists only `FileHeader.svelte:61`, and no `.header` rule under `diff/` sits outside FileHeader. Met by reading; look owed. |

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 GroupHead: the two `body.wall` strip rules removed | DONE | Verify 2: `grep -n 'body.wall' src/lib/ui/controls/heads/GroupHead.svelte` prints nothing (exit 1). The `.strip` grep is listed under the cases above. |
| 2 GroupHead head comment (lines 15-20) rewritten; the CSS comments of the removed rules gone | DONE | `git diff` of the file. Verify 3: `grep -n -i 'translucent\|panel-on-wall\|wall-popover' GroupHead.svelte` prints `20:    // second translucent layer over that surface.` That line is true: the strip is never a second translucent layer. |
| 3 `tokens.css` comment: the strips that stay over scrolling rows (group heading, sticky table header row, Calendar header rows, the diff's file header) paint the panel solid; the Processes actions column keeps `panel_opacity` | DONE | `git diff` lines 231-249; no token changed (`git diff --numstat`: 13 added, 11 removed, all inside the comment). |
| 4 HELP.md:571 sentence | DONE | `git diff docs/HELP.md`: "A group's heading, a table's header row that stays in place, the Calendar's day and date headings and the file headings of a diff of several files stay solid whatever it is set to, so nothing scrolling under them shows through." |
| 5 UpdateTray: redefinition gone, the tray paints the popover mix directly with its blur | DONE | `UpdateTray.svelte:261-265`; comment "The tray floats over a pane, so it keeps more of its colour than the pane does." |
| 6 Table: a `stays` header row solid `--panel`, no blur; comments true (:21-29, :125-130) | DONE | `Table.svelte:135-137`; `git diff`. |
| 7 Calendar: headings solid `--panel` over a wallpaper, chip kept; comments true (:39-41, :361-365) | DONE | C15 row; `git diff`. |
| 8 FileHeader: `.header.stays` solid `--panel`, no blur; comment (:10-14) true | DONE | `FileHeader.svelte:124-126`; `git diff`. |
| Comments made false elsewhere: `Problems.svelte:47-48`, `Gallery.svelte:36-38` | DONE | `git diff` of both. |
| Verify 1: `npm run diagrams`, then `npm run test:quick` once | DONE | `npm run diagrams` changed no tracked file (`git status --short` after it lists only the step's files and the two brief files). Then `test:quick`: `ok      prettier (0.8 s): All matched files use Prettier code style!`, `ok      ASCII gate (0.9 s)`, `ok      svelte-kit sync (3.0 s)`, `ok      eslint (12.6 s)`, `ok      svelte-check (29.7 s): 1793698583622 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest checks (44.5 s): Duration  32.45s (transform 12.91s, setup 0ms, import 26.27s, tests 49.13s, environment 2ms)`, `test:quick: 47.6 s; every command passed`. |
| Verify 2 | DONE | As item 1. |
| Verify 3 | DONE | As item 2. |
| Verify 4: no test new or changed | DONE | `diff -rq` of `O125-base/{src,tests,utils,config}` against the worktree lists only the 8 source files below; nothing under `tests`. |
| Verify 5: prose and 100-column rewrap | DONE | See "Prose check" below. |
| Verify 6: unused exports | DONE | `sh utils/unused-exports.sh` output compared with `diff ../O125-base/unused-exports.txt <output>`: no difference (exit 0, 338 lines in both). The step added no line. |
| ASCII over the touched files | DONE | `LC_ALL=C grep -n '[^ -~]'` over the 9 changed files prints nothing (exit 1). |
| History words in the added lines | DONE | `git diff -- src docs` added lines grepped for `before`, `used to`, `no longer`, `still`, `always has been`, `always had`, `as before`, `previously`, `the step adds`, `after this package`, a package id and a date: no hit (exit 1). |
| Look in a browser of C1, C2, C4, C5, C6, C7, C11, C13, C15, C17 | NOT DONE by the builder (owed at landing) | A builder runs no page (spec.md:65). See "Before and after". |

`npm run test:quick` ran once. No whole-suite command ran. `npx prettier --check` ran once over the 9 files before the list; it writes nothing.

## Prose check (spec.md:21, :45)

Every new or changed comment line is at or under 100 columns: `awk 'length($0)>100'` over the 8 source files prints only `Problems.svelte:399`, `Gallery.svelte:287`, `:291` and `:310`. None of those four lines is in the diff, and none is a line the step touched. The prose is plain ASCII with no em dash, no quip and no 'not X but Y' construction. HELP.md stays one line per bullet.

Each rewrapped paragraph runs to the column; its last line ends where the sentence ends. Two last lines are short:
- tokens.css ends `on. */`, the end of a paragraph the edit rewrapped as a whole.
- Calendar.svelte:41 ends `panel solid.`, the end of the head comment's paragraph.

## Terms

`docs/glossary.md` does not exist (`ls docs`: apps.md, data-map.md, diagrams, HELP.md, licenses, palette.md, templates.md, third-party.md).

## Files with line counts

From `git diff --numstat -- src docs` (added and removed) and `wc -l` (lines after the change). Every path is on the write list as widened by `O125-cases.md` item 3.

| File | + | - | Lines |
|---|---|---|---|
| `docs/HELP.md` (line 571) | 1 | 1 | 617 |
| `src/lib/shell/rail/UpdateTray.svelte` (261-268) | 2 | 5 | 310 |
| `src/lib/themes/tokens.css` (comment 223-244) | 13 | 11 | 347 |
| `src/lib/ui/controls/heads/GroupHead.svelte` | 6 | 19 | 240 |
| `src/lib/ui/display/table/Table.svelte` | 8 | 10 | 203 |
| `src/lib/views/personal/calendar/Calendar.svelte` (39-40, 360-383) | 6 | 15 | 425 |
| `src/lib/views/sources/repositories/diff/FileHeader.svelte` | 3 | 4 | 164 |
| `src/lib/views/sources/search/Problems.svelte` (47-48) | 1 | 1 | 449 |
| `src/lib/views/system/status/Gallery.svelte` (36-38) | 2 | 2 | 425 |
| `.scratch/migration/agents/reviews/O125-report.md` | new | | this file |

## Judgment calls the brief left open (each reversible)

1. HELP.md names every heading row the step makes solid: group headings, a table's staying header row, the Calendar's headings and the file headings of a multi-file diff. Item 4 named only the group heading. Since items 6 to 8 change what a reader sees in the same way, one sentence covers all four.
2. In Table.svelte, the `stays` header rule is kept as an explicit rule painting `var(--panel)`. The option of narrowing the `transparent` rule to `table:not(.stays)` was not taken, so each of the two outcomes has its own rule.
3. In Calendar.svelte, the two `body.wall` rules are removed, and the existing rules that are not conditioned on a wallpaper (:368-374) now paint every mode. The brief's alternative, laying the chip again after a shorthand, is not needed, because no shorthand remains.
4. Wording of the cross-references: Problems, Gallery, Table, Calendar and FileHeader say "one of the strips of `tokens.css` that paint the panel solid". `ProcessTable.svelte:204-205` is left unedited, as the brief asks, and it stays true: the tokens.css sentence now names the actions column as the strip that keeps a mix.

## Comments and docs re-read

- Still true: `GroupHead.svelte:22-26` (the `--group-strip` paragraph); `tokens.css`'s `--panel-on-wall` comment ("the rows of a table whose header row stays over them"); `tokens.css`'s `--chip-on-wall` comment; `ProcessTable.svelte:204-205`; `DiffSection.svelte:40-42`; `FloatLayer.svelte:207-213`; `Surface.svelte:26-29`; `Pane.svelte`'s wallpaper comments; `config/options/appearance.yml` help for `panel_opacity` and `popover_opacity`; `config/defaults/appearance.yml:98-101`; `HELP.md:295` (Groups).
- Rewritten: the GroupHead head comment; the comments of tokens.css, UpdateTray, Table (the prop doc and the CSS comment), Calendar (head and CSS), FileHeader, Problems and Gallery.
- Grep run: `git grep -n -i -E 'keeps a mix|mix of its own|chip-on-wall' -- src docs README.md ':!config/local.yml'`. The only remaining "mix of its own" is `ProcessTable.svelte:205`, which is true. The `--chip-on-wall` hits are other surfaces (ticker group, the terminal pane header, Tasks, code spans, LockedCode) and are not sticky header rows.

## Before and after (for the look at landing)

Put on a wallpaper with `panel_opacity` 0.8 and a bright picture, then check each view below.

- **Status (Gallery open).** Scroll so the samples pass under the Gallery and Chips strips. Before: both strips showed the chips through them, blurred. After: solid panel bands, and `getComputedStyle(strip).backgroundColor` is `--panel` with alpha 1 and `backdropFilter` `none`. The LineCounts and Hooks strips inside the Status Surface are solid too.
- **Account setup** (tinted pane, provider groups). Before: a slightly darker translucent band. After: solid panel.
- **A view in a free float**, and one in a docked float. Before: the free float's strip at 97 %; the docked one at 80 % with blur. After: both solid.
- **Focus lanes**, and a card or Surface holding a strip. Before: a second translucent layer. After: solid.
- **Update tray** with the Schedules and Tasks groups scrolled. Strips solid. The tray's own fill looks the same: the popover share with blur.
- **Sessions list** workspace groups. Solid band, and the focus outline unchanged on Tab.
- **Status Gallery tones table** (outside a surface) and **Problems** (tinted pane), rows scrolled under the header. Before: the header at 80 % with blur. After: solid panel, no blur. The rows look the same as before.
- **A table without `stays`** (HPC Jobs, Usage History). The header paints nothing, unchanged.
- **Calendar** week view scrolled under the day headings, and list view scrolled under a date heading, today's included. Before: popover share with blur. After: solid panel, with today's chip still on its date heading.
- **Diff view of several files** (a commit or a group diff), scrolled under a file header. Before: chip mix with blur. After: solid panel, no blur. A single-file diff's header still paints nothing.
- **Without a wallpaper** in each view: nothing changes.
- **A theme switch** with the wallpaper on: every one of these bands takes the new theme's panel colour.

## Limitations and sharp edges

- Over a wallpaper the bands are now opaque panel colour inside translucent surfaces (tinted panes, cards, lanes, free floats, the tray). Each band is therefore a stripe darker or lighter than the surface around it, by the surface's missing share of the panel. This is what the rulings ask for, and the look will show how strong the stripe is.
- In a free float and in the Update tray, the strips go from the popover share (0.97 by default) to solid. The difference is small at the default and larger when `popover_opacity` is set low.
- The Processes table's actions column still paints `panel_opacity` with blur over a wallpaper (`ProcessTable.svelte:206-209`). This is out of the step under open item 640.

## Anything in the brief that was wrong or impossible

- C13 named the Processes view's table as a `stays` table outside a surface. It is neither: see the first ruling above, with `Processes.svelte:66`, `:124-126` and `ProcessTable.svelte:136-138`. Ruled in `O125-cases.md` item 1.
- The tokens.css sentence in the brief named three strips. The diff's multi-file header (`FileHeader.svelte:124-127` at the base) was a fourth, which pointed at the same sentence. Ruled in item 2 (item 8, C17).
- The write list left out four comments that items 6 and 7 made false (`Table.svelte:21-29`, `Problems.svelte:47-48`, `Gallery.svelte:36-38`, `Calendar.svelte:39-40`). Ruled in item 3.
- "What it must do" said items 1 to 4. Ruled in item 4.
