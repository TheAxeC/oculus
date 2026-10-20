# Step O44 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O44, base 8ebf9f093)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All from `tools/oculus` in the worktree, `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. The rules file names no output filter, so each ran plain.

```
1. npm run diagrams && npm run test:quick   (exit 0)
docs/diagrams/layers.dot ... docs/diagrams/writes.svg   (18 files)
test:quick: 91 changed file(s), from git since HEAD
test:quick: 10 test file(s), 9 essential
        tests/views/sources/bar-actions.test.ts: imports at depth 1
ok      prettier (2.6 s): All matched files use Prettier code style!
ok      ASCII gate (4.0 s)
ok      svelte-kit sync (35.4 s)
ok      eslint (55.6 s)
ok      svelte-check (58.1 s): 1792490089720 COMPLETED 526 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (65.4 s): Duration  49.10s (transform 88.45s, setup 0ms, import 100.66s, tests 15.09s, environment 29.59s)
test:quick: 101.0 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
(after the run, `git diff 8ebf9f093 --stat -- tools/oculus/docs` shows the same six diagram files, 26+/26-, as before it)

2. grep -rn "offsetWidth\|clientWidth" src/lib/ui/frame/toolbar
(no output) rc 1

3. the report's Python scan of <Pane ...> openings, run as quoted
66 41 25
UNTINTED: Present, AppFrame, Collection, Entry, Focus, Project, Projects, Inbox, Leads, Linkedin, Literature, Radar, Data, Document, File, NotesGraph, Diff, Source, Venues, Domains, Map, Pillars, Gallery, Output, Usage (25 lines)
the 66 view names of the scan, sorted, diffed against the 66 rows of the report's table: diff rc 0

4. grep -rn "wall-panel\|wall-popover\|chip-on-wall\|wall-blur" src/lib/views src/lib/ui src/lib/shell
106 lines (| wc -l). Each hit read: Surface.svelte:77, Card.svelte:147-148, Pane.svelte:104/:120/:231-232, theme.ts:67-69 (names), panel surfaces written as var(--panel-on-wall) with the blur line (Graph:449, Band:213, Lanes:317, DiffSection:491, Ribbon:228, ApprovalPanel:163, FrameLayer:290, FoldedPane:101, PaneStrip:259, wall.css:17, Table:133/:138); strips (Calendar:377-378, ProcessTable:207-208, FileHeader:125-126, PaneStrip:313-314, Tabs:404-405); chip panels carrying data-surface (CommandCenterView, Tasks, CareerPanel, Code, RenderedMarkdown, Markdown:346-347); slide parts with nested rules (Stage, Section, Project, Equation, Grid, Panel); floating surfaces (popover mix); shell chrome (TitleBar, StatusBar, ActivityRail, RailList). No copy of the class 2 surface outside Surface.svelte.

5. sh utils/folder-check.sh
(no output) rc 0

6. sh utils/unused-exports.sh > <scratch>; diff O44-base/unused-exports.txt <scratch>
(no output) rc 0; both files 348 lines (wc -l)

7. added lines of `git diff 8ebf9f093 -- tools/oculus/src tools/oculus/DESIGN.md` plus Surface.svelte and StripSaid.svelte whole, grepped for before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O<nn>|Z<nnn>|D<nn>|a date
hits: DESIGN.md:249 "still open" and DESIGN.md:731 "before the handle" (both unchanged wording inside a changed line); wall.css and Surface.svelte "::before" (CSS). No history word in an added comment.

8. prose read of DESIGN.md:249, :658, :731 and every added head or rule comment: findings under Standards 3 and 4 below; otherwise plain, no em dash, no "not X but Y".

ASCII: LC_ALL=C grep -n '[^ -~]' over the 86 changed, new and moved files (excluding .svg)
(no output) rc 1

Commands the builder's report quotes, rerun:
- grep -rln "<Toolbar[^>]*overflow" src: 24 files, as reported; each is the whole of a Pane header's `tools`/`toolbar` snippet, directly or as AccountActions, SourceToolbar (and RegistryTools around it), DiffBar or files/header/Controls, each of which renders only the Toolbar at its root.
- grep -rn "Sash\.svelte\|sash-size" src tests config docs HELP.md DESIGN.md README.md: only the new paths, as reported; `git show 8ebf9f093:.../Sash.svelte | diff - sash/Sash.svelte` differs only in the import line; sash-size.ts identical.
- wc -l: PaneView 519 at base, 510 now; DiffSection 504 to 520; Graph 515 to 519; Diff 520; shell/panes/strip holds 9 items; ui/frame holds 10 (ls).
- token grep | wc -l: 106, as reported.
- unused-exports: 348 lines both, as reported.
- Check 1 timing: the report quotes "25.7 s (limit 45.0 s)"; the rerun took 101.0 s and printed "over the time limit"; every command passed in both. Load-dependent; no decision rests on it.
- Not rerun: `npx vitest run tests --tagsFilter '!slow' --exclude 'tests/checks/**'` (a whole-suite command the review may not run) and `npx vitest run tests/routes/edit/rail.test.ts` (a file the step does not change; the rules file says nobody reruns such a failure). The report's `git -C . status` is not run (git command outside the three allowed).
```

