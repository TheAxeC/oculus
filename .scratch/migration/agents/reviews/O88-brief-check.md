# Step O88 brief check (on main at 153f4f0b)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O88.md`. The plan has no section named Goal: `grep -n -i "^#.*goal\|^goal\|\*\*goal" .scratch/migration/plan.md` printed nothing. So "the goal" below means what rulings 448 (a) and 449 (b) give O88 (`plan.md` Rulings, open items 448, 449 and 455 at lines 2835, 2836 and 2842). Those are: `GroupHead` is the only heading code and owns the strip, the rounding, the margin, the circled-minus control and staying at the top of the pane, and no view wraps it; Lit Watch, Position Leads, Audit and Slides headings are drawn by it; `FoldHead` keeps its three boxes.

## 1. Names

- `GroupHead` (file and component): `grep -rn "GroupHead" src config docs tests utils README.md --exclude=local.yml`, with the hits in the write paths left out. Hits:
  - `src/lib/views/shared/card/heads/FoldHead.svelte:10` "A group of cards is headed by GroupHead.svelte beside it instead": stays true.
  - `MenuList.svelte:235`, `ArgumentRows.svelte:111`, `FocusFilter.svelte:169`, `PickMenu.svelte:139` (`DropdownMenu.GroupHeading` and `Command.GroupHeading`) and `vscode-map.ts:107`: a different name, unaffected.
- Catalog keys removed or changed (`radar.count`, `radar.dismissed_sec`, `leads.expired_sec`, `slides.count`, `slides.count_one`, `audit.muted`): a loop of `grep -rn "<key>" src tests docs utils --exclude=local.yml` with the five view files left out printed no hit for any of them. Their lines are `config/text/views/feeds/radar.yml:4,8`, `leads.yml:25`, `academic/slides.yml:5,6` and `system/audit.yml:22`, all in the write paths.
- Pane-state keys `dismissedOpen` and `expiredOpen`: `grep -rln "dismissedOpen\|expiredOpen\|..." tests src docs utils` found three readers and writers outside the paths:
  - `src/lib/state/forms/page-entry.ts:105-106`
  - `tests/state/forms/page-entry.test.ts:123-124`
  - `src/lib/views/boards/focus/CommandCenter.svelte:216-221`

  The keys are unchanged, so none of these becomes false through them. The new bucket fold does make one comment false: `page-entry.ts:98-101` says `revealState` opens "the disclosure the entry may sit behind ... since a card that is not mounted cannot be scrolled to". Once buckets fold, a Lit Watch paper can also sit inside a folded bucket, which `revealState` does not open, so the comment and the function become incomplete. `page-entry.ts` is outside the paths.
- `showMuted`: `grep -rln "showMuted" src tests` printed only `src/lib/views/system/audit/Audit.svelte`. No hit outside.
- `Disclosure`: `grep -rn "Disclosure" src --include='*.svelte' | grep import` lists `CrossLinks.svelte:6`, `Audit.svelte:50` and `History.svelte:47`. The component is at `src/lib/ui/tree/Disclosure.svelte`, not at `src/lib/ui/controls/Disclosure.svelte` as the brief says (see 3). The remaining users stay true.
- CSS class `.disclosure` in `Leads.svelte`: `grep -n "<section class=\"disclosure\">" src/lib/views/feeds/leads/Leads.svelte` prints line 224 (Expired) and line 257 (the run log). The class carries the rule and the padding item 4 removes (`Leads.svelte:319-322`). Removing it also takes the rule off the run log, which the brief does not mention. This is inside a write path, but it is a change the brief does not foresee.
- CSS class `.cards` in `Leads.svelte:312-317`: the live cards at line 201 use it too, and they have no heading. Item 2 qualifies the removal as "under a heading", so a split of the class is implied but not stated.
- `.scratch/migration/agents/guarded.md`: `tests/checks/tree/allow-duplication.txt:16` lists a clone `src/lib/state/feeds/leads.ts src/lib/state/feeds/radar.ts ... at 145 and 82`. Lines added near the top of `radar.ts` make the stated line 82 stale. The reason text is not checked against line numbers, so no check fails. Outside the paths.

