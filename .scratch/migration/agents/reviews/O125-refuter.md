# Step O125 refuter report (on .agents/worktrees/migration-O125, base 2760ac090)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run diagrams        (from the worktree root; git status --short after it lists only the step's files and the two brief files, so no diagram changed)
$ npm run test:quick
test:quick: 12 changed file(s), from git since HEAD
test:quick: 9 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (3.2 s)
ok      eslint (2.0 s)
ok      svelte-check (8.1 s): 1793698987688 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (41.2 s): Duration  31.42s (transform 12.38s, setup 0ms, import 26.85s, tests 39.68s, environment 2ms)
test:quick: 44.6 s; every command passed

$ grep -n 'body.wall' src/lib/ui/controls/heads/GroupHead.svelte
(nothing; exit=1)

$ grep -n -i 'translucent\|panel-on-wall\|wall-popover' src/lib/ui/controls/heads/GroupHead.svelte
20:    // second translucent layer over that surface.

$ git status --short -- tests ; git diff 2760ac090 --stat -- tests
(nothing)

$ sh utils/unused-exports.sh > <scratchpad>/o125-unused.txt ; diff ../O125-base/unused-exports.txt <scratchpad>/o125-unused.txt
(nothing; diff_exit=0; 338 lines)

$ LC_ALL=C grep -n '[^ -~]' <the 9 changed files> .scratch/migration/agents/reviews/O125-report.md
(nothing)

Commands the builder's report quotes, rerun:
$ for d in src tests utils config; do diff -rq ../O125-base/$d $d -x local.yml; done
Files ../O125-base/src/lib/shell/rail/UpdateTray.svelte and src/lib/shell/rail/UpdateTray.svelte differ
Files ../O125-base/src/lib/themes/tokens.css and src/lib/themes/tokens.css differ
Files ../O125-base/src/lib/ui/controls/heads/GroupHead.svelte and src/lib/ui/controls/heads/GroupHead.svelte differ
Files ../O125-base/src/lib/ui/display/table/Table.svelte and src/lib/ui/display/table/Table.svelte differ
Files ../O125-base/src/lib/views/personal/calendar/Calendar.svelte and src/lib/views/personal/calendar/Calendar.svelte differ
Files ../O125-base/src/lib/views/sources/repositories/diff/FileHeader.svelte and src/lib/views/sources/repositories/diff/FileHeader.svelte differ
Files ../O125-base/src/lib/views/sources/search/Problems.svelte and src/lib/views/sources/search/Problems.svelte differ
Files ../O125-base/src/lib/views/system/status/Gallery.svelte and src/lib/views/system/status/Gallery.svelte differ

$ grep -n 'background\|backdrop' src/lib/ui/controls/heads/GroupHead.svelte
15:    // between the heading and what it heads. It paints the pane's background (`--panel`) solid in
200:        background: var(--panel);

$ awk 'length($0)>100 {print FILENAME":"FNR}' <the 8 source files>
src/lib/views/sources/search/Problems.svelte:399
src/lib/views/system/status/Gallery.svelte:287
src/lib/views/system/status/Gallery.svelte:291
src/lib/views/system/status/Gallery.svelte:310

$ git diff 2760ac090 --numstat -- src docs
1<tab>1<tab>docs/HELP.md
2<tab>5<tab>src/lib/shell/rail/UpdateTray.svelte
13<tab>11<tab>src/lib/themes/tokens.css
6<tab>19<tab>src/lib/ui/controls/heads/GroupHead.svelte
8<tab>10<tab>src/lib/ui/display/table/Table.svelte
6<tab>15<tab>src/lib/views/personal/calendar/Calendar.svelte
3<tab>4<tab>src/lib/views/sources/repositories/diff/FileHeader.svelte
1<tab>1<tab>src/lib/views/sources/search/Problems.svelte
2<tab>2<tab>src/lib/views/system/status/Gallery.svelte