## Verdicts

Items of the brief's "What to build" (Part 1 bullets 1.1 to 1.5, Part 2 bullets 2.1 to 2.11 in the brief's order, Part 3 bullets 3.1 to 3.4):

- 1.1: holds, every width is `getBoundingClientRect().width`: controls and room `Toolbar.svelte:112-113`, opener probe `:93`, pane width `:72`; check 2 prints nothing.
- 1.2: holds, the room is the absolutely placed `.room` span (`Pane.svelte:62`, `:183-191`, `left: calc(var(--header-start) + 3ch + var(--header-gap)); right: var(--header-end)`), whose width equals `.tools`' `max-width: calc(100% - 3ch - var(--header-gap))` of the header content box and depends on the header alone; read at `Toolbar.svelte:113` through `roomBox` (`:82-84`). The fallback for a container without the span is Standards 4.
- 1.3: holds, `fit.ts` unchanged in code, its head comment (`:4-6`) states fractional widths and a room the toolbar does not change.
- 1.4: holds, `watch.ts:17` observes `room`, not the toolbar box.
- 1.5: holds by reading, `.tools` keeps `flex: 0 0 auto`, `margin-left: auto` and the title's 3ch; the span is out of flow; the popover limit is reread each measure (`Toolbar.svelte:124`).
- 2.1: holds, `tokens.css:221-238` unchanged; the new token `--panel-on-wall` (`tokens.css:289`) is the same mix the panes used.
- 2.2: holds, the report's table has 66 rows equal to the scan (check 3).
- 2.3: holds, class 1 (History, Processes, Apps, AppTree, MarkdownPreview tinted; `.raw` transparent `History.svelte:470`; ProcessTable head transparent `:136`, Stop column keeps its mix `:206-209`, Z950; non-`stays` table heads transparent `Table.svelte:127-129`); class 2 parts wrapped in `Surface`; class 3 (Present Stage `data-surface` with nested rules in Section, Grid, Project, Equation, Panel; Graph `.graph-wrap` `data-surface`, `.status` transparent; Diff sections; FrameLayer frames; Output's Code).
- 2.4: holds, one definition (`Surface.svelte:70-79` on `--panel-on-wall`); Empty, Intro, RegistryHead, Stats wrap once; the `said` paragraph wrapped in Collection, Entry, Focus, Project, Projects, Inbox, Leads, Linkedin, Literature, Radar and AccountList (diff read).
- 2.5: holds, `data-surface` on Card, tinted Pane, Band and Focus lanes, CareerPanel, Tasks, `.week`, Ribbon `.month`, free float, and `Surface.svelte:90-96` makes a nested Surface a plain wrapper.
- 2.6: holds, PaneBody and Failed reach the surface through `Empty`; `Empty error` takes none (`Empty.svelte:52-59`).
- 2.7: holds, Project (`Project.svelte:160-164`) and EntryFolder (`:93-98`) pass `surface={false}`, comment `Markdown.svelte:68-71` rewritten; the now unreachable default is Standards 5.
- 2.8: holds, free float `data-surface` with the tab strip clear (`FloatLayer.svelte:138`, `:218-225`), docked float clear (`:214-216`), comment rewritten; popped-out window solid `var(--panel)` (`FloatWindow.svelte:65`, unchanged).
- 2.9: holds, every new surface rule is under `body.wall`; only `body.rice.wall [data-surface] header` (`Pane.svelte:124`) names rice, to override the rice strip.
- 2.10: holds, each changed component carries a head or `body.wall` comment on its surface (diff read).
- 2.11: holds, DESIGN.md:249 gains the one sentence, :658 made general; :731 path carried by the rename rule.
- 3.1: not applicable, a premise; confirmed `Ticker.svelte:138-146` (`--fs-xs`, 14 px line, 18 px min height).
- 3.2: holds, `.behind` is `--fs-xs`, `calc(14px * scale)` line, 18 px min height (`CommandCenterView.svelte:356-360`).
- 3.3: holds, `.wait-names` `--fs-xs` with the 14 px line (`Focus.svelte:262-264`), labels unchanged.
- 3.4: holds, the report's Part 3 table classes every `font-size` hit of `boards/focus/` (rerun grep matches its lines); career facts, order, criteria and host rows set to the ticker size.

Cases of the brief's "Cases":

- 1: met by reading, the room no longer depends on the opener and the arithmetic is fractional (Toolbar.svelte:105-124, Pane.svelte:183-191); the 0-flip count is the look's.
- 2: met by reading, same path through AccountActions; count is the look's.
- 3: met by reading, as case 1; count is the look's.
- 4: met by reading, a narrower header narrows `.room`, fit draws the opener; nothing the opener changes is observed.
- 5: met, all 24 toolbars sit directly in Pane's `.tools` beside the room span (greps above).
- 6: met by reading, History tinted, `.raw` transparent.
- 7: met by reading, Processes tinted, head transparent, `.actions` cell drawn in every row (`ProcessTable.svelte:60-64`) and keeps its mix.
- 8: met by reading, Apps tinted.
- 9: met by reading, Collection's Intro on Surface; Card not inside any `data-surface` element there.
- 10: met by reading, awaiting box on `Surface fitted`; lanes and career keep their paint (no surface ancestor); LaneCard is its own opaque markup.
- 11: met, problem, said and count wrapped (`Literature.svelte` diff).
- 12: met by reading, headings, chips, tags, meters on Surface; table `stays`, rows carry the surface (`Table.svelte:136-144`).
- 13: met by reading, Empty wraps in Surface; inside Card or lane it is a plain wrapper.
- 14: not verifiable here; the code table holds all 66 views (check 3); the look on TEST under rice settles it.
- 15: met by reading, Part 2 rules are under `body.wall`; Part 1 and Part 3 hold under every theme.
- 16: met by reading, `.behind` at the ticker size; links inherit through `ToolButton plain`.
- 17: met by reading.
- 18: met by reading, no input to the room or widths changes with the layout at any scale; the look measures it.
- 19: met by reading, `readPane()` each measure (`Toolbar.svelte:124`), popover closes when all fit (`:123`).
- 20: met by reading, MutationObserver childList (`watch.ts:20-25`).
- 21: met by reading, early return while not laid out (`Toolbar.svelte:106`); the room's resize from 0 measures again.
- 22: met by reading.
- 23: met by reading (free float the one layer, docked float clear, popped-out window solid).
- 24: met by reading.
- 25: met by reading.
- 26: met by reading (Problems and Gallery `stays`; RecoverPlan, Jobs, Processes heads transparent).
- 27: met, Calendar unchanged.
- 28: met, `surface={false}` on a Surface.
- 29: partial, the wrapper is `display: contents`, but parent rules written with `>` no longer reach the wrapped child without a wallpaper; Standards 3.

## 1. Spec

- `src/lib/shell/panes/strip/PaneStrip.svelte:257-266`, `src/lib/shell/panes/leaf/FoldedPane.svelte:97-107`, `src/lib/shell/panes/strip/StripSaid.svelte:15` with `src/lib/shell/panes/PaneView.svelte:462`: "`:global(body.wall) .path { background: var(--panel-on-wall); backdrop-filter: blur(var(--wall-blur)); }`", "`:global(body.wall) .fold { background: var(--panel-on-wall); ...`", "`<Surface fitted>`"; what is wrong: three shell surfaces no item asks for (expected item: none; Part 2 covers the text of views and, for the shell, only `Empty` in PaneBody and Failed), in files outside "Paths this step writes"; the report names them with a reason (judgment call 10, "Files outside the write list"); failure scenario: under rice with a wallpaper, every pane's breadcrumb row and every folded pane's strip now paints a panel band where the picture showed, and the tab menu's refusal line sits on its own band; Axel sees a change to the workbench chrome that no ruling or brief named; verdict: none.
- Brief, "What to build", Part 1 bullet 2: "a toolbar outside a Pane header (`DiffBar.svelte`, `SourceToolbar.svelte`, `Controls.svelte` of the Files header and the others of the 24)"; what is wrong: a premise the reviewer's grep does not reproduce: each of the 24 overflow toolbars is the whole of a Pane header's toolbar snippet (greps above); the builder reported it; failure scenario: the brief's premise produced the fallback branch of Standards 4, code for a toolbar that does not exist; verdict: none.

## 2. Proof

- none.

## 3. Standards

- `tools/oculus/.scratch/migration/agents/reviews/O44-report.md`, "The whole non-check suite" and "Check 1": "`npx vitest run tests --tagsFilter '!slow' --exclude 'tests/checks/**'` (the `npm test` selection)" and "Two earlier runs of the same command, before the last edits, passed every command"; what is wrong: the brief's "Token discipline" and the rules file's "Token discipline" allow the list once after the last change (plus one rerun after a red line in a changed file) and no whole-suite command; the builder ran a whole-suite command and the list three times with no red line between; failure scenario: the extra suites ran on the shared machine while O45 was verified, and `plan.md`'s O45 booking records `npm test` failing once on `undo.test.ts` ("O44's builder running its suites"), so the landing of the other step paid for them; verdict: none.
- Builder's report, first section: "A read-only `git -C . status` ran once ... One `sed -i` command corrected line references in this report"; what is wrong: the rules file, "Where you work" ("You never run a git command, read-only ones included") and the launch prompt (no shell command that edits files) are broken; the diff shows no effect (the `sed` touched only the report, a path the builder writes); failure scenario: none on the tree; a builder that runs git in a worktree can change the index the orchestrator lands from; verdict: none.
- `src/lib/ui/frame/Surface.svelte:3-5`: "Without a wallpaper it is no box at all (`display: contents`), so the content lays out exactly as it would without the wrapper."; what is wrong: a head comment the diff makes false, and case 29's "layout and spacing as before": a parent rule written with a child combinator matches the Surface instead of the wrapped element, e.g. `Inbox.svelte:249-252` "`.inbox > :global(*), .cards > :global(*) { min-width: 0; }`" no longer reaches `AddAccount`'s `.add` (`Inbox.svelte:178-179`, `.add` has no `min-width` of its own), and the same rule in Literature (`:270`), Leads (`:300`), Linkedin (`:291`) and Radar (`:192`) no longer reaches their wrapped said, problem, count and runlog elements; with a wallpaper the Surface div is the grid item and takes `min-width: 0`, so only the no-wallpaper case changes; failure scenario: in a dark theme with no wallpaper, an Inbox pane narrowed below the add-account form's min-content width with Add account open shows the form's box overflowing the pane's column instead of shrinking to it, a layout change the step promised not to make (whether the form's min-content exceeds a usable pane width is the look's); verdict: case 29 partial.
- `src/lib/ui/frame/toolbar/Toolbar.svelte:78-84` and `:21-22`: "The box whose width is the line's room: the container's `[data-toolbar-room]` element, or the container itself. Neither is sized by the toolbar's content, so the toolbar's own layout cannot change it." / "`return container?.querySelector<HTMLElement>(':scope > [data-toolbar-room]') ?? container;`"; what is wrong: code larger than its job (a branch for a container without a room span, which no toolbar has: all 24 sit in Pane's `.tools`) and a comment stating a guarantee the code does not hold: a parent element is sized by the toolbar's content whenever it is a shrink-to-fit or `flex: 0 0 auto` box, which is the very cause Part 1 removed; failure scenario: a view that later puts `<Toolbar overflow>` inside its own inline-flex wrapper gets the fallback, the room grows when the opener is drawn, the flip returns, and the head comment tells the reader it cannot; verdict: none (item 1.2 holds for the 24 toolbars that exist).
- `src/lib/views/shared/prose/Markdown.svelte:73`, `:82`, `:238`, `:343-348`: "`let { doc, loading, failed, surface = true, ...`", "`class:surfaced={surface}`", "`:global(body.wall) .doc.surfaced :global(pre) {`"; what is wrong: after the step all six callers (RenderedMarkdown, Help, EntryFolder, Project, Doc twice) pass `surface={false}` (grep above), so the default, the `surfaced` class and the fenced-block surface rule are unreachable; the report keeps them and calls removal "a separate change to its API" (judgment call 8), work inside a file the brief lists; failure scenario: a new caller that omits the prop silently paints a second layer under its code blocks over a tinted box or a Surface, the opposite of the rule the comment now states; verdict: none.

## 4. Behaviour

- `tools/oculus/.scratch/migration/agents/reviews/O44-report.md`, whole: no "before and after" section; the first line says "the look on TEST under rice (the 'before and after' the report shape asks for ...) was not taken"; what is wrong: the brief's "Report" and the rules file ("Your report's 'before and after' section is what the look is read against, so it names the view, the state to put it in and what should differ") ask the builder for a written list for the orchestrator's look, which is missing. Visible changes the report states without a before and after and the state to put the view in, or not at all: an untinted pane's header and view bar now paint `--panel-on-wall` over a wallpaper under every wallpaper theme (`Pane.svelte:117-127`; before: clear outside rice); a docked float's fill is gone (`FloatLayer.svelte:214-216`; before: the panel mix); in a free float, cards, lanes, the tab strip, an editor and a document frame paint nothing and cards keep only their border (`Card.svelte:151-154`, `FloatLayer.svelte:222-225`, `wall.css`, `FrameLayer.svelte:294-297`); the editors inside Deposit's and Merge's tinted boxes and inside Entry's Surface paint nothing (`wall.css:27-38`); Diff's hunk bars and comment box lose their chip band and a single file's header goes clear (`HunkBar.svelte:256`, `CommentBox.svelte:121`, `FileHeader.svelte:120-127`); table heads in Hpc, Status, Recover, Usage, the Projects list and a slide's Summary go clear (`Table.svelte:127-129`); the career panel's facts, order of work, criteria and host rows shrink to `--fs-xs` (`CareerPanel.svelte:346`, `:384`, `:413`, `CareerHosts.svelte:157`); the breadcrumb row, folded strip and tab-menu line of Spec 1; failure scenario: at landing the orchestrator opens TEST without a list of views and states, so a change such as the free float's outlined cards or the clear docked float is either not looked at or judged with no stated expectation; verdict: none (case 14's proof is the look this list feeds).

## Declined to judge

- Every page-only result (flip counts for cases 1 to 4 and 18 to 22, whether text reads off one layer for cases 6 to 14 and 23 to 26, the light theme with `all` for case 24, the seams of per-cell blur in Gallery's table rows): the reviewer runs no page; the look on TEST under rice, and the scratch oculus with `all` for case 24, settles them.
- The `rail.test.ts` failure under the builder's whole-suite run: the file and the code it tests are unchanged by the step, and the rules file says nobody reruns such a failure.
- Whether the opener probe (`Toolbar.svelte:90-95`, a box of `--bare-box` width) matches the drawn `more` button under the bracket glyphs, where its padding and text may make it wider: unchanged by the step and not a flip; a page measurement settles it.
- The stacking effect of the new blurred header and view bar and of Surface's `isolation: isolate` on overlays opened inside them: Menu and FieldSelect are portaled (`Menu.svelte:179`, `FieldSelect.svelte:78`); other overlays were not enumerated; the look with a menu open in a header and in a Surface settles it.
- What git would show of the builder's `git -C . status` (whether it touched the index): only another git command (`git status` in the worktree outside the three allowed forms, or reading `.git/index` timestamps) would settle it; the diff shows no effect.
- Whether the shell chrome surfaces of Spec 1 and the docked float's clear fill are what Axel wants: the user's or the orchestrator's call.

Reviewer usage: a1d6c8c010b60b74b, claude-opus-5-5, 341,822 tokens, 99 tool uses, 16.8 min.

## Closed

- Spec 1 (shell surfaces outside the write list): kept by self-rule Z958; the four files join the write list in round 1's brief; the views go into the before-and-after list (round 1, finding 4).
- Spec 2 (the brief's premise of toolbars outside a Pane header): confirmed false by the orchestrator's read (all 24 sit in Pane's `.tools`); the fallback branch it produced is sent back with Standards 4 (round 1, finding 2).
- Standards 1 (extra suite runs): no effect on the tree; recorded here and in the booking at landing. Nothing to send.
- Standards 2 (`git -C . status` and `sed -i` on the report): no effect on the tree (`git status --porcelain` in the worktree at the round snapshot lists only the step's paths); recorded here and in the booking at landing. Nothing to send.
- Standards 3 (Surface `display: contents` and the child-combinator rules, case 29 partial): confirmed by the orchestrator's read (`Surface.svelte:52-54` `display: contents`; `Inbox.svelte:249-252`); sent back (round 1, finding 1).
- Standards 4 (the toolbar's fallback room and its comment): sent back (round 1, finding 2).
- Standards 5 (Markdown's unreachable `surface` default): confirmed by the orchestrator's grep (six `<Markdown` calls, each with `surface={false}`); sent back (round 1, finding 3).
- Behaviour 1 (no before-and-after list): sent back (round 1, finding 5).

## Repair round 1, refuted

Paths: worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O44` (base `8ebf9f093`), round snapshot `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O44-round-1/`, builder report `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O44/tools/oculus/.scratch/migration/agents/reviews/O44-report.md`. The reviewer changed no file in the worktree or the ledger. The temporary outputs are in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/`.

### Verification (rerun by the reviewer)

All commands ran from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

```
1. npm run diagrams && npm run test:quick   (rc 0)
test:quick: 94 changed file(s), from git since HEAD
test:quick: 10 test file(s), 9 essential
        tests/views/sources/bar-actions.test.ts: imports at depth 1
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      ASCII gate (0.6 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (1.6 s)
ok      svelte-check (6.7 s): 1792492617530 COMPLETED 526 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (17.9 s): Duration  11.94s (transform 18.62s, setup 0ms, import 26.99s, tests 12.09s, environment 763ms)
test:quick: 20.3 s (limit 45.0 s); every command passed
(md5 of docs/diagrams/* before and after the run: 544b6c761b189d4a24239eed27652197 both; `git diff 8ebf9f093 --stat -- tools/oculus/docs`: 6 files changed, 26 insertions(+), 26 deletions(-))

2. grep -rln "offsetWidth\|clientWidth" src/lib/ui/frame/toolbar
(no output) rc 1

3. the report's Python scan of <Pane ...> openings, run as the report quotes it
66 41 25
UNTINTED: academic/present/Present.svelte:415 apps/frame/AppFrame.svelte:337 boards/collection/Collection.svelte:376 boards/entry/Entry.svelte:261 boards/focus/Focus.svelte:166 boards/project/Project.svelte:111 boards/projects/Projects.svelte:328 feeds/inbox/Inbox.svelte:175 feeds/leads/Leads.svelte:176 feeds/linkedin/Linkedin.svelte:163 feeds/literature/Literature.svelte:185 feeds/radar/Radar.svelte:112 sources/data/Data.svelte:98 sources/document/Document.svelte:206 sources/file/File.svelte:446 sources/notes-graph/NotesGraph.svelte:88 sources/repositories/diff/Diff.svelte:389 sources/source/Source.svelte:467 sources/venues/Venues.svelte:110 structure/domains/Domains.svelte:59 structure/map/Map.svelte:179 structure/pillars/Pillars.svelte:80 system/gallery/Gallery.svelte:162 system/machine/output/Output.svelte:73 system/machine/usage/Usage.svelte:170
the report's table "The 66 views": 66 rows

4. grep -rn --exclude=local.yml "wall-panel\|wall-popover\|chip-on-wall\|wall-blur" src/lib/views src/lib/ui src/lib/shell | wc -l
104
grep -n ... src/lib/views/shared/prose/Markdown.svelte: (no output) rc 1

5. sh utils/folder-check.sh
(no output) rc 0

6. sh utils/unused-exports.sh > <scratch>/ue.txt; diff O44-base/unused-exports.txt <scratch>/ue.txt
(no output) rc 0; 348 lines

7. this round's added lines (diff of each files.txt path, snapshot against worktree, lines ">", plus the added lines of Help.svelte and Doc.svelte in git diff 8ebf9f093), 67 lines, grepped -i for before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|plan ids|dates|round
hits: Surface.svelte:5 "though the element is still in the tree" (compares two properties of one state, with and without a box; no earlier state: not history); three hits of "around" (not the word "round"). The whole-diff grep of the first review was not rerun; this round changed comments only in the 15 files listed.

8. prose read of every comment this round adds or changes: Standards 1 below; otherwise plain, no em dash, no "not X but Y".

ASCII: LC_ALL=C grep -n '[^ -~]' over the 15 files this round changed and O44-report.md
(no output) rc 1
spec.md's perl gate over $(find src tests bin config -type f ! -name local.yml)
(no output; find printed "bin: No such file or directory")
```

Commands the round's report quotes, rerun:
- `grep -rn -E "> *:global\(|:global\([^)]*>[^)]*\)" src --include="*.svelte" --include="*.css"`: **48 lines**. The report says "prints 41 lines". The difference is exactly the round's own seven lines: five `[data-surface] > *` selectors and the two comment lines of Surface.svelte:9-10. So the figure was taken before the last change (Standards 2).
- `grep -rn --exclude=local.yml "surface=\|surfaced" src`: the same four lines the report quotes (Pane.svelte:54, FloatLayer.svelte:138, check.ts:185, :384).
- Token grep count: 104, as reported.
- Pane scan: `66 41 25`, as reported.
- unused-exports against `O44-base/unused-exports.txt`: no difference, as reported.
- `npx vitest run tests/shell/commands/debug/debug-toolbar.test.ts tests/state/feeds/literature-home.test.ts tests/views/sources/bar-actions.test.ts`: `Test Files  3 passed (3)`, `Tests  17 passed (17)`, as reported.
- `grep -rl "<Surface" src/lib --include="*.svelte" | wc -l`: 32, as reported. Importers of the listed parts (`grep -rlE "import (Empty|Intro|RegistryHead|Stats|AccountList|Latex|LockedCode|SourceNote|StripSaid|Ribbon|EntryFolder) from" src | wc -l`): **93**. The report's "their importers, 105 files" is the union with the 32 direct users, not the importers (Standards 2).
- test:quick timing: the report quotes 47.1 s, over the limit; the rerun took 20.3 s. The figure depends on machine load, and no decision rests on it.

The round's delta was read whole: `diff -u` of each changed `files.txt` path, snapshot against worktree (Toolbar.svelte, fit.ts, Surface.svelte, StripSaid.svelte, Inbox, Leads, Linkedin, Literature, Radar, Markdown, RenderedMarkdown, EntryFolder, Project), plus Help.svelte and Doc.svelte from `git diff 8ebf9f093`. No other `files.txt` path differs from its snapshot (`cmp` over every path).

### Finding 1's enumeration, read for completeness

- **Parts rooted in a Surface.** A transitive scan of components whose top-level markup opens with a Surface, or with a part built on one, gives: Empty, Intro, RegistryHead, Stats, AccountList, QuickAdd, Latex, LockedCode, SourceNote, Ribbon, EntryFolder and StripSaid. The scan also lists Markdown, Jobs, Notes, Results, Tree, Rows, RootedTree, ProjectTree, PickSession, NoAccounts, RadarIntro and RenderedMarkdown, which draw an `Empty` or `Intro` at top level in a branch. `Failed` is a false hit: it draws `Empty error` inside its own `.failed` div, and an error Empty takes no Surface.
- **QuickAdd is missing from the report's list of parts** (`QuickAdd.svelte:85`, root `<Surface>`). Its one importer, Focus.svelte, is among the 32 direct Surface users, so it was read anyway.
- **Selectors scanned.** The style blocks of all 114 files (the importers of all those parts, plus the direct Surface users) were scanned for `>`, `+`, `~`, `:first-*`, `:last-*`, `:nth-*`, `:only-*`, `:empty` and `:has(`. The hits are: Collection.svelte:492-506 (cards and slots only), the five feed rules, TerminalList.svelte:459 and :463, History.svelte:376 and :384, PageArea.svelte:111 and TabView.svelte:73. TerminalList's `.actions` holds only ToolButtons; its Empty, at :374, is an error Empty outside `.actions`. History draws no Surface. TabView's children are a view or `Failed`, and Failed's root is unchanged. PageArea's `.tree` holds PaneView or SplitView.
- **Other places checked.** In the whole-tree `> :global(` grep, the remaining rules reach no wrapped element: Tabs, TabFace, Toolbar, ToolButton, Tooltip (its Ribbon children are spans), MenuOpener, Workbench, StatusBar, SplitView, PageLeaf, ProjectCard, EntryCard and Bucket (`.cards` holds only Reveal and RadarCard). A grep for combinators naming the wrapped classes or tags anywhere in `src` finds only Status.svelte:101 `.view > p` (no Surface in Status) and TerminalBar.svelte:118 `.note ~ .note` (scoped, no Surface). No script in a Surface user reads DOM structure (no `parentElement`, `children`, `firstElementChild`, sibling reads or `:scope >`).
- **Feed containers.** The five containers' direct children were read: none is a Card. The added `[data-surface] > *` selector therefore reaches only the parts of a Surface, as the report states.
- **Item properties.** The rules of every element a Surface wraps were read for flex and grid item properties, `align-self`, `order`, `sticky`, auto margins, `height: 100%` and `min-height`. Only StripSaid's `.said { flex: none }` needed the Surface box, and it now sits in `.line` (`StripSaid.svelte:17-26`). Presenter's Surfaces wrap the meters inside `.meters`, which takes `gap: inherit` under a wallpaper, and the captions inside `.next` and `.notes`, whose own `flex` rules are unchanged.
- **Conclusion.** The enumeration of rules is complete: the five feed rules are the only rules whose matched element is now wrapped.

### Verdicts

Items of the brief's "What to build", numbered as the first report numbered them, over the whole diff since the base:

- 1.1: holds. Every width is `getBoundingClientRect().width`: the controls `Toolbar.svelte:115`, the room `:116`, the opener probe `:96` and the pane `:73`. Check 2 prints nothing.
- 1.2: holds. The room is the absolutely placed `.room` span (`Pane.svelte:62`, `:181-191`). It is positioned against the header's padding box (`header { position: relative }`), so its width is `.tools`' `max-width`, depends on the header alone, and does not change when the opener is drawn. `roomBox` (`Toolbar.svelte:84-88`) now reads only that span. With no span, `measure()` (`:108-109`) and the effect (`:132-133`) return before measuring. All 24 overflow toolbars are the first element of a Pane `tools` or `toolbar` snippet, directly or through AccountActions, SourceToolbar (RegistryTools), DiffBar or files/header/Controls, each rooted in the Toolbar (grep above).
- 1.3: holds. `fit.ts` changed in its comment only; `:5-6` names the room span.
- 1.4: holds. `watch.ts` observes `room` (`watchToolbar(room, run, measure)`, `Toolbar.svelte:136`).
- 1.5: holds by reading. `.tools` keeps `flex: 0 0 auto`, `margin-left: auto` and the 3ch; the span is out of flow.
- 2.1: holds. The surface rule in `tokens.css` is unchanged; the token `--panel-on-wall` (`tokens.css:283-290`) is the same colour mix.
- 2.2: holds. The table has 66 rows, equal to the scan.
- 2.3: holds. History, Processes, Apps, AppTree and MarkdownPreview are tinted. Table heads paint nothing unless `stays` (`Table.svelte:127-144`). ProcessTable's Stop column keeps its mix (ruling Z950).
- 2.4: holds. One definition (`Surface.svelte:79-88` on `--panel-on-wall`); the shared parts wrap once; the `said` paragraphs are wrapped.
- 2.5: holds. `data-surface` marks the layer, and a nested Surface is a plain wrapper (`Surface.svelte:98-105`).
- 2.6: holds. Empty wraps in a Surface; `Empty error` takes none (`Empty.svelte:51-58`).
- 2.7: holds as ruled in round 1 finding 3. The `surface` prop, the `surfaced` class and the fenced-block rule are gone from Markdown.svelte, and the six calls pass nothing. All six callers draw on a surface: RenderedMarkdown's frame, Help and Doc tinted (`Help.svelte:66`, `Doc.svelte:269`), EntryFolder and Project on a Surface. The comment at `Markdown.svelte:316-321` states what holds.
- 2.8: holds. The float comment is rewritten; a free float carries `data-surface`; a docked float is clear.
- 2.9: holds. Every new surface rule is under `body.wall`.
- 2.10: holds. Each changed component carries a comment on its surface.
- 2.11: holds. DESIGN.md:249 gains the sentence; :658 is made general.
- 3.1: not applicable (a premise, confirmed at `Ticker.svelte:138-146`).
- 3.2: holds. `.behind` uses `--fs-xs` with a 14 px line and an 18 px minimum height (`CommandCenterView.svelte:356-360`).
- 3.3: holds. `.wait-names` uses `--fs-xs` with a 14 px line (`Focus.svelte`); the labels are unchanged.
- 3.4: holds. 35 `font-size` lines in `boards/focus/`, classed in the report's Part 3 list.

Cases:

- 1, 2, 3: met by reading. The room no longer depends on the opener, and the arithmetic is fractional. The flip count is the look's to measure.
- 4: met by reading.
- 5: met. All 24 toolbars sit in Pane's `.tools` beside the span.
- 6, 7, 8: met by reading.
- 9, 10, 11, 12, 13: met by reading.
- 14: not verifiable here. The code table holds all 66 views; the look settles it.
- 15: met by reading.
- 16, 17: met by reading.
- 18 to 22: met by reading.
- 23, 24, 25, 26, 27, 28: met by reading.
- 29: met by reading. This was partial in the first review. Without a wallpaper the Surface is `display: contents`. The five feed rules now reach the wrapped part (`Inbox.svelte:251-255`, `Leads.svelte:302-306`, `Linkedin.svelte:293-297`, `Literature.svelte:272-276`, `Radar.svelte:194-198`). StripSaid's line keeps `flex: none` on its own box, and no other parent rule reaches a wrapped element (the enumeration above).

### 1. Spec

- none.

### 2. Proof

- none.

### 3. Standards

1. **Five comments and one doc comment are not filled to 100 columns.**
   - Place: `src/lib/views/feeds/inbox/Inbox.svelte:249-250`, and the same comment at `Leads.svelte:300-301`, `Linkedin.svelte:291-292`, `Literature.svelte:270-271` and `Radar.svelte:192-193`; also `src/lib/ui/frame/toolbar/Toolbar.svelte:79-80`.
   - Quoted: "`    /* A part on a `Surface` is the grid's item through the Surface's box over a wallpaper and`" (94 columns), followed by "`       by itself without one (...)`". Also "`     * The box whose width is the line's room: the `[data-toolbar-room]` span Pane's header lays`" (96 columns), followed by "`     * out beside the toolbar, ...`".
   - What is wrong: the rules file asks that a comment the step edits is "rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short". In the feed comments, "by" fits on the first line (94 + 3 = 97). In Toolbar, "out" fits exactly (96 + 4 = 100, and `comment-width.test.ts:21` allows 100).
   - Failure scenario: the comments end short inside a sentence, a mark of hand wrapping that the convention exists to prevent. Nothing in the behaviour changes.
2. **The report carries sentences and figures the round made false, or that were taken before the last change.**
   - Place: `.scratch/migration/agents/reviews/O44-report.md` in the worktree.
   - First line: "NOT done: the look on TEST under rice (the 'before and after' the report shape asks for, ...) was not taken". The "Before and after" section now exists.
   - "Part 1, the toolbar", bullet 1: "A container without the span gives its own width." Now false: such a toolbar measures nothing (`Toolbar.svelte:84-88`, `:109`).
   - "Judgment calls" 8: "Markdown keeps its `surface` prop although every caller passes false". Now false.
   - "Check 4" gives `Surface.svelte:76` and "Check 7" gives `Surface.svelte:69, :80, :84, :93`. After the round's longer head comment these are `:85-86` and `:79, :90, :94, :103` (`grep -n` above).
   - "Repair round 1": "which prints 41 lines" (the rerun prints 48), and "their importers, 105 files" (93 importers; 105 is the union with the 32 direct users).
   - The round names only Check 4's Markdown line as no longer holding.
   - What is wrong: the rules file says every count and `file:line` in the report is taken after the last change, and a figure from before it is taken again or removed.
   - Failure scenario: the landing booking or the look quotes the report's Part 1 bullet or judgment call 8, and records a fallback room and a Markdown prop that the code no longer has.

### 4. Behaviour

- none. The round's visible changes are stated with their before and after in its "Before and after" list:
  - Row 22: the tab menu line sits in its own box, with the same height and place with and without a wallpaper.
  - Row 23: the five feed views' parts shrink to the column again without a wallpaper.
  - Row 24: removing Markdown's prop changes no paint, since every call passed `false`.
  - Row 34: the toolbar fallback serves no toolbar, so nothing visible changes.

  That list covers every item the first review raised under Behaviour.

### Declined to judge

- **Page-only results:** flip counts (cases 1 to 4 and 18 to 22), whether text reads off one layer (cases 6 to 14 and 23 to 26), and the light theme with `all` (case 24). The reviewer runs no page; the look on TEST under rice, and the scratch oculus for case 24, settle them.
- **Spacing with a wallpaper:** a Surface that is a flex or grid item keeps its child's vertical margins inside its box (a flex item is an independent formatting context). For example, the `h3` margins of Inbox's group headings and Linkedin's section headings may space differently with a wallpaper than without one. Case 29 covers only the no-wallpaper layout, and the look settles this.
- **A future caller of the head-comment pattern:** the example selector in `Surface.svelte:9-10` (`.list > :global([data-surface]) > :global(*)`) would also reach a Card's children if a Card were a direct child of the container. None of the five containers has one (markup read). Whether a future caller would copy the pattern onto a card container is not a fact of this diff.
- **The whole-diff history-word grep:** not rerun. The first review ran it, and this round changed comments only in the 15 files grepped above.
- **Worktree state outside the diff:** whether the builder's round left index or worktree state beyond the diff. Only a git command outside `git diff <base>` and `git status --short` would show it. `git status --short` lists only the step's paths, plus the orchestrator's `agents/briefs/O44-round1.md` and the report under `.scratch`.

Reviewer usage: abfb7d795db113b8b, claude-opus-5-5, 277,673 tokens, 77 tool uses, 12.2 min.

### Closed (repair round 1)

- Standards 1 (six comments not filled to 100 columns): small and inside the brief; fixed at landing on main by rewrapping each comment as a whole paragraph.
- Standards 2 (report sentences and figures the round made false): fixed at landing; the builder's report is carried into the main ledger with a section "Corrections at landing" that names each sentence and figure and what holds, and the landing report quotes the corrected figures.
