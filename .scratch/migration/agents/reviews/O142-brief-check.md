# Step O142 brief check (on main at 6e6749703)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O142.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`.

`git log --oneline -1` printed `6e6749703 Book rulings 667 to 669 as steps O141 to O143`.

## 1. Names

- The step renames no file, heading, key or function. It changes how `GroupHead` draws a nested strip, and it changes the component's head comment. I grepped for the descriptions of the strip's look outside the brief's paths:
  - `git grep -n 'GroupHead' -- docs README.md config ':!config/local.yml'` printed nothing.
  - `git grep -n -i 'group heading\|heading strip\|group.s heading\|group strip\|groups strip' -- docs README.md src ':!config/local.yml'` printed, among others:
    - `src/lib/themes/tokens.css:234` "A strip that stays in place over rows scrolling in the same box (a group's heading, ...) paints the panel solid, so nothing scrolling under it shows through".
    - `docs/HELP.md:573` "A group's heading, a table's header row that stays in place, ... stay solid whatever it is set to, so nothing scrolling under them shows through."
    - `src/lib/ui/tree/Disclosure.svelte:5`, `src/lib/views/shared/card/pane-fold.ts:2-3`, `src/lib/views/system/status/Gallery.svelte:29` ("nested in the Gallery group"), `src/lib/views/system/findings/AuditSection.svelte:21-27`, and the `--group-strip` comments at `Usage.svelte:409`, `Login.svelte:152`, `Recent.svelte:130` and `Capacity.svelte:161`.
- None of these says anything about the label's size or the strip's indent, so none becomes false through the change itself.
- `tokens.css:234` and `HELP.md:573` become false if the indent is a margin that leaves the area beside a sticky nested strip unpainted. Section 6, item 2 covers this.

Findings: none. The conditional breakage of `tokens.css:234` and `HELP.md:573` is raised in section 6.

## 2. The step line

`grep -n '^- O142 ' .scratch/migration/plan.md` printed line 1670. Its parts, each with the requirement that serves it:

- "draws a group whose section stands inside another group's body one level below its parent": item 1 (opening sentence) and Decision 2.
- "its label at the small size": item 1, first bullet.
- "indented to start under the parent's label": item 1, second bullet ("its fold control starts where the parent strip's label starts"). The child's labels already line up with the parent's when there is no indent, since both strips have the same padding and fold control. So the brief's reading (the child's strip starts under the parent's label) is the only one in which "indented" changes anything.
- "its count beside it": item 1, first bullet.
- "the strip still sticky under its parent's": item 1, third bullet, and C6.
- "the Findings view's Audit kinds and Muted ... and the Status view's Gallery sections ... take it with no change of their own": item 2, C2 and C3.
- "the component's head comment says so": item 3.
- "(ruling 668)": `grep -n 'Open item 668' .scratch/migration/plan.md` printed line 3527: "(a), step O142, `GroupHead` draws a group nested in another group's body one level down ... (d), no change, was the lazy option (the user)". The brief cites it in its second paragraph.

Findings: none.

## 3. Premises

- "`GroupHead.svelte` (239 lines)": `wc -l` printed `239`. Matches.
- `<section class="group">`, `<h3 class="strip">` and `<div class="body">`: `cat -n` shows them at :143-178. Matches.
- `.strip` at `:188-202`, sticky at `top: var(--group-above)`, `--fs-md`, padding `2px 8px`, colour `--group` or `--muted-txt`: lines 188-202 hold exactly these (:190, :200, :197, :201). Matches.
- `.count` at `:226-229`, `--fs-sm`: matches.
- `--group-strip` passed down at `:172`, and `.group` reading it as `--group-above` at `:181-184`: matches.
- Head comment at `:2-68`: matches. The SubHead sentence is at :8-9. "The look of the strip is the same" is :48, and it sits in the tree paragraph :45-48. Matches.
- `AuditSection.svelte:189-233`: the outer `GroupHead` runs from :189 to :232, the kinds `GroupHead` is at :199 (inside `{#each sections}`), and Muted is at :216; `{/if}` is :233.
  - `sed -n '1,30p' config/text/views/system/audit.yml | grep -n 'sec_\|muted:\|title:'` printed: Audit, "Open items (TODO / VERIFY)", Missing data, Hub conventions, Manifest guardrails, Readability, Website, Muted.
  - Matches.