$ wc -l docs/HELP.md  ->  617 ; wc -l of the 8 source files: Table 203, Calendar 425, FileHeader 164, UpdateTray 310, GroupHead 240, tokens.css 347, Problems 449, Gallery 425 (all match the report's table)

$ git diff 2760ac090 -- src docs | grep '^+' | grep -v '^+++' | grep -i -E "before|used to|no longer|still|always|as before|previously|the step|after this|O1[0-9][0-9]|2026"
(nothing)

Plain-grep equivalents of the report's `git grep` lines (git grep itself not run, see Declined):
$ grep -rn '\.strip\b' src | grep -v heads/GroupHead.svelte   -> selectors only in Tabs.svelte:386,401,434, ActionStrip.svelte:81, TabFace.svelte:226,324-327,331 (`:global(.strip.unfocused) .tab...`), SplitView.svelte:195,202; reproduces the report.
$ grep -rn 'data-file-header' src   -> src/lib/views/sources/repositories/diff/FileHeader.svelte:61 only; reproduces.
$ grep -rn -- '--panel-on-wall:' src ; grep -rn 'style:--panel-on-wall' src   -> tokens.css:300 and Pane.svelte:71 after the change; the base also had UpdateTray.svelte:265; reproduces.
```

The tab characters of the numstat output are written `<tab>`.

## Verdicts

Items of the brief's "What to build", in its numbering (with item 8 and the comment widening of `agents/briefs/O125-cases.md`):

- 1: holds. The two `body.wall` rules on `.strip` (base `GroupHead.svelte:211-222`) are gone; check 2 prints nothing; the only paint left is `.strip { ... background: var(--panel); ... }` (`GroupHead.svelte:189-203`). No selector outside the component reaches the strip's paint: the plain `.strip` grep lists only scoped rules of Tabs, ActionStrip and SplitView and TabFace's `:global(.strip.unfocused) .tab`, and the global `h3` rules (`Markdown.svelte:259,273`, `TurnList.svelte:233,244`) need a `.doc` ancestor and set no background. `--panel` is redefined nowhere outside the theme files (`grep -rn -- '--panel:' src | grep -v themes/` prints nothing).
- 2: holds. `GroupHead.svelte:15-20` says the strip paints `--panel` solid in every mode and wherever it stands, a solid band as the small controls are, never a second translucent layer; the removed rules' comments are gone; check 3 prints line 20, which is true.
- 3: violated, Standards 1 (the rewrap clause). The words hold: `tokens.css:234-238` names the group heading, the table's sticky header row, the Calendar's header rows and the diff's file header as painting the panel solid and the Processes actions column as keeping `panel_opacity`; numstat 13/11 lies inside the comment; no token changed.
- 4: holds. `docs/HELP.md:571` adds one sentence, one line per bullet; it names the four heading kinds, which the builder lists as judgment call 1. Every non-`stays` `Table` use sits in an `overflow` box (`EntryList.svelte` `.list { overflow: hidden }`, the eight others `overflow-x: auto` or `overflow: hidden` by grep), so "a table's header row that stays in place" names the `stays` tables only, as the code does.
- 5: holds. `UpdateTray.svelte:261-265`: the redefinition is gone and `background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent)` with `blur(var(--wall-blur))` gives the same value the base did; the tray draws no other reader of `--panel-on-wall` (its imports are Confirm, GroupHead, Glyph, Modal, ScheduleDialog, ScheduleList, ToolButton, none in the reader list).
- 6: holds. `Table.svelte:135-137` `:global(body.wall) .stays th { background: var(--panel); }`, no backdrop filter, in or out of a surface (its specificity beats `:global(body.wall) th`); the row rules `:139-147` are unchanged; the comments `:21-29` and `:125-130` are true. Their wrap is in Standards 1.
- 7: holds. The two `body.wall` rules are gone (`grep -n 'body.wall' Calendar.svelte` prints nothing), so `Calendar.svelte:368-374` paints `--panel` with today's chip as a `background-image` in every mode; without a wallpaper the rules are the base's rules unchanged; the comments `:38-41` and `:363-367` are true.
- 8 (cases ruling 2): holds. `FileHeader.svelte:124-126` paints `var(--panel)`, no blur; `:120-122` keeps `transparent` for a header that does not stay; the comment `:10-14` is true.
- Cases ruling 3 (comments made false): holds. `Problems.svelte:47-48`, `Gallery.svelte:34-38`, `Table.svelte:21-29`, `Calendar.svelte:38-41` and `FileHeader.svelte:10-14` were rewritten; `ProcessTable.svelte:204-205` ("the strip of `tokens.css` that keeps a mix of its own") is still true against the new `tokens.css` sentence, which names that column as the one that keeps `panel_opacity`.

Cases:

- C1: not verifiable. The cascade gives `--panel`, no blur (`GroupHead.svelte:189-203` is the only paint rule). Settled by the landing's look with computed style.
- C2: not verifiable. The reading gives `--panel`, no blur. Settled by the look.
- C3: met by reading. The strip reads no `--*-on-wall`, so `Pane.svelte:71`'s `share` cannot reach it.
- C4: not verifiable. The base `[data-float-place='free'] .strip` rule is gone and the reading gives `--panel`. Settled by the look.
- C5: not verifiable. The reading gives `--panel` inside a card, lane or Surface. Settled by the look.
- C6: not verifiable. The reading shows the base rule unchanged. Settled by the look.
- C7: not verifiable. The reading shows both strips at `--panel`, with `top: var(--group-above)` (`:191`) unchanged. Settled by the look.
- C8: met by reading. `.strip:focus-visible` (`:206-209`) is unchanged; `SessionWorkspace.svelte:210-217` passes `row`.
- C9: met by reading. The strip paints `var(--panel)`, the theme token.
- C10: met by reading. Outside a free float and the tray nothing changes. Inside them the strip goes from 97 % over a 97 % fill (default `popover_opacity: 0.97`, `config/defaults/appearance.yml:99`) to 100 %, and the report states this.
- C11: not verifiable. The reading gives solid strips, and the tray's fill keeps the base's computed value. Settled by the look.
- C12: met by reading. The docked float paints `transparent` (`FloatLayer.svelte:214-216`) and the strip paints `--panel`.
- C13: not verifiable. The reading gives a solid header for the Gallery tones table (`Gallery.svelte:341`, outside a surface) and for Problems (`Problems.svelte:313`, tinted pane). Settled by the look.
- C14: met by reading. `:global(body.wall) th { background: transparent; }` (`Table.svelte:131-133`) is unchanged.
- C15: not verifiable. The reading gives solid headings with today's chip kept. Settled by the look.
- C16: met by reading. `Table.svelte:112` and `Calendar.svelte:368-374` are the base rules.
- C17: met by reading (`FileHeader.svelte:124-126`). The look would confirm it in a multi-file diff, though the ruling does not put C17 on the look list.

## 1. Spec

none.

## 2. Proof

- P1. `.scratch/migration/agents/reviews/O125-report.md`, "The cases' first run": "After the change, `grep -n 'background\|backdrop' src/lib/ui/controls/heads/GroupHead.svelte` prints only `200:        background: var(--panel);`". What is wrong: the claimed output is not what the command prints. The rerun also prints `15:    // between the heading and what it heads. It paints the pane's background (`--panel`) solid in`. The conclusion it supports, that the base rule is the only paint rule, still holds, because line 15 is a comment. Failure scenario: a reader who reruns the quoted command gets a different output than the report quotes and cannot tell whether the tree moved. Verdict: none.
- P2. Same section, bullet 2: "The only `h3` rule in the tree is ScheduleDialog's, scoped to that component (`ScheduleDialog.svelte:253`)." What is wrong: the statement is false. `h3` rules also stand at `GitSteps.svelte:212`, `AccountSetup.svelte:203` and `Cluster.svelte:162` (scoped), at `Markdown.svelte:259,273` (`.doc :global(h3)`) and at `TurnList.svelte:233,244` (`.answer :global(.doc h3)`). By my reading none of them reaches a GroupHead strip's paint: the scoped ones match only their own markup, and the global ones need a `.doc` ancestor and set margin, colour and font size only. So the decision it supports (nothing outside the component reaches the strip) holds. Failure scenario: a reader trusts the "only" and skips the global `h3` rules when the strip is next changed. Verdict: none.
- P3. Same report, the C15 row, item 7's row and the C12 row: `Calendar.svelte:239`, "comments true (:39-41, :361-365)" and `FloatLayer.svelte:213-215`. What is wrong: the rules file's Report section requires every `file:line` to be taken after the last change. After the change the Calendar's `<Pane ... tinted>` is at `:240` and its CSS comment at `:363-367`, and the docked float's rule is at `FloatLayer.svelte:214-216`. No decision rests on these numbers. Failure scenario: the landing's look or a later reader opens the cited line and finds a different line. Verdict: none.

