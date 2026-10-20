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