- `Status.svelte:20-27`, `:39`: `grep -n` printed `20: // The Gallery is a group that starts closed`, `39: import Gallery from './Gallery.svelte';`, `131: <GroupHead`, `141: </GroupHead>`.
  - The cited lines are the head comment and the import. The Gallery's `GroupHead`, the outer group of this nesting, is drawn at `Status.svelte:131-141`, and `<Gallery>` is at `:139` inside its body.
  - This is a citation gap: item 2 asks for "both groups' file and line", and the brief never gives :131.
- `Gallery.svelte` lines `:235`, `:277`, `:299`, `:317`, `:336`, `:344`, `:364`, `:382`: `grep -rn '<GroupHead' src --include='*.svelte'` printed exactly these eight. Matches.
- "Seen on a scratch server at O140's landing": `grep -n -i 'missing data\|identical\|Audit 77' .scratch/migration/agents/reviews/O140-landing.md` printed `56:- The Findings view's Audit group, for open item 668: "Audit 77" and "Missing data 75" are drawn as identical strips.` Matches.
- "39 files draw `GroupHead`": `grep -rc '<GroupHead' src/lib | grep -v ':0' | wc -l` printed `39`. Matches.
- The `--group-strip: 0px` resets and readers: `grep -rn -- '--group-strip' src` printed `Usage.svelte:412`, `Login.svelte:155`, `Recent.svelte:133`, `Capacity.svelte:164`, `Table.svelte:110` and `List.svelte:210`. Matches.
  - Each reset box holds only a `Table`: `grep -n 'class="scroll"' -A4` printed `<Table ...>` in Login :126-127, Recent :120-121 and Capacity :97-98, and `class="scroller"` holds `<Table` at `Usage.svelte:300-301`.
  - So no `GroupHead` stands in a reset box (see section 4, C5).
- "`--fs-sm` is 12 px and `--fs-md` the row size (`src/lib/themes/tokens.css:161-167`, the scale's comment and `:167`)": `grep -n` printed `155: /* Type scale.`, `165: rest. */`, `167: --fs-sm: calc(12px * ...)` and `168: --fs-md: calc(13px * ...)`.
  - The comment runs from :155 to :165, and its role sentence is at :161-162.
  - `--fs-md` is at :168, which the brief does not cite.
  - `src/lib/themes/themes.css:53-54` (`body.rice`) sets `--fs-sm` to 11px and `--fs-md` to 12px, so "12 px" holds only for the default scale.
  - Small citation gaps.
- "No test reads the strip's look": `grep -rln GroupHead tests` printed nothing (exit 1). Matches.
- "the repository has no `docs/adr` folder": `ls docs/adr` printed `ls: docs/adr: No such file or directory`. Matches.

Findings:
- 3.1. The Status view's outer group is cited as `Status.svelte:20-27`, `:39` (comment and import). The `GroupHead` that the Gallery sections nest in is `Status.svelte:131-141`, with `<Gallery>` at `:139`. Item 2 needs this line.
- 3.2. `tokens.css:161-167` is cited for the scale. The comment is `:155-165`, `--fs-sm` is `:167` and `--fs-md` is `:168`. The rice themes set `--fs-sm` to 11px (`themes.css:53`).

## 4. Cases and checks

- Preamble ("checked by reading the code and, where the page is needed, on a scratch server the builder does not start ...; the report gives the computed style the code produces for each"): this is consistent with the rules file's "What every package obeys" (a builder runs no page, and the look at landing is the proof).
  - "Computed style" is a browser measurement the builder cannot take. The rules file's "The working rules that bind every package" says "never state a measurement not taken".
  - The wording should ask for the declared values the CSS cascade gives by reading, and name the look at landing for the computed values.