Findings:
- 1.1: `page-entry.ts:98-106` (`revealState`) and its comment become incomplete once Lit Watch buckets fold: a revealed paper inside a folded bucket is not mounted and cannot be scrolled to. The file is outside the paths, and no case covers it.
- 1.2: removing the `.disclosure` rule in `Leads.svelte` also changes the run-log section (`Leads.svelte:257`), which the brief does not mention.
- 1.3: the `allow-duplication.txt:16` reason ("at 145 and 82") goes stale if `radar.ts` grows above line 82. This is minor and outside the paths.

## 2. The step line

The step line is `plan.md:837`.

- "`GroupHead` is the only code for a grouping heading": items 1, 2 and 7.
- "draws the strip with its rounding": item 1.
- "the margin under it": item 1.
- "the circled-minus fold control": item 1, with the line "as now". `config/catalogs/icons.yml:8-9` maps `expand: plus-circle` and `collapse: minus-circle`.
- "staying at the top of the pane": item 1.
- "no view wraps it or sets space around it": item 2.
- "the Projects boards, the Focus clusters and band, Venues": item 2.
- "Lit Watch's buckets and Dismissed": items 3 and 4.
- "Position Leads' Expired": item 4.
- "the Audit sections": item 5.
- "the Slides groups": item 6.
- "`FoldHead` keeps heading the Career, Command center and Tasks boxes": item 7.
- "(ruling 455)": scheduling only, with nothing to build.

Every part has a requirement. Ruling 449 (b) itself reads "Lit Watch, Position Leads, Audit and Slides headings are drawn by `GroupHead`". Both the step line and the brief read that narrower, as specific sections, and two headings of those views fall outside:
- Position Leads' run-log heading: `Leads.svelte:257-264`, a `ToolButton` with glyph `scout`, `leads.runlog`, folded by `runlogOpen`.
- The Slides view's Order heading: `src/lib/views/academic/slides/Order.svelte:48`, `<h3 class="name">{t('slides.order')}</h3>`.

Findings:
- 2.1: no part of the step line lacks a requirement. The step line, and the brief after it, leave out two headings of views that ruling 449 names: the Leads run log and the Slides Order section. After the step, the Slides pane would draw its groups with `GroupHead` and its Order section with the old `h3`. This is the session's call: either widen the brief (adding `Order.svelte` to the paths) or book an open item.

## 3. Premises

- `GroupHead.svelte`:
  - `wc -l` gives 89. It has the bare `ToolButton`, glyph keys `project.card.collapse_glyph` and `expand_glyph` (`config/text/views/boards/project.yml:51,66`, mapped to `minus-circle` and `plus-circle`), name `focus.fold` "Fold {0}" and `focus.unfold` "Unfold {0}" (`config/text/views/boards/focus.yml:119,150`), label at `--fs-md` in `var(--group, var(--muted-txt))`, count at `--fs-sm`, `margin: 0` (`GroupHead.svelte:61-88`), and no state. Matches.
- `Projects.svelte`:
  - `wc -l` gives 480. The `<div class="heading">` is at lines 421-430 inside the section at 420, so 419-431 matches.
  - The styles are at 449-464 (comment at 449, `.heading` at 451-457, `body.wall .heading` at 461-464), against the brief's 450-463. Off by one at each end; the content matches.
  - `.section + .section { margin-top: 14px }` is at 445-447. Matches.
