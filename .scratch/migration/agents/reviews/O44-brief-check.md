# Step O44 brief check (on main at 7673eb2de)

The brief check of `tools/oculus/.scratch/migration/agents/briefs/O44.md`. The tree was read at 7673eb2de. `plan.md` was read in its working copy, whose uncommitted diff adds the O44 Step 0 lines (`git diff .scratch/migration/plan.md`). I changed no file and ran no git command other than `git log`, `git status` and `git diff`.

## 1. Names

- `tinted`: `grep -rn "tinted" tests src config docs DESIGN.md HELP.md README.md utils | grep -v "<Pane"`. Hits outside the brief's paths:
  - `tests/checks/tree/duplication.test.ts:535` is a synthetic fixture. The change does not make it false.
  - `src/lib/views/shared/sessions/SteerBox.svelte:170`, `sessions/terminal/start/Composer.svelte:510`, `sessions/terminal/start/AttachPicker.svelte:117` and `personal/memories/Memories.svelte:363` describe views that are already tinted. They stay true.
  - `src/lib/views/shared/prose/Markdown.svelte:68-71` reads "a view drawing it on a box that paints nothing (the project view) needs" a surface under a fenced block. `:343-348` paints `.doc.surfaced pre` with `--chip-on-wall`, and `surface = true` is the default (`:82`). `Project.svelte:150` and `boards/entry/EntryFolder.svelte:88` draw `<Markdown` with that default. Once Project's documents section is on the wallpaper surface (class 2) or its box is tinted, the code block's chip surface becomes a second layer, and the comment's "(the project view)" becomes false. `Markdown.svelte` is not in the paths.