- C1, the Findings view's Audit strip unchanged: consistent. It checks the changed component's effect in a file the step does not change, which is legitimate as a guard.
- C2, kind strips and Muted one level down: consistent.
- C3, the Gallery strip unchanged and the eight sections one level down: consistent.
- C4, a top-level `GroupHead` of Venues and of the Projects board unchanged: consistent. It checks places whose files the step does not change, which is legitimate as a guard on the changed component.
  - It is also the case that catches a selector keyed on any `.body`, since `Pane.svelte:89` wraps every view in `<div class="body" ...>` (see section 6).
- C5, "A `GroupHead` inside a box that resets `--group-strip: 0px` (the Usage view's history table)": the case describes a place that does not exist on the tree.
  - The Usage History `GroupHead` is at `Usage.svelte:292`, and its reset box `.scroller` (`:300`, style `:411-414`) holds only a `<Table>`.
  - The three HPC reset boxes hold only a `<Table>` too (section 3).
  - The case asks the builder to check and report a place the step does not change, and that place is not what the case says it is.
- C6, a nested strip still sticky under its parent's: consistent.

Findings:
- 4.1. C5 names a place that does not exist: no `GroupHead` stands inside any of the four `--group-strip: 0px` boxes (`Usage.svelte:300`, `Login.svelte:126`, `Recent.svelte:120`, `Capacity.svelte:97`, each holding only a `Table`). Rewrite the case, for example as "a `Table` with a sticky header inside a nested group (the Gallery's Table section, `Gallery.svelte:336-342`) keeps its header under both strips". Otherwise drop it.
- 4.2. The preamble asks for "the computed style", a measurement a builder who runs no page cannot take. Ask for the declared values by reading, and leave the computed values to the look at landing.

## 5. The question

`plan.md` has no `## Goal` section: `grep -n '^## ' .scratch/migration/plan.md` printed only `## Steps, in execution order`, `## Could run in parallel`, `## Rulings`, `## Agents` and `## Blocked, and by what`. "The goal" is therefore taken as ruling 668 (a) and the step line: a nested group's heading reads one level under its parent in the Findings Audit and the Status Gallery, with nothing else changed.

I checked whether Svelte's scoped CSS can express the brief's first option ("a selector on a `.group` inside a `.body`") within the one component. I compiled a probe component with the repository's own compiler (Svelte 5.57.1, `node -e "console.log(require('svelte/package.json').version)"`) from the scratch file `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o142probe/probe.mjs`. It holds the `.group`/`.strip`/`.body` markup of `GroupHead.svelte` and `{@render children()}` in the body. `node probe.mjs` printed:

```
/* (unused) .body .group > .strip { font-size: 12px; }*/
/* (unused) .group .group > .strip { margin-left: 4px; }*/
.body .group.svelte-yopwl3 > .strip:where(.svelte-yopwl3) { color: blue; }      <- from :global(.body) .group > .strip
.group.svelte-yopwl3 { --x: 1; }
@container style(--nested: 1) { .strip.svelte-yopwl3 { font-size: 11px; } }
WARN css_unused_selector Unused CSS selector ".body .group > .strip"
WARN css_unused_selector Unused CSS selector ".group .group > .strip"
```

`.body :global(.group) > .strip` is a compile error: "`:global(...)` can be at the start or end of a selector sequence, but not in the middle". `probe2.mjs` printed `.body.svelte-yopwl3 .group > .strip { font-size: 12px; }` for `.body :global(.group > .strip)`.

So the plain scoped selector is removed by the compiler with only a warning. The form with `:global(.body)` matches every `.body` on the page: `Pane.svelte:89`, `Card.svelte:126`, `Settings.svelte:446`, `PaneBody.svelte:316` and `Workbench.svelte:389`, found by `grep -rn 'class="body"' src --include='*.svelte'`. The forms that compile and match only a `GroupHead` body are:
- `.body :global(.group > .strip)`: the scoped body with a global tail.
- A value the body passes down, as `--group-strip` already is.