## 3. Standards

- S1. `src/lib/themes/tokens.css:223-246`, `src/lib/ui/display/table/Table.svelte:22,126,129`: "`--terminal-on-wall` below). A strip that stays in place over rows scrolling in the same" / "block and the stacking context of every fixed thing inside it, so a pane's tab strip" / "carries depth 1 ...". What is wrong: the rules file's section "What every package obeys" requires a comment the step edits to be rewrapped as a whole paragraph at 100 columns, so that no line inside a sentence ends short, and brief item 3 asks for the same where the edit leaves a short line. The edited paragraph in `tokens.css` keeps the base wrap on `:223-233`: `:224` is 93 columns and the next word "each" fits, `:232` is 90 and "instead," fits. Inside the part the builder rewrapped, `:234` ("box"), `:240` ("a"), `:242` ("carries", 91 + 8 = 99), `:244` ("document") and `:245` ("on.") could each take the next word within 100. In `Table.svelte`, line 22 of the edited prop doc ("table") and lines 126 ("while") and 129 ("surface,") of the edited CSS comment are short in the same way. The report's "Prose check" says "Each rewrapped paragraph runs to the column" and that the `tokens.css` paragraph was "rewrapped as a whole"; the measurement does not reproduce that. The measurement for each line: its length plus one plus the length of the first word of the next line is at most 100. Failure scenario: the next editor finds ragged comment lines inside sentences, against the rule the check `comment-width.test.ts` does not enforce, and copies the ragged wrap. Verdict: item 3 violated (its rewrap clause).
- S2. `src/lib/shell/panes/floats/FloatLayer.svelte:137`: `data-float-place={place.kind === 'dock' ? place.edge : 'free'}`. What is wrong: the step removed the only reader of this attribute, the base rule `:global(body.wall [data-float-place='free']) .strip` at `GroupHead.svelte:219` (`grep -rn "float-place" ../O125-base/src ../O125-base/tests` lists only those two lines). After the change `grep -rn 'float-place\|floatPlace' src tests utils docs` prints only `FloatLayer.svelte:137`. The rules file's section "What every package obeys" says that after changing a construct, the step greps it and carries the change to every hit or says why not. Its section "The principles every package is judged on" says nothing is kept for a need the plan does not name. The report names neither the attribute nor the grep. Failure scenario: every float's element carries an attribute no code reads. A later author keys a rule on it, believing it is a kept hook, or reads FloatLayer, looks for its consumer and finds none. Fix: drop the line, which widens the write list by `FloatLayer.svelte:137`, or name the reader that keeps it. Verdict: none (item 1 holds).
- S3. `.scratch/migration/agents/reviews/O125-report.md`, the "first run" bullets on `.strip` and `--panel-on-wall:`, the C17 row and "Comments and docs re-read": "`git grep -n '\.strip' -- src`", "`git grep -n -e '--panel-on-wall:' -e 'style:--panel-on-wall' -- src`", "`git grep -n 'data-file-header' -- src`", "`git grep -n -i -E 'keeps a mix|mix of its own|chip-on-wall' -- src docs README.md ':!config/local.yml'`". What is wrong: the rules file's section "Where you work" limits a builder's git commands to `git status`, `git diff` and `git show`. The first `git grep` is the command brief item 1 names, so it is a clash between the brief and the rules file. The rules file's section "Read first" says such a clash is reported, and the report does not report it. The other three are not in the brief. All four are read-only and changed nothing. Failure scenario: the rule's single list of builder git commands no longer describes what builders run, and a later builder takes the brief's mention as licence for other git commands. Verdict: none.