- The pane box paints nothing: `grep -rn "pane inside draws nothing" src`. `src/lib/shell/panes/floats/FloatLayer.svelte:205-207` reads "The pane inside draws nothing over a wallpaper, so these are the floats' fill". This is already false for the 36 tinted views, and more false after the change. A float's fill (`:209-215`) plus a tinted box or a surface is a stack of two layers. The file is not in the paths.
- Class 3 "a frame of ... an app": `grep -n -i "wallpaper" DESIGN.md docs/apps.md`. `DESIGN.md:391` reads "With the wallpaper on the frame element paints nothing and a document the app leaves transparent shows the picture; the app's own surfaces are the app's to paint", and `docs/apps.md:447` reads "With the wallpaper on, the page paints no background". The brief classes AppFrame's content as "its own surface edge to edge", which these sentences contradict. Tinting AppFrame instead would make them false. Neither line is in the paths, which name DESIGN.md 245-254 and 656-659 only.
- `Empty`: `grep -rln "frame/Empty.svelte" src/lib` finds 88 files. Two are outside the views: `src/lib/shell/panes/PaneBody.svelte:339` (the empty pane's message) and `src/lib/shell/panes/leaf/Failed.svelte:28` (a failed view). The change gives both the surface. No sentence becomes false, but it is a visible change outside the 30 views that no case and no before-and-after names.
- `Intro`: `grep -rln "prose/Intro.svelte" src/lib`. It is also drawn in the tinted `AccountSetup`, `Slides` and `Search`, and in `feeds/radar/RadarIntro.svelte`. The rule "paints nothing inside a tinted pane" covers them; nothing becomes false.
- `RegistryHead`: `grep -rln "RegistryHead.svelte" src/lib` finds Venues, Domains, Data and Pillars, all in the 30. No hit is outside the paths.
- `Stats`: `grep -rln "projects/Stats.svelte\|'./Stats.svelte'" src/lib` finds Projects only. No hit is outside the paths.
- `measure`, `fit`, `watchToolbar`: `grep -rn "watchToolbar" ...` and `grep -rn "toolbar/fit\|from './fit'" ...` over src, tests, config, docs, DESIGN.md, HELP.md and README.md. The only hits are `Toolbar.svelte:29-30,99` and `watch.ts:7`. No hit is outside the paths.
- `.tools`: `grep -rn "\.tools\b" src tests docs DESIGN.md HELP.md README.md`. The CSS class is in `Pane.svelte:144`. `CommitBox.svelte:286` is its own scoped class, and the rest are JS property names. No hit is outside the paths.
- `Surface` (the new primitive): `grep -rn "Surface\.svelte\|\bSurface\b" src tests config docs DESIGN.md HELP.md README.md` prints nothing, so the name is free. Markdown already has a prop `surface` (`Markdown.svelte:73`) and a class `surfaced` (`:238`) with a different meaning: a fenced block's own chip surface. No sentence becomes false, but the two names are close.

Findings:
1. `Markdown.svelte:68-71` and the default `surface = true` will be false, or will draw a second layer, for `Project.svelte:150` and `EntryFolder.svelte:88` once their documents are on a surface. `Markdown.svelte` is outside the paths.
2. `FloatLayer.svelte:205-207` is false. A view in a float stacks the float's fill (`:209-215`) under a tinted box or a surface. The file is outside the paths.
3. `DESIGN.md:391` and `docs/apps.md:447` contradict the brief's class 3 reading of AppFrame, and both are outside the paths.
4. The change to `Empty` reaches the shell's `PaneBody.svelte:339` and `Failed.svelte:28`. No case names that change.

## 2. The step line

- "every view is read under rice": Part 2 reads only the 30 untinted views. The 36 tinted views are not read.
- "each text drawn outside a card gets a surface": Part 2, classes 1 to 3.
- "`tinted` on the Pane of a view whose content is rows or prose (History, Processes, Apps among them)": Part 2 class 1, cases 6 to 8.
- "the wallpaper surface on the parts of card views that sit outside a card (a collection's intro, Focus's Awaiting a response, Literature search's messages and count, Gallery's table and meters)": Part 2 class 2, decision 2, cases 9 to 12.
- "each checked on TEST under rice": the look on landing, cases 6 to 15.
- "W3's ruling carried out for every view": Part 2, and the DESIGN.md bullet that keeps line 658.
- "runs after O38 (ruling 177)": O38 is landed (`plan.md:2735`). It needs no requirement.
- Step 0 at `plan.md:625` ("the Project, Inbox, Calendar and similar views ... Find every view that shows it and fix the cause"): Part 1 covers Inbox and Calendar (AccountActions), Entry and the 24 files. The "Project" view is not mapped: `Project.svelte:107` is `<Pane title={title()}>` with no toolbar, and the brief never says which view Axel meant or what flashes there.
- Step 0 cause at `plan.md:626` ("Fix: the toolbar reads widths and room in the same fractional unit, and its room does not depend on whether the opener is drawn"): Part 1 bullets 1 and 2, decision 1, cases 1 to 5.
- Step 0 at `plan.md:627` ("on the Focus board, the Command Center's ... line is drawn larger ... the needs-attention lines `.behind` (`CommandCenterView.svelte:348-352`) ... and the awaiting names `.wait-names` (`Focus.svelte:250-254`) kept `--fs-md`. Fix in this step: those rows take the ticker's size and line height, and every other row text of the Focus board is read for the same mismatch"): no requirement, no case and no path. `CommandCenterView.svelte` and `ui/display/ticker/Ticker.svelte` are not in "Paths this step writes". I confirmed the line on the tree: `CommandCenterView.svelte:350` has `font-size: var(--fs-md)`, `Focus.svelte:252` has `font-size: var(--fs-md)`, and `Ticker.svelte:144` has `font-size: var(--fs-xs)`.

Findings:
1. The Focus font-size Step 0 (`plan.md:627`) is missing from the brief: no requirement in "What to build", no case, and no path for `CommandCenterView.svelte`.
2. "every view is read under rice" has no requirement for the 36 tinted views. Part 2 reads only the 30, so a second layer inside a tinted view goes unread. For example, `Calendar.svelte:375-378` paints `.ec-header` with a `--wall-popover` mix inside the tinted Calendar box.
3. The "Project" view of Step 0 (`plan.md:625`) is mapped to no view. `Project.svelte:107` draws no header toolbar.

## 3. Premises

- The base copy and its `unused-exports.txt`: `ls /Users/axelfaes/workspace/research-hub/.agents/worktrees/O44-base` prints "No such file or directory". The worktree `migration-O44` is also absent. `/spec` makes both after this check, so this is not a mismatch yet. They must exist before dispatch.
- Ruling 177 (a): `plan.md:2275`, and the options at `orchestrator-history.md:6`, where "(b) Tint every pane ... against: the cards become a second translucent layer" is written. Matches.
- `Pane.svelte:90-106`: `sed -n 87,106p` shows the transparent box (`:90-92`), the tinted mix with blur (`:96-99`), and the rice header that is transparent inside a tinted box (`:103-106`). Matches.
- `DESIGN.md:249`: `sed -n 249p` holds "one translucent layer over the picture and never two ... each component that paints a surface declares under `body.wall` what its surface does". Matches.
- The 66, 36 and 30 counts and the list of 30: a Python scan of every `<Pane\b(.*?)>` with re.S over `src/lib/views` printed `66 36 30 30`, and the 30 files are the brief's list exactly. Matches.
- `Empty.svelte` 109 lines, `Intro.svelte` 90, `RegistryHead.svelte` 56, `Stats.svelte` 82: `wc -l` matches. `grep -n "wall\|background"` over each prints only `Empty.svelte:65: background: var(--c-red-bg);`. Matches.
- The `said` paragraph in the ten views: `grep -rn -A1 "{#if said !== ''}" src/lib` shows `<p class="said">` in Collection:381, Entry:267, Focus:185, Project:114, Projects:337, Inbox:190, Leads:189, Linkedin:200, Literature:196 and Radar:119. Matches. The same markup is also in `Calendar.svelte:243`, which is tinted, and in `shared/forms/accounts/AccountList.svelte:158`, which Inbox draws.
- The cited surfaces: `sed -n` over each range shows `ProcessTable.svelte:133-135` and `:202-204`, `History.svelte:468-469`, `Table.svelte:115-117`, `Card.svelte:143-145`, and `Band.svelte:206-208` and `:252`, each as the brief says. Matches.
- The 24 overflow toolbars: `grep -rln "<Toolbar[^>]*overflow" src | wc -l` prints 24. A multi-line-aware Python scan also finds 24, all with one-line tags. Matches. Line 28 says "24 views", but these are 24 files. `AccountActions` is drawn in Calendar and Inbox, and `SourceToolbar` in Leads, Radar and `RegistryTools` (`grep -rln "AccountActions.svelte\|SourceToolbar.svelte" src/lib`), so more than 24 views carry one.
- `measure()` at `Toolbar.svelte:75-94`, `.tools` at `Pane.svelte:144-151` with `flex: 0 0 auto`, and the Toolbar at 300 lines: `cat -n` matches.
- The arithmetic, read from the code (the browser figures themselves cannot be rerun here):
  - `measure()` passes `controls.map((one) => one.offsetWidth)` (`:82`) and `root.clientWidth` (`:83`), both integers, to `fit()`.
  - `fit()` (`fit.ts:23-24`) compares the sum plus `gap * (n - 1)` with the room: 29 + 4 + 29 = 62 > 61, so the opener is drawn with `shown` 1.
  - `.toolbar.overflow` has no flex grow (`Toolbar.svelte:210-219`), and `.tools` is `flex: 0 0 auto` (`Pane.svelte:145`), so the root is as wide as its content. A clipped control keeps its box (`visibility: hidden`, `:239-241`), so the opener widens the root by the 4 px gap plus the opener.
  - Next measure: everything fits, `shown` becomes null, the opener goes (`:153`), the root shrinks, and the ResizeObserver on `root` (`watch.ts:15`) fires again. The cycle follows from the code.
  - The 30.7 px shift equals 91.8 - 61.125 = 30.675, which is the gap plus an opener of 26.675 px. That is `--header-action` (`tokens.css:196`, `calc(20px * var(--text-scale, 1))`) at a text scale near 1.334, consistent with the probe in `openerWidth()` (`:64-72`).
  - The cycle needs a box sized by its own content. It cannot happen while `.tools` is capped by its `max-width`, so it does not happen on a narrow pane, which agrees with "a pane wide enough" in case 1.
- `fit.ts` untested: `grep -rln "toolbar/fit" tests` prints nothing (rc 1). Matches.
- `guarded.md`: `grep -n -i "toolbar\|overflow\|tinted\|wall" agents/guarded.md | wc -l` prints 2. `grep -o` shows `57:toolbar.test.ts`, which is `tests/shell/commands/debug/debug-toolbar.test.ts` under G77, the app debug toolbar, and `75:wallpaper.image`. The brief says it prints "only a line about `wallpaper.image`".
- The verify list: the state file's block reads `verify: - npm run test:quick`. Matches.
- `ls docs/adr` prints "No such file or directory". Matches.
- Facts the brief does not state:
  - `git ls-files src/lib/ui/frame | awk -F/ '{print $5}' | sort -u` lists 10 items, and `git ls-files src/lib/views/shared/prose | awk -F/ '{print $6}' | sort -u | wc -l` prints 10. `utils/folder-check.sh` refuses a folder over ten. Decision 2's `src/lib/ui/frame/Surface.svelte` and decision 3's new component in `src/lib/views/shared/prose/` would each make 11.
  - `tokens.css:221-238` already states the rule for a strip that stays in place over scrolling rows: "keeps a mix of its own (`popover_opacity` of the panel's colour for the Calendar's header rows, `panel_opacity` for a table's sticky header row)". The brief changes that rule for `Table.svelte`'s `th` and for ProcessTable, and does not cite it.
  - `wc -l` over the 30 views: `Diff.svelte` 520, `Source.svelte` 519, `Present.svelte` 515, `File.svelte` 510, `Collection.svelte` 506. One line added to Diff passes 520 and forces a split, and the split files are not in the paths.
  - `ls docs/glossary.md` prints "No such file or directory", yet the report shape asks for "each term of `docs/glossary.md`". The configured standards are `[tools/oculus/.scratch/migration/agents/spec.md]` (state file block), and spec.md has no rule on list items or sentence length. Verify item 7 asks for both.

Findings:
1. The guarded.md grep prints two lines, not one. The extra line, `agents/guarded.md:57` (`tests/shell/commands/debug/debug-toolbar.test.ts`), is unrelated to this step.
2. `src/lib/ui/frame` and `src/lib/views/shared/prose` already hold ten items each. The path decision 2 dictates, and the component decision 3 allows, break spec.md "At most ten tracked items in a folder", and the brief says nothing about the split this forces.
3. `tokens.css:221-238`, the rule the step revises for sticky strips, is missing from "What is on the tree".
4. `docs/glossary.md` does not exist (report shape, "The terms"). The configured standards hold no rule on list items or sentence length (verify item 7).
5. "24 views" (line 28) is 24 files. The views that draw them are more than 24.
6. The paths list omits the shared `said` component that decision 3 allows (`src/lib/views/shared/prose/`), and any file a size split creates (Diff.svelte is at 520).

## 4. Cases and checks

- Cases 1 to 4: consistent with spec.md "A builder runs no page" and "A behaviour that needs a DOM ... is seen at the look on landing". The builder's first run is a reading of the code (brief line 73).
- Case 5: consistent. It is checked by reading and covers every place the mechanism changes.
- Cases 6 to 13: consistent with spec.md.
- Case 14: consistent with spec.md, but it covers only the 30 views (see section 5).
- Case 15: its reason "since every new rule is under `body.wall`", like the Conventions bullet "Every new rule is under `:global(body.wall)`", conflicts with Part 1. The toolbar fix (a CSS change to `.tools` and `.toolbar.overflow`, or a new read in `measure()`) must hold under every theme, since the flip does not depend on a wallpaper. A builder who follows the Convention would put the toolbar fix under `body.wall`, and case 15 claims "unchanged" for header code that Part 1 changes in every theme.
- "No case of this step falls under an entry of `agents/guarded.md`, so the step adds no test": consistent with spec.md "A test exists only as the test of one entry".

Findings:
1. Case 15's reason and the Conventions bullet "Every new rule is under `:global(body.wall)`" contradict Part 1, whose fix applies in every theme. No case asks for a place the step does not change.

## 5. The question

- Cases 1 to 3: yes, alone. A change to the rounding that removes the flip at 28.5625 px controls (for example a ceiling on the room) passes them while the room is still read from the toolbar's own box. Case 5 and Part 1 bullet 2 close this only if their reading is done.
- Case 4: no. A layout that flips fails "the layout holds".
- Case 5: no, when the reading names, for each file, a room that the opener cannot change.
- Cases 6 to 8: no for their views. They do not cover a second layer the read misses inside the view, for example `Table.svelte`'s `th` in Usage.
- Cases 9 to 13: no for the parts they name. Case 13: "the same `Empty` inside a card paints nothing" can pass while an `Empty` inside a Focus lane (`Lanes.svelte:216`, inside `.lane`, which `Lanes.svelte:300-302` paints translucent) paints a second layer. Decision 2 exempts only "inside a card or a tinted pane".
- Case 12: yes. Gallery's table on the new surface keeps `Table.svelte:115-117`'s translucent `th`, because the brief makes `th` paint nothing only "when its table is inside a tinted pane". That is a second layer over the surface. The same holds for Projects' and Usage's tables if they are class 2.
- Case 14 and verify item 3: yes. Both cover only the 30 views. Each of these passes with two translucent layers stacked:
  - the 36 tinted views, for example `Calendar.svelte:375-378`;
  - class 3 views with stacks inside their own surface: Present's Stage frame (`Stage.svelte:84-86`) holds Slide's parts (`parts/Section.svelte:97`, `parts/Grid.svelte:119`, `parts/Project.svelte:250`), and NotesGraph's `Graph.svelte:461` `.status` sits over `.graph-wrap` (`:445`);
  - any view drawn in a float (`FloatLayer.svelte:209-215`).
- Case 15: no.
- The step line's check, "each checked on TEST under rice": yes. Under `wallpaper.image` with `all`, a wallpaper is drawn under the non-rice themes too, light ones included, and no look covers them.
- Part 1, "What must hold": no, given case 5 and bullet 2.
- Part 1, bullet 1 and verify item 2 (`grep -rln "offsetWidth\|clientWidth" src/lib/ui/frame/toolbar`): yes. `root.getBoundingClientRect().width` passes the grep and the one-unit rule while the room is still the toolbar's own content box.
- Part 1, bullet 2: no.
- Part 1, bullets 3 and 4: no.
- Part 1, bullet 5 ("the title keeps at least three characters"): yes. The mechanism option "a CSS change ... that gives the toolbar a box sized by its container" would cut every title to 3ch whenever the controls leave room. That passes "at least three characters" and breaks the header's look. The bullet needs "the title keeps the width the controls leave it".
- Part 2, class 1: no for the inner surfaces it names. It does not reach `Markdown`'s default chip surface in a view that becomes tinted.
- Part 2, class 2 and decision 2: yes, as in case 13 (lanes, `.career` at `CareerPanel.svelte:263`, `.tasks` at `Tasks.svelte:119`, `.week` at `CommandCenterView.svelte:293`, `Ribbon.svelte:210`) and case 12 (`th` on the surface).
- Part 2, class 3 ("no change"): yes. A view whose own surface holds a second layer (Present, NotesGraph) passes.
- Part 2, "one definition" and verify item 4 (`grep -rn "var(--wall-panel)" src/lib/views`): yes. A copied mix written with `--wall-popover` or `--chip-on-wall`, or placed under `src/lib/ui`, passes the grep.
- Part 2, the DESIGN.md bullet: no.

Findings:
1. Cases 1 to 3 pass on a rounding change at the measured widths. Only case 5's reading guards the circular read.
2. Case 12, and the `Table.svelte` rule limited to tinted panes, leave `th` as a second layer over the new surface.
3. Case 13 and decision 2 leave a surface inside a lane, or inside another translucent part of a card view, as a second layer.
4. Case 14 and verify item 3 pass with two layers in the 36 tinted views, inside class 3 surfaces (Present's Stage, NotesGraph's status box) and in floats.
5. The step line's look runs only under rice; a wallpaper under a non-rice theme (`all`) is not looked at.
6. Verify item 2 passes while the room is still read from the toolbar's own box through `getBoundingClientRect`.
7. Part 1 bullet 5 passes with every title cut to three characters.
8. Verify item 4 misses a copied mix under another token or under `src/lib/ui`.

## 6. Implied inputs

Each item gives the input, the result it should have, and whether the Cases state it.
- A pane resized while the popover is open. Widened until everything fits: the opener goes and the popover closes (`measure()` sets `open = false`, `Toolbar.svelte:93`). Narrowed: the popover stays inside the pane, but `paneWidth` is read only when the popover opens (`:57-61`). Missing.
- A text size change (`--text-scale`) on a toolbar at an exact fit: one layout, no flip. Missing, though Part 1's "What must hold" names it.
- The icon set toggled (rice Icons on or off, Brackets on or off): one layout in each. Missing, though "What must hold" names it.
- A toolbar whose controls change count while shown, for example Entry's first control behind `{#if page !== null}` (`Entry.svelte:226`): one layout after the change, measured once through the MutationObserver (`watch.ts:18-21`). Missing.
- A tab hidden and shown again (Q66's deferred tabs): the toolbar measures its room as shown and holds one layout. Missing.
- A long title with few controls: the title drawn as wide as the controls leave it, never cut to 3ch. Missing.
- A view in a docked or free float (`FloatLayer.svelte:209-215`), or in a popped-out window (`FloatWindow.svelte:51`): one layer, so either the float's fill or the view's surface paints, never both. Missing.
- A light theme with the wallpaper set to `all`: the same surfaces, and every text read off one layer. Missing.
- `Empty` inside a Focus lane (`Lanes.svelte:216`): paints nothing. Missing.
- `Empty` in the shell's empty pane (`PaneBody.svelte:339`) and in a failed view (`Failed.svelte:28`): the result stated and looked at. Missing.
- `Empty error` over a wallpaper (`Empty.svelte:65`, `--c-red-bg`): the red box and the surface are not two layers. Missing.
- A sticky `Table` head in a view that is already tinted (Problems, Recover's `RecoverPlan.svelte`, Hpc's `Jobs.svelte`), with rows scrolled under it: one layer, and the rows do not show through the head's text. Missing; case 7 covers Processes only.
- Gallery's table on the new surface: `th` paints nothing there. Missing.
- Calendar's `.ec-header` (`Calendar.svelte:375-378`) inside the tinted Calendar box: one layer, or the exception stated under `tokens.css:221-238`. Missing.
- A Markdown code block in Project's documents (`Project.svelte:150`) and in Entry's folder (`EntryFolder.svelte:88`) once on a surface: the `pre` paints nothing, so `surface={false}` is passed. Missing.
- The surface's wrapper box (display, padding, margin) without a wallpaper: the layout is unchanged, for example `Stats` in its row and a `p` in a flow. Case 15 covers it at the look.
- The Focus rows of `plan.md:627` at another text size: the same size and line height as the ticker rows. Missing, since that Step 0 is not in the brief.

Findings:
1. Every input above marked "Missing" is absent from "Cases": the open popover during a resize, the text size, the icon set, a control count changing, a hidden and shown tab, a long title, floats and popped-out windows, a light theme with `all`, `Empty` in a lane, in the shell and in its error tone, sticky `Table` heads in tinted views, Gallery's `th` on the surface, Calendar's header rows, Markdown code blocks on a surface, and the Focus row sizes.

## 7. ADRs

- `ls docs/adr` (from `tools/oculus`) prints "No such file or directory", so there is no record.

Findings: none.

## 8. Dictated text

- The brief dictates no words for a file. It dictates one path and the content of one sentence:
  - `src/lib/ui/frame/Surface.svelte` (`grep -n "Surface.svelte" agents/briefs/O44.md` finds line 103): breaks spec.md "What every package obeys", "At most ten tracked items in a folder under `src` ...". `src/lib/ui/frame` holds ten items now.
  - The DESIGN.md sentence's content, "rows or prose: the box is tinted; cards: the parts outside a card carry the wallpaper surface; nothing is a second layer" (`grep -n "states the rule for a view's box" agents/briefs/O44.md` finds line 47): holds as content. The builder writes the words.

Findings:
1. The dictated path `src/lib/ui/frame/Surface.svelte` breaks the ten-item folder rule.

## Declined to judge

- The browser figures (113 to 117 flips, 61.125 and 91.8 px, x 1006.4 and 975.7, localhost's bracket widths). They need a page; I checked only that the arithmetic follows from the code.
- Which view Axel meant by "Project" in `plan.md:625`. That is his reading of his own report; the code shows only that `Project.svelte` has no header toolbar.
- Whether `fit.ts` should get a guarded entry. A new entry needs Axel's yes (spec.md).
- How readable the surfaces are under a light theme. That needs a look.

Agent usage: a08597bfebc889217, claude-opus-5-5, 236,913 tokens, 83 tool uses, 12.5 min.

## Closed

Each finding is closed in `agents/briefs/O44.md` as follows.

- 1.1 Markdown's code block: `Markdown.svelte` and `EntryFolder.svelte` are in the paths; the fenced block's surface paints nothing on a surface or in a tinted box, and the comment at `Markdown.svelte:68-71` is rewritten; an implied-input case covers Project's and Entry's code blocks.
- 1.2 FloatLayer: `FloatLayer.svelte` is in the paths, its comment at `:205-207` is rewritten, and a view in a float or a popped-out window has one layer (a case).
- 1.3 AppFrame: class 3 keeps AppFrame's frame as the app's own surface, as `DESIGN.md:391` and `docs/apps.md:447` say; both lines are in the paths, changed only if the read changes what they say.
- 1.4 Empty in the shell: `PaneBody.svelte:339` and `Failed.svelte:28` are named, their result is a case and a before-and-after for the look.
- 2.1 The Focus sizes: Part 3 of "What to build", its cases, and `CommandCenterView.svelte` and `Focus.svelte` in the paths.
- 2.2 The 36 tinted views: Part 2 reads every one for a second layer (Calendar's `.ec-header` named), and they are in the paths.
- 2.3 "Project": mapped to the Projects board, `Projects.svelte:251`.
- 3.1 The guarded grep: the premise quotes both lines, `:57` and `:75`.
- 3.2 The ten-item rule: decision 5 moves `Sash.svelte` and `sash-size.ts` into `ui/frame/sash/` so `Surface.svelte` makes ten; decision 3 wraps the `said` paragraph with no new component; `utils/folder-check.sh` is a verify item.
- 3.3 The sticky-strip rule: `tokens.css:221-238` is a premise, and decision 6 keeps its exception unchanged.
- 3.4 Glossary and standards: the report part on `docs/glossary.md` is removed, and the prose check refers to the rules file's prose rules.
- 3.5 "24 views": written as 24 files, with AccountActions and SourceToolbar drawn in more views.
- 3.6 Paths: no new `said` component; a file split out of a view over 520 lines is in the paths.
- 4.1 Case 15 and the Conventions bullet: only the Part 2 surface rules are under `body.wall`; Part 1 and Part 3 apply under every theme.
- 5.1 and 5.6 The room: Part 1 says the room is read from the container and the report quotes that line; verify item 2 quotes each width read with why it cannot feed the room.
- 5.2 Table head on a surface: `th` paints nothing on the surface as in a tinted box, with the sticky exception of `tokens.css:221-238`.
- 5.3 Lanes and other translucent parts: the surface paints nothing inside cards, lanes, career, tasks, `.week`, Ribbon or a float's fill.
- 5.4 Class 3 inner stacks and floats: Present's Stage parts and NotesGraph's `.status` are read; floats as in 1.2.
- 5.5 Non-rice wallpaper: case 24 is looked at on a scratch oculus whose hub sets the wallpaper to `all` under a light theme.
- 5.7 Title width: the title keeps the width the controls leave it.
- 5.8 Copied mixes: verify item 4 greps every wall token over views, ui and shell.
- 6.1 Implied inputs: each is a case (the popover during a resize, the text size, the icon set, a control count change, a hidden and shown tab, a long title, floats, `all` under a light theme, `Empty` in a lane, in the shell and in its error tone, sticky heads in tinted views, Gallery's `th`, Calendar's header rows, Markdown code blocks, the Focus sizes).
- 8.1 The dictated path: closed by decision 5.