The pruned selector also goes unnoticed by the verify list:
- `tests/tiers/quick.mjs:297` runs `svelte-check` with `['--incremental', '--tsconfig', './tsconfig.json']` and no `--fail-on-warnings`.
- `svelte/valid-compile` is `recommended: false` in eslint-plugin-svelte 3.23.0 (`node_modules/eslint-plugin-svelte/lib/rules/valid-compile.js:20`), and `grep -n 'valid-compile' eslint.config.js` printed nothing.

Each check:

- C1: yes, it passes on the unchanged tree. It is a guard and is not meant as proof of the goal.
- C2: yes. Checked by reading, a builder can read `.body .group > .strip { font-size: var(--fs-sm) }` as applying, while the compiler drops it and `test:quick` stays green. Only the look at landing would catch it.
- C3: yes, for the same reason as C2.
- C4: yes on the unchanged tree. It is a guard.
- C5: it cannot be run as written (section 4).
- C6: yes, since `top` is unchanged on the unchanged tree. It is a guard.
- The step line's "no change of their own" (a diff of only `GroupHead.svelte`): yes, it passes with a pruned rule.
- Item 1: yes, by the pruned selector above.
- Item 2 (the list of nested places): no. It is a fact list that the reviewer can rerun.
- Item 3 (head comment): yes. The comment can be rewritten at :48 and still say at :29-31 "its label at the medium size in the group's hue ... and its count at the small size", which becomes false for a nested group.
  - Item 3 targets "the sentence that the strip's look is the same everywhere". No sentence says "everywhere": `grep -n 'same' GroupHead.svelte` printed :14 ("pads its words the same in every mode"), :31 and :48 ("The look of the strip is the same.", about a tree's row).
  - The views that nest it are already named at :55-56 ("the Findings view's Files and Audit, with the Audit's kinds and Muted nested in it") and :61-62 ("the Status view's hooks and Gallery, with the Gallery's sections nested in it").
- Verify 1 to 3 (`test:quick`, ASCII, 100 columns): yes. None of them reads the look, and all three pass on the base (verify 2 and 3 run on main printed nothing).

Findings:
- 5.1. Item 1, C2 and C3 can pass without the goal. A scoped `.body .group ...` selector compiles to a comment (`/* (unused) ... */`) with only a `css_unused_selector` warning, and no command of the verify list fails on that warning. The brief should do two things:
  - Name this in "What is on the tree": the plain selector is pruned, `:global(.body)` matches `Pane.svelte:89` and every other `.body`, and the two forms that hold are a scoped `.body` with a `:global(...)` tail, or a value the body passes down.
  - Add a check that fails on the pruned rule, such as the `svelte-check` lines of the final `test:quick` run quoted with `0 WARNINGS`, or the compiled selector of the nested rule quoted from the build.
- 5.2. Item 3 names a sentence that is not there ("the strip's look is the same everywhere"). It does not name the sentence the change makes false, `GroupHead.svelte:29-31` "its label at the medium size ... and its count at the small size". It also asks for the nesting views to be named, though :55-56 and :61-62 already name them.
  - A builder who replaces :48 removes the tree paragraph's true statement and leaves :29-31 false.
  - Item 3 should name :29-31 as the sentence to rewrite, keep :48, and say that :55-56 and :61-62 already name the nesting views.

## 6. Implied inputs

This is a code step (a component's CSS and comment). I enumerated every place where a `GroupHead` stands inside another `GroupHead`'s body:
- I read every `<GroupHead` tag from `grep -rn '<GroupHead' src --include='*.svelte'` (39 files).
- I found where each component that draws a `GroupHead` at its top level is rendered, with `grep -rnE "<(Bucket|GitSteps|Referrers|Order|Keys|Hooks|ScheduleList|AppHosts|Login|Quota|Recent|Capacity|Latex|Lanes|Band|List|EntryFolder|Gallery|AuditSection|FolderFiles)( |/|>|$)" src` (one name at a time).
- I read each parent's markup: AccountSetup :117-184, Radar :150-193, Slides :322-431, Projects :456-466, Focus :372-395, Lanes :252-265, Settings :446-470, List :109-196, Entry :361-368, EntryFolder :91-150, Person :260-303, Project :153-202, Latex :43-64, Cluster :114-138, Hpc :63, Processes :69, UpdateTray :163-224, Catalogue :256-285, Inbox :203-275, Leads :221-275, Linkedin :235-294, Usage :240-311, Findings :155-200, RecordPage :59-68.

The nested places are exactly:
- `AuditSection.svelte:199` (each kind) and `:216` (Muted), inside `AuditSection.svelte:189` (Audit).
- `Gallery.svelte:235`, `:277`, `:299`, `:317`, `:336`, `:344`, `:364` and `:382`, inside `Status.svelte:131` (Gallery; `<Gallery>` at `:139`).

No nesting is two deep. Every other `GroupHead` is a sibling at its view's top level. The places the question names:
- In a card: `Usage.svelte:240` (Live) stands inside `<Card>` (`Usage.svelte:189`), in `Card.svelte:126`'s `<div class="body">`, and inside no `GroupHead` body. Under the brief's rule it is unchanged, but a `:global(.body)` selector would draw it nested.
- In a float or tray: `UpdateTray.svelte:170` and `ScheduleList.svelte:70` are siblings at the tray's top. Unchanged.
- In a tree (the `row` prop): `grep -rn -A15 '<GroupHead' src --include='*.svelte' | grep -E '^\S+-[0-9]+-\s+(row[=}]|\{row\}|\{\.\.\.)'` printed nothing (exit 1). No caller passes `row` or a spread, so no tree draws a `GroupHead` today.
- In a box that resets `--group-strip`: none holds a `GroupHead` (section 3).

The brief's rule, keyed on a `GroupHead` body, therefore changes no place it does not name. Only a selector keyed on any `.body` would: every view's groups through `Pane.svelte:89`, Usage's Live through `Card.svelte:126`, and Settings' groups through `Settings.svelte:446`. C4 catches the Pane case, but no case names the Card or the Settings case.

Implied inputs, each listed under "Cases" or missing:
- 6.1. The area beside an indented sticky strip while its parent's body scrolls under it: missing.
  - With the indent as a margin, the rows of the Audit kinds (`AuditSection.svelte` `li`, `padding: 0 6px`, full width) and the Gallery samples show through left of the nested strip. The strip sits at `top: var(--group-above)` below the parent's strip, and nothing paints that band.
  - This contradicts the head comment (`GroupHead.svelte:15-16` "so what scrolls under it never shows through"), `tokens.css:234` and `docs/HELP.md:573`.
  - Expected result: the solid `--panel` paint covers the nested strip's band from its group's left edge, for example with the indent as padding inside the strip, so nothing scrolls into view beside it.
  - Item 1 says "the solid `--panel` paint" but does not say where it starts.
- 6.2. A `GroupHead` whose ancestor is some other component's `.body` but no `GroupHead` body: missing as a named case, though C4 covers the Pane case.
  - Places: Usage's Live in a `Card` (`Usage.svelte:240`, `Card.svelte:126`) and the Settings groups (`List.svelte:109` under `Settings.svelte:446`).
  - Expected result: top-level look.
- 6.3. Indent under another theme or text scale: missing.
  - The parent's label starts at the strip's 8px padding plus the fold control (`ToolButton` bare, `min-width: var(--bare-box, var(--tab-action))`, `ToolButton.svelte:230`; `--tab-action: calc(22px * var(--text-scale, 1))`, `tokens.css:193`) plus the 6px gap (`GroupHead.svelte:194`).
  - A fixed px indent misaligns under `--text-scale` and the rice themes (`themes.css:51-57`).
  - Expected result: the indent derived from the same tokens, so the fold control stands under the parent's label at any scale. The brief's report section asks for default, light and VS Code themes, but no case covers a scaled or rice theme.
- 6.4. A parent strip with a glyph: missing.
  - "Where the parent strip's label starts" is then after the glyph (`GroupHead.svelte:155-159`). No nesting parent has a glyph today (Audit `:189-195` and Gallery `Status.svelte:131-137` pass none), so this input has not happened.
  - Expected result: stated in the brief, either the start of `.words` or the start of `.name`.
- 6.5. A group nested two deep: item 1 requires "indented under its own parent the same way", but no case covers it and no place on the tree has it.
  - A descendant selector gives one constant indent at every depth.
  - Expected result: twice the indent at depth two, for example through a value the body adds to and passes down, as `--group-strip` is summed (`GroupHead.svelte:172`, `:182`). Otherwise the brief should say the requirement is met by reading alone.

Findings: 6.1, 6.2, 6.3 and 6.5 are missing from "Cases"; 6.4 needs its reading stated.

## 7. ADRs

- `ls docs/adr` printed `ls: docs/adr: No such file or directory`.
- `grep -n 'adr' .agents/plan.yaml .scratch/migration/orchestrator-state.md` printed nothing, so the configuration block names no `adr` folder.
- `find . -path ./node_modules -prune -o -name '[0-9][0-9][0-9][0-9]-*.md' -print` printed nothing.
- No record. The brief says "No ADR touches this step".

Findings: none.

## 8. Dictated text

- "Everything in the brief is done", found by `grep -n 'Everything in the brief is done' .scratch/migration/agents/briefs/O142.md` (`73:- The first line: anything NOT done, or "Everything in the brief is done".`): holds (rules file, "Report" and "Prose"). It is ASCII, plain, and the rules file's own wording.
- Item 3 says what the comment must say without giving its words, so it is not dictated.
- The verify commands are code lines and hold. `LC_ALL=C perl -ne 'print "$.: $_" if /[^\x20-\x7E\n]/' .scratch/migration/agents/briefs/O142.md` printed nothing.

Findings: none.

## Declined to judge

- Whether the indent is a margin or a padding, and whether depth two is met by reading alone. Both are choices between ways to build the ruled look; the findings in section 6 name them for the session to settle in the brief.
- The computed size, indent and stickiness on a page. This needs the look at landing, which a read cannot settle.
- Whether `plan.md` should carry a `## Goal` section. That concerns the plan's shape, outside this step's brief.

Agent usage: a9d682e40ef0d4ed4, claude-opus-5-5, 204165 tokens, 70 tool uses, 9 min 13 s.

## Closed

- 3.1: the Gallery group is cited as `Status.svelte:131-141`, `<Gallery>` at `:139`.
- 3.2: the scale is cited as `tokens.css:167` and `:168`, with the rice themes' 11 and 12 px (`themes.css:53-54`).
- 4.1: C5 is rewritten to a `GroupHead` inside another component's `.body` (Card, Settings), and the Table under both strips joins C6.
- 4.2: the cases are checked by the declared values the cascade gives, and by a case-run program that prints the compiled CSS; computed values are the look at landing.
- 5.1: "What is on the tree" names the pruning and the forms that hold; item 1 allows only those; C7 and verify 2 check the compiled CSS for a live selector and no `css_unused_selector` warning; verify 1 asks for `0 WARNINGS` on the `svelte-check` line.
- 5.2: item 3 names `:29-31` as the sentence to rewrite, keeps `:48`, and says `:55-56` and `:61-62` already name the nesting views.
- 6.1: item 1 makes the indent padding inside the strip, so `--panel` covers the band; Decision 4.
- 6.2: C5.
- 6.3: item 1 derives the indent from the fold-control box and the gap; C8.
- 6.4: Decision 3 states the reading: the nested fold control starts where the parent's glyph or label starts.
- 6.5: item 1 sums the indent per level through a value each body passes down; C9.
- The base copy `.agents/worktrees/O142-base/` and its `unused-exports.txt`, and the doc paragraphs `tokens.css:234` and `docs/HELP.md:573`, are named in "What is on the tree", as the state file's standing demand asks.