## 4. Behaviour

- B1. `.scratch/migration/agents/reviews/O125-report.md`, "Before and after": "**Account setup** (tinted pane, provider groups). Before: a slightly darker translucent band." and "**Update tray** ... Strips solid." / "**Sessions list** workspace groups. Solid band". What is wrong: the Update tray and Sessions rows give no before in the section the look is read against. The cases table gives one for C11 (the popover share with blur over the tray's own fill) and for C8 (80 % with blur). The Account setup before depends on the theme: the strip's `--panel-on-wall` over the tinted pane's own `--panel-on-wall` composes to about 96 % of the panel colour, which is darker than the pane only where the panel is darker than the picture, and lighter in a light theme. Failure scenario: at the landing's look in a light theme, the orchestrator expects a darker before band and misreads the change, or has no before to compare the tray and Sessions strips against. Verdict: none.

## Declined to judge

- The paint of C1, C2, C4, C5, C6, C7, C11, C13, C15 and C17 in a browser, including the strength of the solid band against the translucent surfaces around it, which the report names under "Limitations". A reviewer runs no page; the landing's look with computed style settles these.
- Who wrote the worktree's changed `.scratch/migration/agents/briefs/O125.md` and the untracked `O125-cases.md`. `git status --short` lists both. They read as the orchestrator's copies of the updated brief and the cases ruling, but attributing them needs `git log` or the session transcripts, which I did not read.
- Open item 640, open in main's `orchestrator-state.md`, says that if Axel rules (a) before O125 lands, the Processes actions column is added to O125. That would make `ProcessTable.svelte:204-209` and the `tokens.css` sentence on that column change. It is Axel's ruling. The builder could not quote it, because the worktree's copy of the state file predates it.
- The report's `git grep` lines, rerun only as plain `grep`, since the reviewer runs no git command beyond `git diff 2760ac090`, `git status --short` and `git show 2760ac090:<path>`. The plain-grep results reproduce the report's conclusions (see Verification).

Reviewer usage: a443d746ae26f8353, claude-opus-5-5, 208795 tokens, 73 tool uses, 10 min 42 s.

## Repair round 1, refuted

```
$ npm run diagrams        (from the worktree root, PATH with node v24.21.0)
diagrams exit=0
docs/diagrams/channels.svg
docs/diagrams/writes.dot
docs/diagrams/writes.svg
(git status --short after it lists the 10 step files, the modified brief O125.md and the untracked O125-cases.md, O125-round1.md, O125-refuter.md, O125-report.md; no diagram file changed)

$ npm run test:quick 2>&1 | tail -12
        tests/checks/tree/size.test.ts: scans the source text of a changed file
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.7 s)
ok      eslint (2.2 s)
ok      svelte-check (7.8 s): 1793700050199 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (39.1 s): Duration  29.52s (transform 12.89s, setup 0ms, import 26.19s, tests 39.49s, environment 2ms)
test:quick: 41.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
(A second `npm run test:quick` was started by the reviewer with its output piped into `head -5 >/dev/null`; its output is not used. git status --short afterwards is the listing above, unchanged.)

$ grep -n 'body.wall' src/lib/ui/controls/heads/GroupHead.svelte
(nothing; exit=1)

$ grep -n -i 'translucent\|panel-on-wall\|wall-popover' src/lib/ui/controls/heads/GroupHead.svelte
20:    // second translucent layer over that surface.

$ git status --short -- tests ; git diff 2760ac090 --stat -- tests
(nothing)

$ for d in src tests utils config; do diff -rq ../O125-base/$d $d -x local.yml; done
Files ../O125-base/src/lib/shell/panes/floats/FloatLayer.svelte and src/lib/shell/panes/floats/FloatLayer.svelte differ
Files ../O125-base/src/lib/shell/rail/UpdateTray.svelte and src/lib/shell/rail/UpdateTray.svelte differ
Files ../O125-base/src/lib/themes/tokens.css and src/lib/themes/tokens.css differ
Files ../O125-base/src/lib/ui/controls/heads/GroupHead.svelte and src/lib/ui/controls/heads/GroupHead.svelte differ
Files ../O125-base/src/lib/ui/display/table/Table.svelte and src/lib/ui/display/table/Table.svelte differ
Files ../O125-base/src/lib/views/personal/calendar/Calendar.svelte and src/lib/views/personal/calendar/Calendar.svelte differ
Files ../O125-base/src/lib/views/sources/repositories/diff/FileHeader.svelte and src/lib/views/sources/repositories/diff/FileHeader.svelte differ
Files ../O125-base/src/lib/views/sources/search/Problems.svelte and src/lib/views/sources/search/Problems.svelte differ
Files ../O125-base/src/lib/views/system/status/Gallery.svelte and src/lib/views/system/status/Gallery.svelte differ

$ sh utils/unused-exports.sh > <scratchpad>/ue.txt; diff ../O125-base/unused-exports.txt <scratchpad>/ue.txt
diff_exit=0 lines=     338

$ LC_ALL=C grep -n '[^ -~]' <the 10 changed files> .scratch/migration/agents/reviews/O125-report.md
ascii exit=1

$ git diff 2760ac090 -- src docs | grep '^+' | grep -v '^+++' | grep -i -E "before|used to|no longer|still|always|as before|previously|the step|after this|O1[0-9][0-9]|2026"
hist exit=1

$ git diff 2760ac090 --numstat -- src docs
1<tab>1<tab>docs/HELP.md
0<tab>1<tab>src/lib/shell/panes/floats/FloatLayer.svelte
2<tab>5<tab>src/lib/shell/rail/UpdateTray.svelte
23<tab>22<tab>src/lib/themes/tokens.css
6<tab>19<tab>src/lib/ui/controls/heads/GroupHead.svelte
13<tab>15<tab>src/lib/ui/display/table/Table.svelte
6<tab>15<tab>src/lib/views/personal/calendar/Calendar.svelte
3<tab>4<tab>src/lib/views/sources/repositories/diff/FileHeader.svelte
1<tab>1<tab>src/lib/views/sources/search/Problems.svelte
2<tab>2<tab>src/lib/views/system/status/Gallery.svelte

$ wc -l <the 10 changed files>
     617 docs/HELP.md
     230 src/lib/shell/panes/floats/FloatLayer.svelte
     310 src/lib/shell/rail/UpdateTray.svelte
     346 src/lib/themes/tokens.css
     240 src/lib/ui/controls/heads/GroupHead.svelte
     203 src/lib/ui/display/table/Table.svelte
     425 src/lib/views/personal/calendar/Calendar.svelte
     164 src/lib/views/sources/repositories/diff/FileHeader.svelte
     449 src/lib/views/sources/search/Problems.svelte
     425 src/lib/views/system/status/Gallery.svelte
(all match the report's two files tables)

The round's delta, diff -u snapshot migration-O125-round-1/<path> against the worktree, for each path of files.txt:
docs/HELP.md, UpdateTray.svelte, GroupHead.svelte, Calendar.svelte, FileHeader.svelte, Problems.svelte, Gallery.svelte: no difference.
src/lib/themes/tokens.css: one hunk @@ -220,30 +220,29 @@, the comment over --wall-panel rewrapped, nothing else.
src/lib/ui/display/table/Table.svelte: hunks @@ -19,13 +19,13 @@ (the `stays` prop doc) and @@ -123,11 +123,11 @@ (the CSS comment), nothing else.
Not in files.txt, from git diff 2760ac090: src/lib/shell/panes/floats/FloatLayer.svelte @@ -134,7 +134,6 @@
-        data-float-place={place.kind === 'dock' ? place.edge : 'free'}

$ diff <(tr -s ' \n' '\n\n' < round-1 snapshot copy | grep -v '^\*$') <(same over the worktree copy)   (tokens.css and Table.svelte)
src/lib/themes/tokens.css: word stream identical (ignoring lone *)
src/lib/ui/display/table/Table.svelte: word stream identical (ignoring lone *)

The rewrap measurement (line length + 1 + length of the next line's first word, after stripping leading space and a leading `*`, `/*` or `//`; SHORT when at most 100; OVER when a line passes 100), the reviewer's own awk:
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
src/lib/themes/tokens.css:245: 40 (last line)
src/lib/ui/display/table/Table.svelte:22: 100 + 1 + 2 (up) = 103
src/lib/ui/display/table/Table.svelte:23: 98 + 1 + 7 (`stays`) = 106
src/lib/ui/display/table/Table.svelte:24: 100 + 1 + 5 (while) = 106
src/lib/ui/display/table/Table.svelte:25: 97 + 1 + 3 (and) = 101
src/lib/ui/display/table/Table.svelte:26: 99 + 1 + 5 (them,) = 105
src/lib/ui/display/table/Table.svelte:27: 96 + 1 + 8 (nothing.) = 105
src/lib/ui/display/table/Table.svelte:28: 19 (last line)
src/lib/ui/display/table/Table.svelte:125: 98 + 1 + 7 (slide's) = 106
src/lib/ui/display/table/Table.svelte:126: 100 + 1 + 4 (they) = 105
src/lib/ui/display/table/Table.svelte:127: 95 + 1 + 6 (solid,) = 102
src/lib/ui/display/table/Table.svelte:128: 99 + 1 + 5 (panel) = 105
src/lib/ui/display/table/Table.svelte:129: 94 + 1 + 6 (inside) = 101
src/lib/ui/display/table/Table.svelte:130: 46 (last line)
(no SHORT, no OVER; equal to the report's quoted output line for line)
The same measurement over GroupHead.svelte 11-20, Calendar.svelte 32-41 and 363-367, FileHeader.svelte 10-14, Problems.svelte 47-48, Gallery.svelte 34-38, filtered to SHORT|OVER|last:
src/lib/ui/controls/heads/GroupHead.svelte:20: 50 (last line)
src/lib/views/personal/calendar/Calendar.svelte:41: 19 (last line)
src/lib/views/personal/calendar/Calendar.svelte:367: 43 (last line)
src/lib/views/sources/repositories/diff/FileHeader.svelte:14: 72 (last line)
src/lib/views/sources/search/Problems.svelte:48: 90 (last line)
src/lib/views/system/status/Gallery.svelte:38: 61 (last line)

$ awk 'length($0)>100 {print FILENAME":"FNR}' <the 9 changed source files>
src/lib/views/sources/search/Problems.svelte:399
src/lib/views/system/status/Gallery.svelte:287
src/lib/views/system/status/Gallery.svelte:291
src/lib/views/system/status/Gallery.svelte:310

The removed attribute, every reader:
$ grep -rn 'float-place\|floatPlace\|floatplace' src tests utils docs README.md
exit=1
$ grep -rn --exclude=local.yml 'float-place\|floatPlace' config
config exit=1
$ grep -rn --exclude=local.yml --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.scratch --exclude-dir=.oculus --exclude-dir=.svelte-kit 'float-place\|floatPlace' .
exit=1
$ grep -rn 'float-place' ../O125-base/src ../O125-base/tests ../O125-base/utils
../O125-base/src/lib/ui/controls/heads/GroupHead.svelte:219:    :global(body.wall [data-float-place='free']) .strip {
../O125-base/src/lib/shell/panes/floats/FloatLayer.svelte:137:        data-float-place={place.kind === 'dock' ? place.edge : 'free'}
(the `[data-float]` readers, FrameLayer.svelte:69 and window-bounds.ts:45, read `data-float`, which stays at FloatLayer.svelte:136)

The report's plain-grep lines, rerun:
$ grep -rn '\.strip\b' src | grep -v heads/GroupHead.svelte   (selector hits only)
src/lib/ui/tabs/Tabs.svelte:386:    .strip {
src/lib/ui/tabs/Tabs.svelte:401:    :global(body.wall) .strip {
src/lib/ui/tabs/Tabs.svelte:434:    .strip.wrapping {
src/lib/ui/tabs/ActionStrip.svelte:81:    .strip {
src/lib/ui/tabs/TabFace.svelte:226:    :global(.strip.unfocused) .tab.current {
src/lib/ui/tabs/TabFace.svelte:324-327,331:    :global(.strip.unfocused) .tab... / .label
src/lib/shell/panes/SplitView.svelte:195:    .strip {
src/lib/shell/panes/SplitView.svelte:202:    .strip > :global(*) {
(the other hits are TypeScript `.strip` property reads and calls, no CSS)
$ grep -rn -E '(^|[ ,>(])h3([ ,:{)]|$)' src   (comment lines and markup left out)
src/lib/shell/rail/ScheduleDialog.svelte:253:    h3,
src/lib/shell/rail/ScheduleDialog.svelte:258:    h3 {
src/lib/views/personal/account-setup/GitSteps.svelte:212:    h3 {
src/lib/views/personal/account-setup/AccountSetup.svelte:203:    h3 {
src/lib/views/shared/prose/Markdown.svelte:259:    .doc :global(h3),
src/lib/views/shared/prose/Markdown.svelte:273:    .doc :global(h3) {
src/lib/views/system/machine/hpc/Cluster.svelte:162:    h3 {
src/lib/views/sessions/terminal/transcript/TurnList.svelte:233:    .answer :global(.doc h3),
src/lib/views/sessions/terminal/transcript/TurnList.svelte:244:    .answer :global(.doc h3),
$ grep -rn -- '--panel-on-wall:' src ; grep -rn 'style:--panel-on-wall' src
src/lib/themes/tokens.css:299:    --panel-on-wall: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
src/lib/ui/frame/Pane.svelte:71:    style:--panel-on-wall={share === undefined ? undefined : `var(--${share}-on-wall)`}
$ grep -rn 'data-file-header' src ; grep -rn -E '\.header\b' src/lib/views/sources/repositories/diff | grep -v FileHeader.svelte
src/lib/views/sources/repositories/diff/FileHeader.svelte:61:<div class="header" class:stays={foldable} data-file-header={path}>
exit=1
$ grep -rn -i -E 'keeps a mix|mix of its own' src docs README.md ; grep -rn --exclude=local.yml -i -E 'keeps a mix|mix of its own' config
src/lib/views/system/machine/processes/ProcessTable.svelte:205:       `tokens.css` that keeps a mix of its own, so they do not read through it. */
cfg exit=1
$ grep -rn 'chip-on-wall' src docs README.md
Pane.svelte:253, TickerGroup.svelte:140, Code.svelte:77, RenderedMarkdown.svelte:187, Tasks.svelte:195, LockedCode.svelte:50, tokens.css:290 (equal to the report's list)
$ grep -rn -E "\[data-part|\[data-scope|\[role=.treeitem|:global\(\[aria-selected|\[data-selected" src --include='*.svelte' --include='*.css'
(no rule that paints a tree row; the hits are scoped `.item[data-selected]` rules of pickers and two querySelector calls)

Cited lines after the last change, read with awk:
FloatLayer.svelte:137 data-surface; :206-212 the wallpaper comment; :213-215 `:global(body.wall) .dock { background: transparent; }`; :217-219 `.free`. Calendar.svelte:240 `<Pane title={t('views.calendar')} toolbar={tools} {bar} tinted>`; :363-367 the CSS comment; :368-374 the two base rules. Table.svelte:131-133, :135-137, :139-147. FileHeader.svelte:120-122, :124-126. UpdateTray.svelte:261-265. GroupHead.svelte:189-203, :206-209. Status.svelte:110-132 the Surface, :133-145 `<div class="samples">` with the Gallery GroupHead at :134-144.
```

The tab characters of the numstat output are written `<tab>`.

### Verdicts

Items of the brief's "What to build", in its numbering, with `agents/briefs/O125-cases.md` and `agents/briefs/O125-round1.md`:

- 1: holds. The two `body.wall` strip rules are gone (check 2 prints nothing); `GroupHead.svelte:189-203` `.strip { ... background: var(--panel); ... }` is the only paint rule; the plain `.strip` and `h3` greps above list no rule outside the component that reaches the strip's paint, and no global tree-row rule paints it.
- 2: holds. `GroupHead.svelte:15-20` states the solid paint in every mode; check 3 prints line 20, which is true. Standards R3 below concerns one parenthetical of this comment and carries no verdict.
- 3: holds. `tokens.css:223-245` names the group heading, the table's sticky header row, the Calendar's header rows and the diff's file header as painting the panel solid and the Processes actions column as keeping `panel_opacity`; the whole paragraph is rewrapped and the measurement prints no SHORT and no OVER; the word stream equals the round-1 snapshot's; numstat 23/22 lies inside the comment; no token changed. The first report's S1 is closed.
- 4: holds. `docs/HELP.md:571`, one added sentence, one line per bullet.
- 5: holds. `UpdateTray.svelte:261-265`, the redefinition gone, `background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent)` with `blur(var(--wall-blur))`.
- 6: holds. `Table.svelte:135-137` `background: var(--panel)`, no backdrop filter; rows `:139-147` unchanged; the prop doc `:21-29` and the CSS comment `:125-130` are true and now measure clean.
- 7: holds. No `body.wall` rule left in `Calendar.svelte`; `:368-374` paint `--panel` with today's chip as `background-image` in every mode; comments `:37-41` and `:363-367` true.
- 8 (cases ruling item 2): holds. `FileHeader.svelte:124-126` `background: var(--panel)`, `:120-122` transparent for a header that does not stay, comment `:10-14` true.
- Cases ruling item 1 (C13 on the Gallery tones table and Problems; Processes out): holds. `ProcessTable.svelte` is not in the diff.
- Cases ruling item 3 (comments made false): holds. `Problems.svelte:47-48`, `Gallery.svelte:34-38`, `Table.svelte:21-29`, `Calendar.svelte:37-41`, `FileHeader.svelte:10-14` rewritten; `ProcessTable.svelte:204-205` stays true against the new `tokens.css` sentence.
- Cases ruling item 4 ("What it must do" items 1 to 8): holds; items 1 to 8 hold above.
- Round item 1 (S1, the rewrap): holds. The measurement reproduces the report's output line for line; the words are unchanged (word-stream diff empty).
- Round item 2 (S2, the attribute): holds. `FloatLayer.svelte:137` removed, the only change in that file; the grep over src, tests, utils, docs, README.md, config (local.yml excluded) and the whole worktree outside node_modules prints nothing; its one base reader was `GroupHead.svelte:219`, removed by item 1; `data-float` and `data-surface` stay.
- Round item 3 (P1, P2, P3, B1): holds. P1: the report quotes both lines of the `background\|backdrop` grep. P2: the `h3` list equals the rerun. P3: `Calendar.svelte:240`, `:363-367`, `FloatLayer.svelte:213-215` and `:206-212` match the tree. B1: "Before and after" gives a before for the Update tray, the Sessions list and the Account setup in a dark and a light theme. Proof R1 and R2 below are stale or loose numbers the round did not reach; neither carries a verdict.
- Round item 4 (S3, git grep): holds. "Anything in the brief that was wrong or impossible" states the clash and that the other `git grep` lines were the builder's own; the only `git grep` text left in the report is in that paragraph and in the round's item 4 note.

Cases:

- C1: not verifiable. The cascade gives `--panel`, no blur (`GroupHead.svelte:189-203` alone). Settled by the landing's look with computed style.
- C2: not verifiable. Reading gives `--panel`, no blur. Settled by the look.
- C3: met by reading. The strip reads no `--*-on-wall`, so `Pane.svelte:71` cannot reach it.
- C4: not verifiable. No rule keys on the free float any more; reading gives `--panel`. Settled by the look.
- C5: not verifiable. Reading gives `--panel` inside a card, lane or `Surface`. Settled by the look.
- C6: not verifiable. The base rule is unchanged. Settled by the look.
- C7: not verifiable. Both strips `--panel`, `top: var(--group-above)` (`:191`) unchanged. Settled by the look.
- C8: met by reading. `.strip:focus-visible` (`:206-209`) unchanged; no global tree-row rule paints the strip.
- C9: met by reading. The strip paints `var(--panel)`.
- C10: met by reading. Outside a free float and the tray nothing changes; inside them 97 % to 100 %, stated in the report.
- C11: not verifiable. Reading gives solid strips and the tray's fill at the base's computed value. Settled by the look.
- C12: met by reading. `FloatLayer.svelte:213-215` paints the docked float transparent; the strip paints `--panel`.
- C13: not verifiable. Reading gives a solid header for the Gallery tones table and Problems. Settled by the look.
- C14: met by reading. `Table.svelte:131-133` unchanged.
- C15: not verifiable. Reading gives solid headings with today's chip. Settled by the look.
- C16: met by reading. `Table.svelte:112` and `Calendar.svelte:368-374` are the base rules.
- C17: met by reading. `FileHeader.svelte:124-126`.

### Findings

#### 1. Spec

none.

#### 2. Proof

- R1. `.scratch/migration/agents/reviews/O125-report.md`, DONE / NOT DONE rows and the line after the table: "lists only the 8 source files below; nothing under `tests`", "`LC_ALL=C grep -n '[^ -~]'` over the 9 changed files prints nothing", "`npm run test:quick` ran once.", and the Verify 1 row quoting `ok      eslint (12.6 s)` / `test:quick: 47.6 s; every command passed`; and in "Repair round 1": "`git status --short` after it lists only the step's 10 files, the brief and the three ledger files of the round". What is wrong: the rules file's section "The working rules that bind every package" requires every count to be taken after the last change. After the round, `diff -rq` lists 9 source files, the changed files are 10, the list ran twice across the step, and the Verify 1 row quotes the run before the round. `git status --short` lists four untracked ledger files (O125-cases.md, O125-round1.md, O125-refuter.md, O125-report.md), so "the three ledger files of the round" leaves out `O125-cases.md`. The "Repair round 1" section carries the current counts and run, so no decision rests on the stale ones. Failure scenario: a reader of the DONE table takes "8 source files" and misses `FloatLayer.svelte` as a changed path. Verdict: none.
- R2. Same report, the C1 row: "the strip in `<div class=\"samples\">` outside the Surface (`Status.svelte:132-143`)". What is wrong: `Status.svelte:132` is `</Surface>`; the `samples` div is `:133-145` and the Gallery `GroupHead` `:134-144`. No decision rests on the range. Failure scenario: the landing's look opens `Status.svelte:132` for the strip and lands on the Surface's closing tag. Verdict: none.

#### 3. Standards

- R3. `src/lib/ui/controls/heads/GroupHead.svelte:17-18`: "over the picture where / nothing around it paints a surface (an untinted pane, a docked float), and inside the surface around it elsewhere (a tinted pane, ...)". What is wrong: the rules file's section "What every package obeys" says a sentence in a head comment the change makes false is a defect. A docked float paints nothing itself (`FloatLayer.svelte:206-215`: "the view inside is that layer: its tinted box, or its cards and surfaces"), so a strip in a docked float stands over the picture only when the view inside is untinted, which "an untinted pane" already covers; for a tinted view in a docked float the parenthetical puts the strip in both lists. The rule the sentence states ("where nothing around it paints a surface") is correct; only the example is loose. The fix is to drop "a docked float" from the first parenthetical or to write "an untinted view in a docked float". Failure scenario: a later editor reads that a strip in a docked float is always over the bare picture and writes a docked-float rule for strips on that premise. Verdict: none (item 2 holds; the paint is right in every case).

#### 4. Behaviour

none. The round's changes are comment rewraps and the removal of an attribute that no code, style, test or document reads (grep above); nothing a host or a user sees changes in the round.

### Declined to judge

- The paint of C1, C2, C4, C5, C6, C7, C11, C13, C15 and C17 in a browser, and how strong the solid band looks inside translucent surfaces. A reviewer runs no page; the landing's look with computed style settles these.
- Open item 640 (the Processes actions column), still open in main's `orchestrator-state.md:191` and unruled in `plan.md` (`grep -n 640` lists no ruling). It is Axel's ruling; under (a) before landing it would add `ProcessTable.svelte:204-209` and the `tokens.css` sentence on that column to O125.
- Whether the round's history-word grep, which the report runs as `git diff -- src docs` without a base, covers the same lines as `git diff 2760ac090`: that needs the worktree's HEAD, a fact only `git rev-parse` or `git log` gives. The reviewer's own run against `2760ac090` prints nothing.
- Who wrote the worktree's modified `.scratch/migration/agents/briefs/O125.md` and the untracked ledger files: attribution needs `git log` or the session transcripts.
- Whether the report's word-stream check of the rewrap was run as stated: its scratch files are removed. The reviewer's own word-stream diff against the round-1 snapshot is empty for both files.

Reviewer usage: a0996b58b66546e51, claude-opus-5-5, 181256 tokens, 42 tool uses, 6 min 56 s.

## Closed

- First run S1, S2, P1, P2, P3, B1 and S3: closed by repair round 1 (the round's verdicts above).
- R1 and R2: closed at landing in the booking, which quotes the counts and the run taken after the round; the report's stale rows are named there. No decision rests on them.
- R3: fixed at landing in `GroupHead.svelte:17-18`, "a docked float" written as "an untinted view in a docked float".