- `Lanes.svelte`: `wc -l` gives 395. The `group` snippet runs 258-280 (brief: 258-279). `Surface` is at 260-270. `.lanes:not([hidden]) { margin-top: 4px }` is at 333-335. Matches.
- `Band.svelte`: `wc -l` gives 334. The section is at 156, `Surface` at 157-165, `.lanes:not([hidden])` at 225-227. Matches.
- `Venues.svelte`: `wc -l` gives 203. The section and `Surface` are at 128-137. `.timeline` is at 183-186 and `.cards` at 196-202, which match. `body.wall .timeline` is at 191-194, against the brief's 190-193 (off by one).
- `Surface.svelte`: `inset: -4px 0`, `padding: 0 8px`, `border-radius: var(--input-radius)`, `display: contents` without a wallpaper, and the one-layer rule at 104-111. Matches.
- `Bucket.svelte`:
  - `wc -l` gives 108. `radar.count` is `'{0} ({1})'` (`radar.yml:4`) and `let open = $state(true)` is at 44. Matches.
  - The `ToolButton` is at 52-57 inside the section at 49-75 (brief: 47-56).
  - The border and padding rule is at 78-81, against the brief's 75-78 (off by three).
  - `.cards { margin-top: 8px }` is at 102. Matches.
- `Radar.svelte`: `wc -l` gives 216. The Dismissed section is at 145-151. `dismissedOpen` is in `radar.ts:24,35,133`. `.dismissed` is at 205-208. Matches.
- `Leads.svelte`: `wc -l` gives 332. Expired is at 224-231. `leads.expired_sec` is "Expired / actioned ({0}) - hidden" (`leads.yml:25`). `expiredOpen` is in `leads.ts:32,68,225`. Matches. The brief leaves out that `.disclosure` also styles the run log at 257 (see 1.2).
- `Audit.svelte`:
  - `wc -l` gives 355. The section `h3` is at 195-199 (brief: 193-207 for the section, which matches loosely). The `h3` style at 254-263 is uppercase at `--fs-xs`. Muted is at 209-225 (brief: 209-222).
  - `Disclosure` is imported from `$lib/ui/tree/Disclosure.svelte` (`Audit.svelte:50`). `ls src/lib/ui/controls/Disclosure.svelte` answers "No such file or directory". Differs.
  - Not in the brief: the Audit pane is `tinted` (`Audit.svelte:182`). Its state is no state module: it is read inline with `instanceText` and `instanceFlag` (`Audit.svelte:77-79`) and written by replacing the whole state with `{ search, showMuted }` (`Audit.svelte:116,120`).
- `Slides.svelte`:
  - `wc -l` gives 437. The `h3 class="name"` and the `slides.count` and `slides.count_one` words are at 269-276. The section is a drop target at 259-267. Matches.
  - Not in the brief: the pane is `tinted` (`Slides.svelte:227-230`). Its state is `parseSlidesState` in `src/lib/state/life/slides.ts:59`. `Order.svelte:48` draws a second heading in the same pane.
- `FoldHead.svelte`: `wc -l` gives 123. `grep -rn "FoldHead" src --include='*.svelte' | grep import` lists `CommandCenterView.svelte`, `CareerPanel.svelte` and `Tasks.svelte`. Matches.
- `Disclosure` in `CrossLinks.svelte:66` and `History.svelte:300`: confirmed by grep. Matches, apart from the folder.
- `guarded.md`: the brief's own command `grep -n "GroupHead\|FoldHead\|fold" .scratch/migration/agents/guarded.md` prints 86 lines (`grep -c` gives 86), nearly all of them "folder". `grep -c "GroupHead\|FoldHead"` gives 0. The two lines with the word "fold" are 265 (the transcript fold) and 387 (G21, "a parser or a fold is written once"). The claim holds in substance, but the cited command does not show it as the brief implies.
- Rulings 448 (a), 449 (b) and 455 (a): present at `plan.md:2835,2836,2842`. Matches.

