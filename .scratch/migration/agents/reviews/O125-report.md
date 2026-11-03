# O125 report: group heading strips, sticky table header rows, the Calendar's header rows and the diff's file header paint solid over a wallpaper

Everything in the brief is done, under the rulings of `agents/briefs/O125-cases.md` (items 1 to 8, cases C1 to C17). The landing's look in a browser is still owed: it is the proof the brief names for C1, C2, C4, C5, C6, C7, C11, C13, C15 and C17, because a builder runs no page.

## Open items of the state file, verbatim

These are quoted from the worktree's copy of `.scratch/migration/orchestrator-state.md:166-167`. The orchestrator says this copy predates rulings 637 and 638 on main's `plan.md`, so 638 still shows here as open.

- Open item 638 (2026-11-03), from O125's /spec. Ruling 637 makes a group's heading strip solid over a wallpaper so nothing scrolling under it shows through. Two other strips that stay in place over scrolling rows have the same show-through and are not group headings, so 637 does not name them: a table's sticky header row, painted at `panel_opacity` over its rows (`src/lib/ui/display/table/Table.svelte:136-139`), and the Calendar's header rows, painted at `popover_opacity` (`src/lib/views/personal/calendar/Calendar.svelte:376-380`). (a) Recommended, a judgment: both paint solid `--panel` over a wallpaper, as a group heading does after O125, so no heading row anywhere has text behind it; one step after O125, two small style rules and the comments that describe them (`tokens.css`'s wallpaper comment among them). (b) Keep both translucent; this is the lazy option, it leaves table and calendar headings readable through over bright rows.
- Open item 639 (2026-11-03), from Axel's look at the Sessions tab of the Explorer. Seen on 8790: the list's fold, its group strips (research-hub, Terminals) and the Details section follow each other with no line between them; the group strips are `GroupHead` bands with a fold glyph and bold words (`SessionWorkspace.svelte:210`, `TerminalRows.svelte:117`), unlike the tree rows around them; in Changes, 'Touched by this session' and 'The repository' are flat capital sub-headings that do not fold and carry no count (`ChangesTouched.svelte:42`, `ChangesRepo.svelte:66`), and Changed and Untracked are `ChangeGroups.svelte`'s always-open heads, where the Repositories view draws its groups as tree rows that fold, with the count as a badge at the right edge (`views/sources/repositories/changes/Changes.svelte:290-358`); Details is a block of capital labels, a select, a text field, three buttons and wrapping measurement lines (`DetailsBody.svelte`). Three parts. Part 1, the divider: (a) recommended, a judgment: a 1 px line in `--line` across the pane between the list's fold and the first section, in the Sessions tab only; (b) leave it, the lazy option. Part 2, the headings: (a) recommended, a judgment: every heading inside the Sessions tab and a Session tab becomes a group row of the Repositories look (fold chevron, the words in normal case at the row's size, the count as a badge at the right edge, one step in, folding, its fold kept in the tab's state, its actions on hover): the workspace groups, Terminals, Touched by this session, the repository, and Merge, Staged, Changed and Untracked; the repository's groups are drawn by the Repositories view's own Changes partial, so the session's changes gain what that view has (list and tree mode, selection, the right-click menu, virtual rows for long lists) and `ChangeGroups.svelte` is deleted; (b) only restyle the heads and keep `ChangeGroups.svelte` as a second implementation of the same groups, the lazy option. Part 3, Details: (a) recommended, a judgment: Details becomes rows of the tree in the Files look, in three group rows of part 2's look, Session (title, folder, branch, kind, status, pid, version, started, hook), Model (model, effort, mode) and Usage (context with its meter in the row, tokens, prompt cache), each one line with its name muted at the left and its value at the right, cut with the whole value in its tooltip; the controls become icon actions on the Details head: Rename (opening the title field the list's double press opens), Pin (a menu of the areas, as the select offers), Resume (asking once, as now) and Open the transcript; nothing shown now is dropped; (b) keep the block and fix only the wrapping lines, the lazy option.

## The cases' first run, the rulings, and the result after the change

How the rules rank: Svelte scopes each component's selectors to that component. On the unchanged tree, `:global(body.wall) .strip` (`GroupHead.svelte:213-216` at the base) beat the base `.strip`, and `:global(body.wall [data-float-place='free']) .strip` (:219-222 at the base) beat both. Nothing outside the component reaches a GroupHead strip:
- `grep -rn '\.strip\b' src | grep -v heads/GroupHead.svelte` lists `.strip` selectors only in `Tabs.svelte:386,401,434`, `ActionStrip.svelte:81` and `SplitView.svelte:195,202`, all scoped to their own component, and `TabFace.svelte:226,324-327,331`. The TabFace rules are `:global(.strip.unfocused) .tab...`: they need the class `unfocused`, which a GroupHead strip never carries, and they target `.tab`.
- The `h3` rules in `src` are listed by `grep -rn -E '(^|[ ,>(])h3([ ,:{)]|$)' src`, comment lines and markup left out. None of them reaches a GroupHead strip's paint, and none sets a background:
  - Five are scoped to their own component, so each matches only that component's own markup: `ScheduleDialog.svelte:253,258`, `GitSteps.svelte:212`, `AccountSetup.svelte:203` and `Cluster.svelte:162`. They set margin, font size and weight.
  - `Markdown.svelte:259,273` (`.doc :global(h3)`) and `TurnList.svelte:233,244` (`.answer :global(.doc h3)`) need a `.doc` ancestor, which no GroupHead strip has. They set margin, colour, font size and width.
- `--panel-on-wall` was redefined only at `UpdateTray.svelte:265` (base) and at `Pane.svelte:71`, the latter only with a `share` (`grep -rn -- '--panel-on-wall:' src` and `grep -rn 'style:--panel-on-wall' src`; after the change they list only the declaration in `tokens.css` and `Pane.svelte:71`).

After the change, `grep -n 'background\|backdrop' src/lib/ui/controls/heads/GroupHead.svelte` prints:

```
15:    // between the heading and what it heads. It paints the pane's background (`--panel`) solid in
200:        background: var(--panel);
```

Line 15 is a comment, so the base rule `.strip { ... background: var(--panel); ... }` (`GroupHead.svelte:189-203`) is the only paint rule. It decides every strip case, with no backdrop filter.

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
| C15 Calendar day headings and list date headings, today's included (tinted pane, `Calendar.svelte:240` after the change) | `body.wall .grid .ec-header, .ec-list .ec-day-head` (:376-380 at the base): popover mix with blur; the chip laid again (:381-383). Unmet. | The two `body.wall` rules are removed, so `.grid :global(.ec-header), .grid :global(.ec-list .ec-day-head) { background-color: var(--panel); }` (:368-371) and `.grid :global(.ec-list .ec-day-head) { background-image: linear-gradient(var(--ec-day-bg-color), ...) }` (:372-374) hold in every mode. Solid, no blur, today's chip kept. `grep -n 'body.wall' Calendar.svelte` prints nothing. Met by reading; look owed. |
| C16 no wallpaper, table and Calendar | `th { background: var(--panel) }` (`Table.svelte:112`); Calendar :369-375 at the base. Met. | Unchanged (`Table.svelte:112`, `Calendar.svelte:368-374`). Met. |
| C17 multi-file diff file header, wallpaper on (ruled) | `:global(body.wall) .header.stays` (`FileHeader.svelte:124-127` at the base): `--chip-on-wall` with blur. Unmet. | `:global(body.wall) .header.stays { background: var(--panel); }` (`FileHeader.svelte:124-126`), no backdrop filter. A header that does not stay keeps `transparent` (:120-122). No rule outside reaches it: `grep -rn 'data-file-header' src` lists only `FileHeader.svelte:61`, and `grep -rn -E '\.header\b' src/lib/views/sources/repositories/diff \| grep -v FileHeader.svelte` prints nothing. Met by reading; look owed. |

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 GroupHead: the two `body.wall` strip rules removed | DONE | Verify 2: `grep -n 'body.wall' src/lib/ui/controls/heads/GroupHead.svelte` prints nothing (exit 1). The `.strip` grep is listed under the cases above. |
| 2 GroupHead head comment (lines 15-20) rewritten; the CSS comments of the removed rules gone | DONE | `git diff` of the file. Verify 3: `grep -n -i 'translucent\|panel-on-wall\|wall-popover' GroupHead.svelte` prints `20:    // second translucent layer over that surface.` That line is true: the strip is never a second translucent layer. |
| 3 `tokens.css` comment: the strips that stay over scrolling rows (group heading, sticky table header row, Calendar header rows, the diff's file header) paint the panel solid; the Processes actions column keeps `panel_opacity` | DONE | The comment at `tokens.css:223-245`, rewrapped as a whole paragraph (Repair round 1). No token changed (`git diff --numstat`: 23 added, 22 removed, all inside the comment). |
| 4 HELP.md:571 sentence | DONE | `git diff docs/HELP.md`: "A group's heading, a table's header row that stays in place, the Calendar's day and date headings and the file headings of a diff of several files stay solid whatever it is set to, so nothing scrolling under them shows through." |
| 5 UpdateTray: redefinition gone, the tray paints the popover mix directly with its blur | DONE | `UpdateTray.svelte:261-265`; comment "The tray floats over a pane, so it keeps more of its colour than the pane does." |
| 6 Table: a `stays` header row solid `--panel`, no blur; comments true (:21-29, :125-130) | DONE | `Table.svelte:135-137`; `git diff`. |
| 7 Calendar: headings solid `--panel` over a wallpaper, chip kept; comments true (:39-41, :363-367) | DONE | C15 row; `git diff`. |
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

Every new or changed comment line is at or under 100 columns: `awk 'length($0)>100'` over the 9 source files prints only `Problems.svelte:399`, `Gallery.svelte:287`, `:291` and `:310`. None of those four lines is in the diff, and none is a line the step touched. The prose is plain ASCII with no em dash, no quip and no 'not X but Y' construction. HELP.md stays one line per bullet.

Every comment paragraph the step edited is wrapped as a whole at 100 columns. The measurement is the review's: a line is short when its length plus one plus the length of the next line's first word is at most 100. It was run over each whole paragraph except its last line (the command is quoted in "Repair round 1"), and it reports no short line in any of these:
- `tokens.css:223-245`;
- `Table.svelte:22-28` and `:125-130`;
- `GroupHead.svelte:11-20`;
- `Calendar.svelte:32-41` and `:363-367`;
- `FileHeader.svelte:10-14`;
- `Problems.svelte:47-48`;
- `Gallery.svelte:34-38`.

The last line of each paragraph ends where its sentence ends.

## Terms

`docs/glossary.md` does not exist (`ls docs`: apps.md, data-map.md, diagrams, HELP.md, licenses, palette.md, templates.md, third-party.md).

## Files with line counts

From `git diff --numstat -- src docs` (added and removed) and `wc -l` (lines after the change). Every path is on the write list, as widened by `O125-cases.md` item 3 and by `O125-round1.md` item 2 (`FloatLayer.svelte` line 137).

| File | + | - | Lines |
|---|---|---|---|
| `docs/HELP.md` (line 571) | 1 | 1 | 617 |
| `src/lib/shell/rail/UpdateTray.svelte` (261-268) | 2 | 5 | 310 |
| `src/lib/shell/panes/floats/FloatLayer.svelte` (line 137, Repair round 1) | 0 | 1 | 230 |
| `src/lib/themes/tokens.css` (comment 223-244 at the base) | 23 | 22 | 346 |
| `src/lib/ui/controls/heads/GroupHead.svelte` | 6 | 19 | 240 |
| `src/lib/ui/display/table/Table.svelte` | 13 | 15 | 203 |
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

- Still true: `GroupHead.svelte:22-26` (the `--group-strip` paragraph); `tokens.css`'s `--panel-on-wall` comment ("the rows of a table whose header row stays over them"); `tokens.css`'s `--chip-on-wall` comment; `ProcessTable.svelte:204-205`; `DiffSection.svelte:40-42`; `FloatLayer.svelte:206-212`; `Surface.svelte:26-29`; `Pane.svelte`'s wallpaper comments; `config/options/appearance.yml` help for `panel_opacity` and `popover_opacity`; `config/defaults/appearance.yml:98-101`; `HELP.md:295` (Groups).
- Rewritten: the GroupHead head comment; the comments of tokens.css, UpdateTray, Table (the prop doc and the CSS comment), Calendar (head and CSS), FileHeader, Problems and Gallery.
- Grep run: `grep -rn -i -E 'keeps a mix|mix of its own' src docs README.md` (and over `config` with `--exclude=local.yml`, which prints nothing). The only hit is `ProcessTable.svelte:205`, which is true. `grep -rn 'chip-on-wall' src docs README.md` lists `Pane.svelte:253`, `TickerGroup.svelte:140`, `Code.svelte:77`, `RenderedMarkdown.svelte:187`, `Tasks.svelte:195`, `LockedCode.svelte:50` and the declaration in `tokens.css`. These are other surfaces (the terminal pane header, the ticker group, code spans, rendered prose, Tasks, LockedCode), none of them a sticky header row.

## Before and after (for the look at landing)

Put on a wallpaper with `panel_opacity` 0.8 and a bright picture, then check each view below.

- **Status (Gallery open).** Scroll so the samples pass under the Gallery and Chips strips. Before: both strips showed the chips through them, blurred. After: solid panel bands, and `getComputedStyle(strip).backgroundColor` is `--panel` with alpha 1 and `backdropFilter` `none`. The LineCounts and Hooks strips inside the Status Surface are solid too.
- **Account setup** (tinted pane, provider groups). Before: the strip's `--panel-on-wall` over the tinted pane's own `--panel-on-wall` added up to about 96 % of the panel colour at `panel_opacity` 0.8 (1 - 0.2 x 0.2). In a dark theme, where the panel is darker than the picture, that is a band slightly darker than the pane; in a light theme, a band slightly lighter than the pane. After: solid panel, a little darker than the pane in a dark theme and a little lighter in a light one, since the pane shows 20 % of the picture.
- **A view in a free float**, and one in a docked float. Before: the free float's strip at 97 %; the docked one at 80 % with blur. After: both solid.
- **Focus lanes**, and a card or Surface holding a strip. Before: a second translucent layer. After: solid.
- **Update tray** with the Schedules and Tasks groups scrolled. Before: each strip painted the popover share of the panel (0.97 by default) with blur, over the tray's own popover-share fill, so rows passing under it showed faintly. After: strips solid panel. The tray's own fill looks the same: the popover share with blur.
- **Sessions list** workspace groups (tree-row strips). Before: the strip painted `--panel-on-wall` (80 %) with blur, so rows scrolled under it showed through blurred. After: solid band, and the focus outline unchanged on Tab.
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
- Brief item 1 named a `git grep` (`git grep -n '\.strip' -- src`). The rules file's "Where you work" section does not allow a builder that command: a builder runs only `git status`, `git diff` and `git show`. The brief and the rules file clash here, and the builder ran the brief's `git grep`. The report's other `git grep` lines (on `--panel-on-wall`, `data-file-header` and "mix of its own") were the builder's own. Each `git grep` was read-only and changed nothing. Each one is replaced in this report by its plain `grep` equivalent, and those were run after the last change. No `git grep` ran in repair round 1.

## Repair round 1

Everything in `agents/briefs/O125-round1.md` is done.

**Item 1 (S1), the rewrap.** The comment paragraph `src/lib/themes/tokens.css:223-245` (the whole paragraph, the lines the step had not edited included) is rewrapped at 100 columns. So are `Table.svelte`'s `stays` prop doc (:22-28) and its CSS comment (:125-130). The words are unchanged. The check compared the word stream of each paragraph before and after the rewrap (`tr -s ' \n' '\n\n'` on both, then `diff`). The only differences were the moved ` * ` line prefixes of the prop doc; the scratch files of that check were removed. The measurement, run after the last change:

```
$ m() { awk -v a=$2 -v b=$3 -v f=$1 'NR>=a && NR<=b+1 {L[NR]=$0} END {for (i=a;i<b;i++) {n=L[i+1]; sub(/^[ \t]*(\*|\/\*)?[ \t]*/,"",n); split(n,w," "); print f":"i": "length(L[i])" + 1 + "length(w[1])" ("w[1]") = "length(L[i])+1+length(w[1]) (length(L[i])+1+length(w[1])<=100 ? "  SHORT" : "")}}' $1; }; m src/lib/themes/tokens.css 223 245; m src/lib/ui/display/table/Table.svelte 22 28; m src/lib/ui/display/table/Table.svelte 125 130
src/lib/themes/tokens.css:223: 98 + 1 + 3 (the) = 102
src/lib/themes/tokens.css:224: 95 + 1 + 9 (component) = 105
src/lib/themes/tokens.css:225: 97 + 1 + 3 (the) = 101
src/lib/themes/tokens.css:226: 99 + 1 + 6 (layers) = 106
src/lib/themes/tokens.css:227: 95 + 1 + 8 (nothing,) = 104
src/lib/themes/tokens.css:228: 97 + 1 + 8 (surface,) = 106
src/lib/themes/tokens.css:229: 99 + 1 + 2 (of) = 102
src/lib/themes/tokens.css:230: 98 + 1 + 7 (surface) = 106
src/lib/themes/tokens.css:231: 85 + 1 + 16 (`editor.opacity`) = 102
src/lib/themes/tokens.css:232: 90 + 1 + 15 (`panel_opacity`) = 106
src/lib/themes/tokens.css:233: 99 + 1 + 5 (strip) = 105
src/lib/themes/tokens.css:234: 98 + 1 + 6 (sticky) = 105
src/lib/themes/tokens.css:235: 97 + 1 + 6 (paints) = 104
src/lib/themes/tokens.css:236: 97 + 1 + 7 (actions) = 105
src/lib/themes/tokens.css:237: 94 + 1 + 7 (panel's) = 102
src/lib/themes/tokens.css:238: 94 + 1 + 6 (solid,) = 101
src/lib/themes/tokens.css:239: 100 + 1 + 7 (surface) = 108
src/lib/themes/tokens.css:240: 96 + 1 + 7 (halves.) = 104
src/lib/themes/tokens.css:241: 96 + 1 + 5 (thing) = 102
src/lib/themes/tokens.css:242: 100 + 1 + 4 (drag) = 105
src/lib/themes/tokens.css:243: 99 + 1 + 7 (confirm) = 107
src/lib/themes/tokens.css:244: 94 + 1 + 7 (surface) = 102
src/lib/ui/display/table/Table.svelte:22: 100 + 1 + 2 (up) = 103
src/lib/ui/display/table/Table.svelte:23: 98 + 1 + 7 (`stays`) = 106
src/lib/ui/display/table/Table.svelte:24: 100 + 1 + 5 (while) = 106
src/lib/ui/display/table/Table.svelte:25: 97 + 1 + 3 (and) = 101
src/lib/ui/display/table/Table.svelte:26: 99 + 1 + 5 (them,) = 105
src/lib/ui/display/table/Table.svelte:27: 96 + 1 + 8 (nothing.) = 105
src/lib/ui/display/table/Table.svelte:125: 98 + 1 + 7 (slide's) = 106
src/lib/ui/display/table/Table.svelte:126: 100 + 1 + 4 (they) = 105
src/lib/ui/display/table/Table.svelte:127: 95 + 1 + 6 (solid,) = 102
src/lib/ui/display/table/Table.svelte:128: 99 + 1 + 5 (panel) = 105
src/lib/ui/display/table/Table.svelte:129: 94 + 1 + 6 (inside) = 101
```

No line is marked `SHORT`, and no line passes 100. The last line of each paragraph is not measured: `tokens.css:245` (`surface their control sits on. */`), `Table.svelte:28` (`nothing.`) and `:130`. The same measurement, printing only short lines, ran with `//` prefixes allowed over the step's other edited comments: `GroupHead.svelte` 11-20, `Calendar.svelte` 32-41 and 363-367, `FileHeader.svelte` 10-14, `Problems.svelte` 47-48 and `Gallery.svelte` 34-38. It printed nothing.

**Item 2 (S2), the attribute no code reads.** Before the removal:

```
$ grep -rn 'float-place\|floatPlace' src tests utils docs
src/lib/shell/panes/floats/FloatLayer.svelte:137:        data-float-place={place.kind === 'dock' ? place.edge : 'free'}
```

`grep -rn --exclude=local.yml 'float-place\|floatPlace' config README.md` printed nothing (exit 1). The line is removed from `FloatLayer.svelte`. After the removal, the same `grep -rn 'float-place\|floatPlace' src tests utils docs` prints nothing (exit 1). `data-surface` (`FloatLayer.svelte:137` after the change) and the `.dock` and `.free` classes stay. They are what the float's own rules read (`FloatLayer.svelte:213-219`). No comment named the attribute.

**Item 3 (P1, P2, P3, B1), the report.**
- P1: the GroupHead `background\|backdrop` grep is quoted as it prints, both lines, under "The cases' first run".
- P2: the `h3` sentence is replaced by the list of every `h3` rule in `src` and why none reaches the strip.
- P3: the `file:line` references are taken after the last change: `Calendar.svelte:240`, `:363-367`, `FloatLayer.svelte:213-215` and `:206-212`, and `tokens.css:223-245`. The files table is updated.
- B1: "Before and after" gives a before for the Update tray and the Sessions list strips, and the Account setup before for a dark and for a light theme.

**Item 4 (S3), git grep.** Stated under "Anything in the brief that was wrong or impossible". The `git grep` lines are replaced by their plain `grep` equivalents, run after the last change. No `git grep` ran in this round.

**Verify, after the last change of the round:**

```
$ npm run diagrams   (exit 0; `git status --short` after it lists only the step's 10 files, the brief and the three ledger files of the round)
$ npm run test:quick
test:quick: 15 changed file(s), from git since HEAD
test:quick: 9 test file(s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.5 s)
ok      svelte-check (8.7 s): 1793699726021 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (8.9 s)
ok      vitest checks (38.6 s): Duration  27.98s (transform 11.96s, setup 0ms, import 24.61s, tests 35.87s, environment 2ms)
test:quick: 41.2 s; every command passed

$ grep -n 'body.wall' src/lib/ui/controls/heads/GroupHead.svelte
(nothing; exit 1)

$ grep -n -i 'translucent\|panel-on-wall\|wall-popover' src/lib/ui/controls/heads/GroupHead.svelte
20:    // second translucent layer over that surface.

$ sh utils/unused-exports.sh > <scratchpad>/ue-r1.txt; diff ../O125-base/unused-exports.txt <scratchpad>/ue-r1.txt
(nothing; exit 0)

$ LC_ALL=C grep -n '[^ -~]' <the 10 changed files>
(nothing; exit 1)

$ git diff -- src docs | grep '^+' | grep -v '^+++' | grep -i -E "before|used to|no longer|still|always|as before|previously|the step|after this|O1[0-9][0-9]|2026"
(nothing; exit 1)
```

Line 20 of GroupHead is true: the strip is never a second translucent layer. No test is new or changed: `diff -rq` of `O125-base/{src,tests,utils,config}` against the worktree lists only the 9 source files, nothing under `tests`. `npm run test:quick` ran once in this round, and no whole-suite command ran. `npx prettier --check` over `tokens.css`, `Table.svelte` and `FloatLayer.svelte` printed `All matched files use Prettier code style!` before the list.

**The round's files** (from `git diff --numstat` against the base, and `wc -l`):

| File | + | - | Lines |
|---|---|---|---|
| `src/lib/themes/tokens.css` | 23 | 22 | 346 |
| `src/lib/ui/display/table/Table.svelte` | 13 | 15 | 203 |
| `src/lib/shell/panes/floats/FloatLayer.svelte` | 0 | 1 | 230 |
| `.scratch/migration/agents/reviews/O125-report.md` | corrected and appended | | |

The figures are the whole step's against the base; the round changed only the three source files above. Nothing in the round is visible: the rewrap changes comments only, and no rule read the removed attribute. The before-and-after section therefore gains nothing from the round beyond B1's corrections.