Findings:
- 3.1: the `Disclosure` path is wrong. It is `src/lib/ui/tree/Disclosure.svelte`; `src/lib/ui/controls/Disclosure.svelte` does not exist.
- 3.2: several line numbers are off by one to three: the Projects styles (449-464), Venues `body.wall .timeline` (191-194), the Bucket border rule (78-81), the Bucket heading (52-57) and Audit Muted (209-225).
- 3.3: the `guarded.md` grep the brief cites prints 86 lines, not nothing. The claim needs a command that shows it, for example `grep -c "GroupHead\|FoldHead"` (0) together with the two "fold" lines.
- 3.4: "What is on the tree" leaves out facts the step depends on:
  - The Audit and Slides panes are `tinted` and carry `data-surface` (`src/lib/ui/frame/Pane.svelte:70`).
  - The Audit state is written whole at `Audit.svelte:116,120`.
  - The Slides state is in `src/lib/state/life/slides.ts`.
  - `Order.svelte:48` heads a section of the Slides pane.
  - `Leads.svelte:257` shares `.disclosure`.
  - The Lanes and Band folds use `hidden="until-found"` with `onbeforematch` (`Lanes.svelte:274-275`, `Band.svelte:166`), while the other folds use `{#if}`.

## 4. Cases and checks

- Cases preamble ("the views rendered in the step's dev server ... measured in the page (`getBoundingClientRect`, `getComputedStyle`)") and "The builder's first task ... the first run of every case above on the unchanged tree": these break `spec.md`, "What every package obeys": "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says. A case that only a page shows is checked by reading and by the unit-level runs that reach it, and its row in the report names the look on landing as its proof". They also break the next rule: "A behaviour that needs a DOM (a press, a focus, an effect) is seen at the look on landing."
- Cases 1 to 13: each is a page measure or a DOM behaviour, and so is inconsistent as written for the reason above. Each should be stated as checked by reading plus the look on landing, with the view, the state to put it in and what should be seen.
- Case 10 ("the report quotes the measures as a table, one row per view"): a builder cannot take that measure under `spec.md`.
- Case 11 ("Career, Command center and Tasks on Focus: unchanged, measured before and after"): asks the builder to check places the step does not change (`FoldHead.svelte`, `CareerPanel.svelte`, `CommandCenterView.svelte` and `Tasks.svelte` are not in the paths).
- Cases 9 and 10 ("the eight views"): "What is on the tree" lists seven views (Projects, Focus, Venues, Lit Watch, Position Leads, Audit, Slides) across nine files. The count is eight only if Focus's clusters and band count as two, and the brief does not say so.
- Case 9 against item 1: item 1 says the strip paints nothing inside an element carrying `data-surface`, and case 9 asks that cards do not show through the sticky heading over a wallpaper. For the Audit and Slides panes, which are `tinted` and carry `data-surface`, the two cannot both hold (see 6.1).
- "Read, with sections or line ranges": `spec.md`, "Read first", limits the builder to "The files the brief lists, and only those". The list leaves out files the step writes or must read:
  - `src/lib/state/life/slides.ts` (the Slides state)
  - the four catalog files `config/text/views/feeds/radar.yml`, `leads.yml`, `system/audit.yml`, `academic/slides.yml`
  - `src/lib/state/workbench/layout/instance.ts` (the Audit's state helpers)
  - `src/lib/ui/tree/Disclosure.svelte`
  - `src/lib/ui/frame/Pane.svelte` (the tinted rule)
  - `Bucket.svelte`, `Radar.svelte` and `Leads.svelte` themselves, which item 3 reaches only through "the eight views"
- "Paths this step writes": "the state files of the Audit and Slides panes' state, each named in the report" and "the existing tests that build the changed pane states, each named in the report" leave paths unnamed. One is known now (`src/lib/state/life/slides.ts`), and the Audit has no state file.
- `spec.md`, "The working rules" (no silent design decisions, including "a key in a saved record"): the instance state is saved with the layout, and item 5 (Audit) and item 6 (Slides) do not name the new keys. Item 3 implies `folded` for Lit Watch only.

Findings:
- 4.1: every case, and the builder's first run, asks for a page run that `spec.md` forbids a builder. Each case should name the look on landing as its proof, with what should be seen, and use reading and unit-level runs where they reach.
- 4.2: case 11 asks the builder to measure places the step does not change.
- 4.3: case 9 contradicts item 1 for the tinted Audit and Slides panes (and for any view in a free float) over a wallpaper.
- 4.4: "the eight views" in cases 9 and 10 and in Read item 3 does not match the seven views listed.
- 4.5: the Read list leaves out files the step writes or depends on (above).
- 4.6: the new pane-state keys of the Audit and Slides are not named, and they are a saved user-visible shape under `spec.md`.

## 5. The question

- Case 1: no. It measures the strip, the 8 px and the background on Projects.
- Case 2: no.
- Case 3: no.
- Case 4: no.
- Case 5: no.
- Case 6: no.
- Case 7: no.
- Case 8: no.
- Case 9: no. It would catch a show-through, but as written it cannot pass for Audit and Slides over a wallpaper (4.3).
- Case 10: yes. It compares the views the brief lists, so it passes while the Inbox, LinkedIn and other views keep headings of their own (see item 7 below), short of "GroupHead is the only heading code".
- Cases 11, 12 and 13: no. These are guards against regressions.
- The check on the step's line: `plan.md:837` names no check of its own. The rulings in brackets are its only reference.
- Item 1: yes. Its rule "none inside an element that already carries `data-surface`" leaves the sticky strip transparent in the tinted Audit and Slides panes and in a free float over a wallpaper, so the item can be met while the heading does not stay readable at the top of the pane.
- Item 2: yes. The removal list names Lanes, Band, Venues, Bucket, Radar and Leads, but not the Audit's `.group { gap: 6px }` (`Audit.svelte:249-253`), which is space between the heading and its rows. The builder can follow the list and leave 14 px, and no page measure is allowed to catch it (4.1).
- Item 3: no. The goal is reached; the reveal gap is in 6.6.
- Item 4: no for the two headings named. The Leads run log is in 2.1.
- Item 5: no.
- Item 6: yes. The Slides pane keeps its Order heading (`Order.svelte:48`) drawn by its own `h3`, so the pane shows two heading styles while item 6 is met.
- Item 7: yes. Its check is Verify 8, which greps only for `collapse_glyph`, `expand_glyph`, `aria-expanded` and `expanded=`, so it cannot see headings that do not fold. `grep -rn "<h2\|<h3\|<h4" src/lib/views src/lib/shell --include='*.svelte'` shows views outside the list drawing grouping headings of their own:
  - Inbox's four card sections: `Inbox.svelte:164`, `<h3>{label} ({threads.length})</h3>` on a `Surface`.
  - Inbox's Triaged disclosure: `Inbox.svelte:219-226`, a `ToolButton` with glyph `done` and `triagedOpen`, the same kind as Dismissed and Expired. Verify 8 finds this one at `Inbox.svelte:224`, but the builder only has to name it "with why".
  - LinkedIn's Ideas and Posted sections: `Linkedin.svelte:216,246`, glyph, label and count on a `Surface`.
  - The session list's groups: `SessionWorkspace.svelte:204`, `TerminalRows.svelte:104`, name and count.
  - The Catalogue groups: `Catalogue.svelte:241`.
  - Pillars: `Pillars.svelte:112,144`.
  - Person: `Person.svelte:246-328`.
  - Keys: `Keys.svelte:125`.

  Item 7's sentence "No view other than those listed draws a grouping heading of its own" is false on the tree, and Verify 8 does not test it.
- Item 8: no.
- Item 9: no.
- Verify 7 (`grep -rn "<GroupHead" -B2 src/lib/views`): yes. In every view the line before `GroupHead` will be the group's own `<section ...>`, which does wrap it. The check gives no rule for telling a group container from a frame, and it cannot see space set on that section (Audit `.group { gap: 6px }`).

Findings:
- 5.1: item 1's one-layer rule leaves the sticky heading transparent in the tinted Audit and Slides panes and in free floats over a wallpaper.
- 5.2: item 2's list leaves out the Audit's `gap: 6px` between the heading and its rows.
- 5.3: item 6 leaves the Slides Order heading as it is.
- 5.4: item 7's claim is false on the tree. Inbox (four sections and Triaged), LinkedIn (Ideas, Posted), the session list, the Catalogue, Pillars, Person and Keys draw grouping headings of their own, and Verify 8 cannot detect the ones that do not fold. Ruling 448 (a) says `GroupHead` is the only heading code, while ruling 449 (b) names four views. Whether Inbox and LinkedIn, the closest matches since they are card sections of feed views like Lit Watch's, come into O88 is a scope question for Axel (a stop: a premise found wrong).
- 5.5: case 10 and Verify 7 can pass without the goal (above).

## 6. Implied inputs

This is a code step.

- 6.1: a tinted pane over a wallpaper. Audit (`Audit.svelte:182`) and Slides (`Slides.svelte:230`) carry `data-surface` (`Pane.svelte:70,125-128`). Missing. Expected result: the sticky strip still hides what scrolls under it, which item 1's "none inside `data-surface`" rule does not give. The brief must say what the strip paints there.
- 6.2: a view in a free float over a wallpaper. `FloatLayer.svelte:138` gives a free float `data-surface`, and its fill is `color-mix(... var(--wall-popover) ...)` (`FloatLayer.svelte:218-220`). Missing. Expected result: one layer and no show-through under the sticky strip.
- 6.3: grouping headings in views the brief does not list (Inbox, LinkedIn, session list, Catalogue, Pillars, Person, Keys; see 5.4). Missing. Expected result: either drawn by `GroupHead` or ruled out by Axel.
- 6.4: other headings in the listed views: Slides' Order (`Order.svelte:48`) and Leads' run log (`Leads.svelte:257-264`). Missing. Expected result: drawn by `GroupHead`, or named as kept with the reason.
- 6.5: the shared Leads classes. Removing `.disclosure` changes the run log, and removing `.cards` margin-top changes the live cards at `Leads.svelte:201`, which have no heading. Missing. Expected result: the run log and the live cards keep their own spacing unless 6.4 changes them.
- 6.6: a reveal into a folded group. `revealState` (`page-entry.ts:104-107`) opens Dismissed and Expired because "a card that is not mounted cannot be scrolled to". A Lit Watch paper in a folded bucket is not opened. The same holds for a Lit Watch search whose match is in a folded bucket, and for the Audit's arrow-key card cursor (`cardCursor`, `Audit.svelte:98`) over folded sections. Missing. Expected result: the bucket holding the revealed paper opens, or the brief states otherwise and names `page-entry.ts` in the paths.
- 6.7: pane state saved before the change, without the new folded lists. Missing. Expected result: read as nothing folded by the parser's default, with no migration code (`spec.md`, "What every package obeys").
- 6.8: a folded list naming a key that no longer exists (a bucket removed from `radar_buckets`, a deck group renamed), an empty key (a bucket row whose `key` is ''; `radarBucketShape` accepts any string, `radar.ts:27-32`) and a duplicated key. Missing. Under `spec.md`, "Every id or key a step introduces is checked empty, duplicated, and colliding". Expected result: an unknown key is ignored, and the empty and duplicated cases are stated.
- 6.9: an Audit search typed after a fold. `Audit.svelte:116,120` writes `{ search, showMuted }` and drops any other key. Missing. Expected result: the fold survives a search and a Muted toggle.
- 6.10: a Slides push that changes a group's `slides:` drops the work (`Slides.svelte:85-95`), and a Save clears it (`Slides.svelte:206`). Missing. Expected result: the folds survive both.
- 6.11: the rice themes. `Projects.svelte:477`, `Audit.svelte:352` and `Slides.svelte:434` set the mono face on the whole view under `body.rice:not(.rice-sans)`, and Focus, Venues, Lit Watch and Leads do not. So the heading's face differs between views under a rice theme. Missing from case 10. Expected result: stated as the same on every view under each theme, or the difference named.
- 6.12: a bucket with no glyph or an unknown colour. `bucket.glyph` may be '', and `toneOf('')` gives `UNKNOWN_TONE` (`tones.ts:198-200`). Missing. Expected result: no glyph drawn, and the label in the unknown tone or the muted colour, as stated.
- 6.13: the fold mechanism of the new folds. Lanes and Band use `hidden="until-found"` with `onbeforematch`, so a find-in-page match unfolds them (`docs/HELP.md:288` says so); the others use `{#if}`. The brief does not say which the new folds in Lit Watch, Audit and Slides use. Missing. Expected result: stated.
- 6.14: a heading label that wraps because of the count. Covered by case 12 (ellipsis).
- 6.15: a nested scroll container where sticky would not hold. `grep -n "overflow\|position: sticky"` over the nine files and `Pane.svelte` finds only the Pane body (`Pane.svelte:233-239`, `overflow: auto`) and `Venues.svelte:185` (the timeline, not an ancestor of a heading). `BoardList.svelte:13-15` says its table header has nothing to stick to, so it does not collide. Not a gap.

Findings: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12 and 6.13 are missing from "Cases".

## 7. ADRs

- `ls -d docs/adr` answers "ls: docs/adr: No such file or directory".
- `sed -n 1,30p .scratch/migration/orchestrator-state.md | grep -n -i "adr"` printed nothing (exit 1), and `grep -n -i "\badr" .agents/plan.yaml` printed nothing (exit 1). The configuration block names no `adr` key.
- No record exists. The brief's line 5 says the same.

Findings: none.

## 8. Dictated text

The brief dictates no literal line. `grep -n '"[A-Z][^"]*"' .scratch/migration/agents/briefs/O88.md` finds only quotes of existing text ("Fold <name>" and "Unfold <name>", existing catalog values, a command's output) and the report's first line "Everything in the brief is done", which `spec.md`, "Report", prescribes.

One instruction fixes text indirectly. `grep -n "keeps the rest" .scratch/migration/agents/briefs/O88.md` (line 42) says the label "keeps the rest of what it says", which from "Expired / actioned ({0}) - hidden" leaves "Expired / actioned - hidden". That keeps a spaced hyphen standing in for a dash, which the hub's prose standard bans in config YAML. The word "hidden" would also be false while the section is open under a fold control that shows its state. This label also becomes the control's name, "Fold Expired / actioned - hidden".

Findings:
- 8.1: item 4's "keeps the rest of what it says" fixes a label with a spaced hyphen and a word ("hidden") that is false when the section is open. The brief should dictate the label, for example "Expired / actioned".

## Declined to judge

- Whether Inbox, LinkedIn, the session list, the Catalogue, Pillars, Person and Keys fall under ruling 448 (a). That is Axel's call; the evidence is in 5.4.
- Whether the strip in a tinted pane or a free float should paint a second layer or something else. That is a design decision the brief or Axel must make; 6.1 and 6.2 only show that the brief's two rules collide there.
- Whether "Projects boards" includes the record board tab opened from the Career banner's Track record rows. I did not trace that view's drawing path.

Agent usage: ab3a4af18b70f6cab, claude-opus-5-5, 201882 tokens, 80 tool uses, 9 min 22 s.

## Closed

- 5.4, with 2.1 and 6.3: raised as open item 461, the stop of /spec O88. Every other finding is closed in the brief by the /spec after the ruling, as the `spec` skill's "Steps / The brief check" 4 says of a /spec run after a stop.
