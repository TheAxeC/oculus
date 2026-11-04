# O142 review: a nested group's heading one level down

## Verification lines, verbatim

All runs were made from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O142` with `PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH`.

1. `npm run diagrams` printed its list of files, ending `docs/diagrams/writes.svg`. After it, `git status --short` printed only ` M src/lib/ui/controls/heads/GroupHead.svelte` and `?? .scratch/migration/agents/reviews/O142-report.md`, so no diagram changed.
   `npm run test:quick`, tail of the run:
   ```
   ok      prettier (1.2 s): All matched files use Prettier code style!
   ok      ASCII gate (1.4 s)
   ok      svelte-kit sync (3.7 s)
   ok      eslint (2.6 s)
   ok      svelte-check (9.7 s): 1793755250405 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
   ok      vitest checks (46.4 s): Duration  34.75s (transform 14.02s, setup 0ms, import 29.32s, tests 43.36s, environment 2ms)
   test:quick: 50.2 s; every command passed
   ```
   A second invocation, piped to `head -6` so that `head` stopped it after six lines, printed the header lines: `test:quick: 2 changed file(s), from git since HEAD` and `test:quick: 9 test file(s)`. The count is 2 here and 1 in the builder's run because the untracked report is now in the tree.
2. Case-run program. It was copied from the report's quoted source to `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o142-review/compile-grouphead.mjs`. `diff` against the builder's file printed `SAME-SOURCE`. Run over the worktree's file:
   ```
   4:    .group.svelte-yopwl3 {
   6:        --group-inset: var(--group-indent, 0px);
   12:    .body.svelte-yopwl3 {
   13:        --group-label: var(--fs-sm);
   14:        --group-indent: calc(var(--group-inset) + var(--bare-box, var(--tab-action)) + 6px);
   29:        padding: 2px 8px 2px calc(8px + var(--group-inset));
   54:        font-size: var(--group-label, var(--fs-md));
   74:--- warnings: 0
   75:--- unused comments: 0
   76:--- css_unused_selector warnings: 0
   ```
   - My output is byte-equal to the builder's `run2-after.txt` (`SAME-RUN2`).
   - Over the base copy's file, the output has no `group-inset`, `group-indent` or `group-label` line, and prints `--- warnings: 0`, `--- unused comments: 0`, `--- css_unused_selector warnings: 0`. It differs from the builder's `run1-base.txt` only in the file path on line 1.
3. `LC_ALL=C perl -ne 'print "$ARGV:$.: $_" if /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/ui/controls/heads/GroupHead.svelte` printed nothing (exit 0).
4. `awk 'length($0)>100{print FILENAME": "FNR}' src/lib/ui/controls/heads/GroupHead.svelte` printed nothing (exit 0).

The report's other evidence, rerun:
- `diff -rq -x local.yml -x node_modules <base>/<d> <d>` for `src tests utils config` printed the one line `Files .../O142-base/src/lib/ui/controls/heads/GroupHead.svelte and src/lib/ui/controls/heads/GroupHead.svelte differ`.
- `sh utils/unused-exports.sh` to scratch, then `diff` against `O142-base/unused-exports.txt`: no output, exit 0.
- `wc -l`: 259 (worktree) and 239 (base).
- `grep -rn -e '--group-label' -e '--group-indent' -e '--group-inset' src tests docs README.md` finds hits only in `GroupHead.svelte:36,37,192,199,200,215,240`. The same grep over `config --exclude=local.yml` exits 1.
- `grep -rho -- '--group-[a-z-]*' src` on the base finds only `--group-above` (4) and `--group-strip` (10).
- History-word grep over the added lines: one hit, `+       before the fold control, so the strip paints its whole band. */`. "Before" there names a place in the strip, so it is not history.
- Non-ASCII grep over the added lines: exit 1, no hit.
- Fill of the changed comment paragraphs: no line ends short. Lengths are `:28-42` 98 96 98 98 96 100 96 97 96 95 97 97 99 99 89; `:196-197` 97 90; `:203-205` 99 98 70; `:236-237` 98 85. The awk check printed no `SHORT` line.

## Item verdicts

- **Item 1: holds.**
  - `.body` (`GroupHead.svelte:198-201`) passes `--group-label: var(--fs-sm)` and `--group-indent: calc(var(--group-inset) + var(--bare-box, var(--tab-action)) + 6px)` to everything inside it.
  - `.group` (`:192`) copies the inherited indent into `--group-inset`. `.strip` (`:215`) pads its left side by `calc(8px + var(--group-inset))`, and `.name` (`:240`) reads `var(--group-label, var(--fs-md))`. `.count` stays at `--fs-sm` (`:248`).
  - The selector is GroupHead's own scoped `.body.svelte-yopwl3`, so it cannot match another component's `.body`. No prop was added. Two deep adds a level, because each body sums from its own section's inset.
  - Everything else is unchanged: `top`, gap, margin, `--panel` paint, colour and actions.
- **Item 2: holds.**
  - `diff -rq` shows only `GroupHead.svelte` changed.
  - Nested places, from my own read:
    - `AuditSection.svelte:199` (the kinds) and `:216` (Muted), inside the Audit group at `:189-232`.
    - `Gallery.svelte:235`, `:277`, `:299`, `:317`, `:336`, `:344`, `:364`, `:382`, inside the Gallery group at `Status.svelte:131-141`, with `<Gallery>` at `:139`.
  - The component tags inside every caller's `GroupHead` blocks (an awk walk over all 39 files) and the importers of all 39 components show no other place: Order and Keys sit at `Slides.svelte:322,334`, before `:345`; Bucket at `Radar.svelte:150`, before `:166`; Latex at `Project.svelte:153`, before `:155`; GitSteps at `AccountSetup.svelte:158`, between `:157` and `:160`; ScheduleList at `UpdateTray.svelte:163`, before `:170`; AuditSection at `Findings.svelte:200`, after `:198`; Hooks at `Status.svelte:127`, before `:131`. The importers of the rest (Entry, Cluster, Focus, Settings, Processes, Workbench) draw no `GroupHead`.
  - The report's table matches this list.
- **Item 3: holds.**
  - `:28-42` gives the label and count sizes for a top-level strip and for a nested one, how a nested strip is indented, and why the indent is padding.
  - The old `:48` is now `:57`, unchanged. The old `:55-56` and `:61-62` are now `:64-65` and `:70-71`, unchanged.
  - Filled at 100 columns (see the fill check above).

## Case verdicts

- **C1: met.** Audit stands in `Findings.svelte` and `Pane.svelte:89`'s `.body`, neither of which declares `--group-indent` or `--group-label`. So `--group-inset` = 0px, the padding is 2px 8px, and `.name` is at `--fs-md`.
- **C2: met, by reading and the compiled CSS.** Label and count are at `--fs-sm`, and the left padding is 8 + 22s + 6 px. The drawn look is checked at landing.
- **C3: met.** The Gallery strip is top-level, as in C1. The eight sections are one level down, as in C2.
- **C4: met.** `Pane.svelte:89`'s `.body` carries Pane's scoped class, not `svelte-yopwl3`.
- **C5: met.** `Card.svelte:126` (style `:308-312`, which sets margin, font-size and colour only) and `Settings.svelte:446` declare neither property. `Usage.svelte:189`'s Card is inside no `GroupHead`; the file's first `GroupHead` is the Live group at `:240`.
- **C6: met by reading.** `top: var(--group-above)` (`:208`), `:191` and the body's `style:--group-strip` (`:181`) are unchanged. The strip's height is set by the 22s fold control, so the smaller label does not change the sum. `Table.svelte:110` still reads `--group-strip`. The scrolled look is checked at landing.
- **C7: met.** Verification line 2 shows the live `.body.svelte-yopwl3` rule and 0 warnings. The base has no nested rule.
- **C8: met by reading.**
  - The fold control is a bare `ToolButton`: `box-sizing: border-box; min-width: var(--bare-box, var(--tab-action)); padding: 0 var(--tab-action-pad)` (`ToolButton.svelte:226-232`), and its glyph is 16s wide (`Glyph.svelte:72`). Its width is therefore exactly 22s, and the parent's label starts at 8 + 22s + 6 px, the same place as the nested fold control.
  - `--tab-action` is declared only at `tokens.css:193`. `--text-scale` is set on `document.documentElement` (`appearance.svelte.ts:109`), so the button and the body resolve the same box.
  - `--bare-box` is set only on `Pane.svelte:152` (header), `Toolbar.svelte:313` (popover) and `PageLeaf.svelte:142` (head), and none of these holds a group body.
  - The drawn alignment is checked at landing.
- **C9: met by reading.** A two-deep strip pads 8 + 2(22s + 6) px. No two-deep place exists in the tree.

## Cascade

The tables give each declared value and where it comes from. s is the text scale. The default sizes are 13s px (`--fs-md`, `tokens.css:168`) and 12s px (`--fs-sm`, `:167`); under `body.rice` they are 12s and 11s (`themes.css:53-54`).

**Top-level group** (Audit, Gallery, Venues):

| Value | Declared | Comes from | Result |
| --- | --- | --- | --- |
| `.name` font-size | `var(--group-label, var(--fs-md))` | no ancestor sets `--group-label`, so the fallback | `--fs-md` |
| `.count` font-size | `var(--fs-sm)` | the token | `--fs-sm` |
| strip `padding-left` | `calc(8px + var(--group-inset))` | `--group-inset` = `var(--group-indent, 0px)`, and no ancestor sets `--group-indent` | 8px |
| strip `top` | `var(--group-above)` | `var(--group-strip, 0px)` | 0px |

**One deep** (Audit kinds and Muted, the Gallery sections):

| Value | Comes from | Result |
| --- | --- | --- |
| `.name` font-size | `--group-label`, inherited from the parent `.body` (`:199`), where `var(--fs-sm)` is resolved | `--fs-sm` |
| `.count` font-size | the token | `--fs-sm` |
| strip `padding-left` | `--group-inset` = the parent body's `--group-indent` (`:200`) = `calc(0px + var(--tab-action) + 6px)` | 8 + 22s + 6 = 36 px at s = 1 |
| strip `top` | `--group-above` = the parent body's inline `--group-strip` (`:181`) | the parent strip's height |

**Two deep** (by reading; none in the tree):

| Value | Comes from | Result |
| --- | --- | --- |
| `.name` font-size | the one-deep body's `--group-label` | `--fs-sm` |
| strip `padding-left` | `--group-inset` = the one-deep body's `--group-indent`, which adds a second box and gap | 64 px at s = 1 |
| strip `top` | the one-deep body's `--group-strip` | the sum of both strips' heights |

**Group in a Card or the Settings `List`, with no `GroupHead` above:** identical to top-level. `Card.svelte:126` and `Settings.svelte:446` are other components' scoped `.body` elements and declare neither property.

**Leak check:** no caller is affected.
- The two properties are declared only on GroupHead's own scoped `.body` (the grep above).
- They do inherit into every DOM descendant of a group body, at any component depth, and no box resets them the way the `--group-strip: 0px` boxes reset the strip height.
- No caller draws a `GroupHead` meant to be top-level inside another `GroupHead`'s body: the only component-level nesting is `Gallery` in `Status.svelte:139`, which the ruling intends. No menu, popover or tree in a group body draws a `GroupHead`.
- Nothing outside `GroupHead.svelte` reads either name.
- No caller is named for a leak.

## Spec

- **Premise not reproduced: the list of `.body` elements** (brief, "What is on the tree", fourth bullet; report, "Wrong or impossible in the brief: Nothing. Every premise checked held: ... the other `.body` elements").
  - `grep -rn 'class="body"' src --include='*.svelte'` on the base prints 16 hits. The brief names five (Pane, Card, Settings, PaneBody, Workbench) besides GroupHead's own.
  - The other ten: `EntryLink.svelte:53,57,61`, `EntryFields.svelte:181`, `academic/present/parts/Plain.svelte:24,39,42`, `academic/present/parts/Project.svelte:116`, `workbench/editors/Fold.svelte:68`, `sessions/terminal/transcript/TurnList.svelte:100`.
  - No decision rests on it: the mechanism keys on GroupHead's scoped `.body`, and none of the ten holds a `GroupHead`.
  - Failure scenario: a reader of the report takes the brief's five as the whole list and chooses a selector by it. This review's verdicts are unaffected.
- No other Spec finding:
  - Every DONE item does what the brief says.
  - No change outside the write list. No caller changed. No reserved decision taken.
  - The first run of every case is given.
  - The only program is the approved case-run program, kept in scratch.

## Proof

- **The report's judgment call 4 does not reproduce** (`O142-report.md:347`): "The `6px` of the indent is written as a literal beside the strip's `gap: 6px` (`:212`), each with a comment naming the other".
  - Only the `.body` comment (`GroupHead.svelte:196-197`, "one fold control's box and the strip's 6 px gap") names the other side.
  - `gap: 6px;` at `:212` has no comment, and the `.strip` comment at `:203-205` ("A nested group's indent is padding before the fold control, so the strip paints its whole band.") does not name the indent's 6 px.
  - Failure scenario: see Standards, first finding.
- No other count, path or measurement in the report failed to reproduce where a decision rests on it.
- The C7 run is not one that would pass without the change: on the base file the same program prints no nested rule.

## Standards

- **The strip's gap is written twice, and only one side names the other** (`GroupHead.svelte:200`, `--group-indent: calc(var(--group-inset) + var(--bare-box, var(--tab-action)) + 6px);`, and `:212`, `gap: 6px;`). This is against spec.md:89 (DRY: a rule exists once).
  - Failure scenario: a later edit changes the strip's `gap` at `:212` to 4px. Nothing at that line points to `:200`, so every nested fold control then stands 2 px per level right of its parent's label, with no check to catch it.
  - Either one value both lines read, such as a property on `.group`, or a comment at `:212` naming `:200`, removes it.
- **The report's list of doc paragraphs omits one that describes the behaviour** (spec.md:72). `docs/HELP.md:295`, the Groups bullet, says "or a group that folds, such as a kind of the Audit section or a section of the Gallery, whose strip stands under the outer one", and "heads each group with one strip: the fold control, the group's glyph, its label in its colour and its count".
  - The bullet is still true, but the report's still-true/rewritten list does not name it.
  - Failure scenario: the orchestrator reads the list as complete and does not judge whether this bullet should say that a nested strip stands one level in at the small size.
- No other Standards finding:
  - No comment carries history (the grep above).
  - No non-ASCII.
  - Every edited paragraph is filled at 100 columns.
  - No sentence in `docs`, `src` or `README.md` is made false. `tokens.css:233-235` and `docs/HELP.md:573` stay true because the indent is padding and the background covers the padding box. `Table.svelte:105`, `List.svelte:208`, `Gallery.svelte:28-30` and `AuditSection.svelte:23-26` also stay true.

## Behaviour

- **Unstated: the nested label's room shrinks.** The ellipsis room of a nested strip's label shrinks by one level, 22s + 6 px (28 px at s = 1), at each level. This comes from `GroupHead.svelte:215` (the padding) and `:243` (`text-overflow: ellipsis`).
  - The report's before and after (`O142-report.md:354-355`) gives sizes and the fold-control position, but not this.
  - Failure scenario: in a narrow pane, a long kind label such as "Manifest guardrails", or a Gallery section label, is cut about 28 px sooner than before. The smaller font partly offsets this. The look at landing in a narrow pane shows it.
- No other unstated host- or user-visible change found.

## Declined to judge

- **The look on a page** is left to the look at landing, which this review did not run: computed font sizes, the drawn alignment of the nested fold control under the parent's label, the painted band while rows scroll, the sticky Table header under both strips, and the themes the report names.
- **The fold control's width with icons off** (`rice.icons: false`, the report's first limitation) is not measured. By reading it stays under the 22s box, but that is not verified.
- **The report's statement "Light (the default, the first theme)"** is not checked against `appearance.yml`.
- **Whether `docs/HELP.md:295` should gain a clause on the nested look** is the orchestrator's call: the brief's write list excludes HELP.md, and the change is a look only.
- **The builder's tool-call log** (whether every edit was made with the edit tools) cannot be seen from the tree. `git status` and `diff -rq` show only the brief's two paths.

Reviewer usage: a987dd72ad0cf6880, claude-opus-5-5, 182086 tokens, 40 tool uses, 9 min 35 s

## Repair round 1, refuted

### Verification lines, verbatim

All runs were made from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O142` with `PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH`, in the foreground.

1. `npm run diagrams` printed its file list, ending `docs/diagrams/writes.dot` and `docs/diagrams/writes.svg`. After it, `git status --short` printed only ` M docs/HELP.md`, ` M src/lib/ui/controls/heads/GroupHead.svelte` and the three `??` ledger files (`briefs/O142-round-1.md`, `reviews/O142-refuter.md`, `reviews/O142-report.md`), so no diagram changed.
   `npm run test:quick` (run once, exit 0):
   ```
   test:quick: 5 changed file(s), from git since HEAD
   test:quick: 9 test file(s)
   ok      prettier (0.7 s): All matched files use Prettier code style!
   ok      ASCII gate (0.8 s)
   ok      svelte-kit sync (2.2 s)
   ok      eslint (1.8 s)
   ok      svelte-check (7.4 s): 1793756176209 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
   ok      vitest checks (39.3 s): Duration  29.85s (transform 12.50s, setup 0ms, import 26.08s, tests 36.79s, environment 2ms)
   test:quick: 41.7 s; every command passed
   test:quick: not covered: tests that reach no changed file within the import depth,
   ```
   `uptime`: `load averages: 5.24 5.32 5.04`.
2. Case-run program. I wrote it from the report's quoted source to `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o142-review-r1/compile-grouphead.mjs`. `diff -q` against the builder's `o142-builder/compile-grouphead.mjs` printed `SAME-SOURCE`. Run over the worktree's file, then `grep -n 'group-gap\|group-inset\|group-indent\|group-label\|svelte-yopwl3 {\|^---\|(unused)'` over the output:
   ```
   2:--- css
   4:    .group.svelte-yopwl3 {
   6:        --group-inset: var(--group-indent, 0px);
   7:        --group-gap: 6px;
   12:       level deeper than this group's, one fold control's box and the strip's gap (`--group-gap`,
   14:    .body.svelte-yopwl3 {
   15:        --group-label: var(--fs-sm);
   16:        --group-indent: calc(
   17:            var(--group-inset) + var(--bare-box, var(--tab-action)) + var(--group-gap)
   24:       parts is the section's `--group-gap`, which the body adds to the indent at each level. */
   25:    .strip.svelte-yopwl3 {
   31:        gap: var(--group-gap);
   34:        padding: 2px 8px 2px calc(8px + var(--group-inset));
   47:    .words.svelte-yopwl3 {
   57:    .name.svelte-yopwl3 {
   59:        font-size: var(--group-label, var(--fs-md));
   65:    .count.svelte-yopwl3 {
   70:    .actions.svelte-yopwl3 {
   79:--- warnings: 0
   80:--- unused comments: 0
   81:--- css_unused_selector warnings: 0
   ```
   First line: `svelte 5.57.1, file /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O142/src/lib/ui/controls/heads/GroupHead.svelte`. The output is byte-equal to the builder's `run3-round1.txt` (`SAME-RUN3`). Over the base copy's file: `grep -c 'group-gap\|group-inset\|group-indent\|group-label'` prints `0`, and the tail is `--- warnings: 0`, `--- unused comments: 0`, `--- css_unused_selector warnings: 0`.
3. `LC_ALL=C perl -ne 'print "$ARGV:$.: $_" if /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/ui/controls/heads/GroupHead.svelte docs/HELP.md` printed nothing (exit 0).
4. `awk 'length($0)>100{print FILENAME": "FNR}' src/lib/ui/controls/heads/GroupHead.svelte` printed nothing (exit 0).
5. Unused exports: `sh utils/unused-exports.sh` to my scratch folder (exit 0, 335 lines), then `diff ../O142-base/unused-exports.txt <scratch>/unused.txt`: no output, exit 0.

The round's other evidence, rerun in the same form:
- `grep -rn -- '--group-gap' src tests docs README.md` hits only `GroupHead.svelte:193,198,203,210,217`; over `config --exclude=local.yml` exit 1; over the base copy's `src tests` exit 1.
- `grep -rn -e '--group-label' -e '--group-indent' -e '--group-inset' src tests docs README.md` hits only `GroupHead.svelte:36,37,192,201,202,203,220,245`; over `config --exclude=local.yml` exit 1.
- `grep -rn 'class="body"' src --include='*.svelte'` in the base copy: 16 lines, and the report's quoted block (`O142-report.md:438-453`) is equal to them under `diff` (`SAME-GREP`). `grep -c '<GroupHead'` over `EntryLink.svelte`, `EntryFields.svelte`, `present/parts/Plain.svelte`, `present/parts/Project.svelte`, `editors/Fold.svelte` and `TurnList.svelte` prints `0` for each.
- `npx prettier --check src/lib/ui/controls/heads/GroupHead.svelte docs/HELP.md`: "All matched files use Prettier code style!"
- `diff -rq -x local.yml -x node_modules ../O142-base/<d> <d>` for `src tests utils config`: the one line `Files ../O142-base/src/lib/ui/controls/heads/GroupHead.svelte and src/lib/ui/controls/heads/GroupHead.svelte differ`.
- `git diff 261dc20b2 --stat`: `docs/HELP.md | 2 +-`, `src/lib/ui/controls/heads/GroupHead.svelte | 41 +++...---`, `2 files changed, 34 insertions(+), 9 deletions(-)`.
- `wc -l`: `GroupHead.svelte` 264, `docs/HELP.md` 621. `diff -u` against the base copy: `grep -c '^+[^+]'` 32, `grep -c '^-[^-]'` 8, which matches the report's "+32 -8".
- History words over the added lines (`grep '^+' | grep -inE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-"`): one hit outside the `+++` header, `+       before the fold control, so the strip paints its whole band. The gap between the strip's`. "Before" names a place in the strip, so it is not history. The `docs/HELP.md` added line has no hit.
- Fill of the comment paragraphs the round edited (line lengths by `awk`): `.body` comment `:197-199` 97 97 49; `.strip` comment `:207-210` 99 98 95 96. In each case the next line's first word does not fit on the line above ("level" on 197, "which" on 198, "before" on 208, "parts" on 209).
- `docs/adr`: `ls` prints "No such file or directory".

### Closure of each round item

- **Item 1, the gap written twice: closed.**
  - `.group` declares `--group-gap: 6px;` (`GroupHead.svelte:193`). `.strip` reads it as `gap: var(--group-gap);` (`:217`). The body's indent is `calc(var(--group-inset) + var(--bare-box, var(--tab-action)) + var(--group-gap))` (`:202-204`), with no literal `6px` in it.
  - The grep shows one declaration in the source. The compiled CSS keeps the rule live, with 0 warnings and 0 `css_unused_selector` (verification line 2).
  - The finding's scenario was a change of the strip's `gap` leaving the indent behind. That cannot happen now, because both read one value. The finding was closed by changing what it guarded; no check was removed.
  - The change does not reach beyond the finding: the round's delta on the file is the `--group-gap` line, the two reads of it, and one clause in each of the two comments.
  - The `.words` gap (`:237`, `gap: 6px`) sits between the glyph, the label and the count. It is not the strip's gap and is rightly left alone.
  - The head comment's "one fold control's box and the strip's 6 px gap more at each level" (`:38`) stays true, since the value is 6 px.
- **Item 2, judgment call 4: closed.** `O142-report.md:348` says `--group-gap: 6px` is declared once on `.group` (`:193`), read by the strip's `gap` (`:217`) and added by the body's `--group-indent` (`:202-204`), and named in the comments over `.body` (`:197-199`) and `.strip` (`:207-210`). It also says the `.words` gap (`:237`) is separate. Each position and statement matches my `awk` listing of `:186-264`. Nothing in it goes beyond what the file shows.
- **Item 3, `docs/HELP.md:295`: closed.** `git diff 261dc20b2 -- docs/HELP.md` changes one line, adding only "and reads one level under it: its label and its count at the small size, and the words of its strip indented by one fold control". The rest of the bullet is byte-identical. The clause is ASCII, one line and in the bullet's own form (a colon list after a clause, as in "heads each group with one strip: the fold control, ..."). See Standards for a note on its precision.
- **Item 4, the list of `.body` elements: closed.** `O142-report.md:362` names the premise as not reproduced and lists the ten. The round section quotes the grep, and the quote equals my fresh run (`SAME-GREP`, 16 lines). The six files hold no `GroupHead` (0 each).
- **Item 5, the label's room: closed.** `O142-report.md:357` gives the before and after: one fold control and one gap less at each level, `22px * scale + 6px`, 28 px at text scale 1, with "Manifest guardrails" in a narrow pane as the example. Its positions `:220` (padding) and `:248` (`text-overflow`) are current.
- **Item 6, the doc paragraph list: closed.** `O142-report.md:338` lists `docs/HELP.md:295`, marked 'rewritten'.

#### The cascade of `--group-gap`, by reading

s is the text scale and B is the fold-control box, `var(--bare-box, var(--tab-action))`. No ancestor of a group body sets `--bare-box`: it is set only on `Pane.svelte:152` `header`, `Toolbar.svelte:313` `.clipped` and `PageLeaf.svelte:142` `.head`, so B = `--tab-action` = `calc(22px * var(--text-scale, 1))` (`tokens.css:193`).

| Strip | Declared `gap` | `--group-inset` it reads | `padding-left` | At s = 1 |
| --- | --- | --- | --- | --- |
| Top-level (Audit, Gallery, Venues) | `var(--group-gap)` = 6px, from its own section (`:193`) | `var(--group-indent, 0px)`, nothing above sets it = 0px | `calc(8px + 0px)` | 8px |
| One deep (Audit kinds, Muted, the eight Gallery sections) | 6px, from its own section | the parent body's `--group-indent` = 0px + B + 6px | 8px + B + 6px | 36px |
| Two deep (none in the tree) | 6px, from its own section | the one-deep body's `--group-indent` = (B + 6px) + B + 6px | 8px + 2(B + 6px) | 64px |

A nested section's own `--group-gap` declaration does not change the value its parent body's `--group-indent` reads.
- A custom property's `var()` references are substituted where it is declared, at computed-value time. The parent `.body` (`:200-205`) declares `--group-indent`, so its `var(--group-gap)` and `var(--group-inset)` resolve against what that body inherits from its own section: the parent's `--group-gap: 6px`.
- The nested section is a descendant, so its declaration cannot reach the ancestor's computed value. It inherits the already-substituted `--group-indent`, which it copies into `--group-inset` (`:192`).
- The nested section's own `--group-gap` feeds only its own strip's `gap` and its own body's `--group-indent` for the level below.
- Every section declares 6px, so the values agree at every level. If a section ever declared a different gap, the level below it would take that section's gap, and the section's own indent would still use its parent's gap.
- The parent's glyph and label sit inside `.words`, after the strip gap (markup `:157-177`), so they start at 8px + inset + B + gap. That is the nested fold control's start, so the alignment holds at every scale.

### Item verdicts, whole diff since the base

- **Item 1: holds.**
  - The body passes `--group-label: var(--fs-sm)` and `--group-indent` (`:200-205`) down, and the section copies the indent into `--group-inset` (`:192`).
  - The strip pads its left side by `calc(8px + var(--group-inset))` (`:220`), and `.name` reads `var(--group-label, var(--fs-md))` (`:245`). `.count` stays at `--fs-sm` (`:253`).
  - The selector is GroupHead's own scoped `.body.svelte-yopwl3`, and no prop was added. Two deep adds a level.
  - `top`, margin, `--panel` paint, colour and actions are unchanged, and the gap is one value.
- **Item 2: holds.** `diff -rq` shows only `GroupHead.svelte` changed under `src tests utils config`. The nested places agree with my grep of the open and close lines:
  - `AuditSection.svelte:199` (closes at `:212`) and `:216` (`:229`), inside `:189` (`:232`).
  - `Gallery.svelte:235`, `:277`, `:299`, `:317`, `:336`, `:344`, `:364`, `:382`, each closing before the next opens, inside `Status.svelte:131-141`, with `<Gallery>` at `:139`.
  - `<AuditSection>` sits at `Findings.svelte:200`.
- **Item 3: holds.** The head comment `:28-42` gives the label and count sizes of a top-level strip and of a nested one, how the indent is formed and why it is padding. The round did not change it. All 15 lines are at most 100 columns, and the earlier fill check stands. The old `:48`, `:55-56` and `:61-62` are unchanged.

### Case verdicts, whole diff since the base

- **C1: met.** Audit stands under no GroupHead body, so `--group-inset` is 0px, the padding is `2px 8px`, the label is at `--fs-md` and the gap is 6px.
- **C2: met, by reading and the compiled CSS.** Label and count are at `--fs-sm`, and the left padding is 8px + B + 6px. The drawn look is checked at landing.
- **C3: met.** The Gallery strip is as C1. The eight sections are as C2.
- **C4: met.** `Pane.svelte:89`'s `.body` carries Pane's scoped class, and nothing sets the two properties above these groups.
- **C5: met.** `Card.svelte:126` and `Settings.svelte:446` are other components' scoped bodies, and neither declares `--group-indent` or `--group-label`.
- **C6: met by reading.** `top: var(--group-above)` (`:213`), `--group-above` (`:191`) and the body's `style:--group-strip` (`:180`) are unchanged. `Table.svelte:110` reads `top: var(--group-strip, 0)`. The scrolled look is checked at landing.
- **C7: met.** The live `.body.svelte-yopwl3` rule is printed with 0 warnings, 0 `(unused)` comments and 0 `css_unused_selector` warnings. The base output has no nested rule.
- **C8: met by reading.** The indent per level is B + `--group-gap`, the same B the bare fold control draws (`ToolButton.svelte` `.tool.bare, :global(body.rice) .tool.bare`, `min-width: var(--bare-box, var(--tab-action))`), and the same gap the strip uses. The drawn alignment is checked at landing.
- **C9: met by reading.** The two-deep row of the cascade table pads 8px + 2(B + 6px). No two-deep place exists in the tree.

### Spec

none. The round wrote the brief's paths plus `docs/HELP.md:295` only (`git diff 261dc20b2 --stat`, `diff -rq`). Each of the six items made the change its ruling names. The only program is the approved case-run program in scratch.

### Proof

- **The report's positions, counts and diff above the round section are from before the round, against spec.md:14** ("Every count, line count, timing and `file:line` in the report is taken after your last change; a figure from before it is taken again or removed").
  - Places:
    - `O142-report.md:376`: "The `file:line` positions of `GroupHead.svelte` in the sections above the judgment calls ... are of the file before this round".
    - `:70`: "the worktree's `GroupHead.svelte` (259 lines)". `wc -l` prints 264.
    - `:79` (C8): "(the strip's gap is `6px`, `:212`)". The strip's gap is now `gap: var(--group-gap);` at `:217`, and `:212` is `position: sticky;`.
    - `:247`: "239 lines to 259 (`wc -l`), 26 lines added and 7 removed". Now 264 and +32 -8, as the report's own Files table at `:497` says.
    - `:249-318`: the quoted diff still shows `+        --group-indent: calc(var(--group-inset) + var(--bare-box, var(--tab-action)) + 6px);` and `gap: 6px;`, which the tree no longer holds.
    - `:324`: the grep hits `:192, :199, :200, :215, :240`. A fresh run gives `:192,201,202,203,220,245`.
    - `:345` (judgment call 1): "`.body`, `:198-201`". The rule is now at `:200-205`. This one is not even covered by the `:376` carve-out, which names only the sections above the judgment calls.
  - What is wrong: the round section states the staleness instead of retaking the figures. That is a sentence excusing an absence, and C8's case row now states a fact about the code (the gap as a `6px` literal at `:212`) that is false.
  - Failure scenario: at landing the orchestrator reads C8's row to check the alignment's reasoning, opens `:212` and finds `position: sticky`. The quoted diff shows a `+ 6px)` indent the tree does not hold, so a reader who takes "The diff of `GroupHead.svelte`" as the step's diff (the brief's report part) reads a version that was never landed. No verdict of this review rests on these lines, because every value above was retaken from the tree. The fix at landing is to retake the positions and replace the diff block with `git diff 261dc20b2 -- src/lib/ui/controls/heads/GroupHead.svelte`.
- Every command the round section quotes reproduced in the same form. The test:quick counts (5 files, 9 test files), the case-run output (`SAME-RUN3`), the body grep (`SAME-GREP`), the unused-exports diff (empty), prettier, the ASCII and width checks, the +32 -8 count and the history-word hit all match.

### Standards

- **`docs/HELP.md:295`, the clause "and the words of its strip indented by one fold control" leaves out the gap.**
  - Hunk: `+... whose strip stands under the outer one and reads one level under it: its label and its count at the small size, and the words of its strip indented by one fold control.`
  - What is wrong: the indent per level is one fold control's box plus the strip's gap (`GroupHead.svelte:202-204`), 28 px at text scale 1, and the head comment (`:38`) says so. "By one fold control" reads as 22 px.
  - The wording follows the round's ruling ("its strip's words indented by one fold control"), so the builder did as ruled. The visible result, the nested fold control standing under the parent's label, is a one-level step that the clause describes fairly to a user.
  - Failure scenario: a reader who measures the strip expects 22 px and sees 28. This is small. Whether HELP names the gap is the orchestrator's call (see Declined).
- **`docs/HELP.md:295`, "and its count at the small size"** is true, but a top-level strip's count is already at the small size (`:253`), so a reader may infer the count shrinks when only the label does. The ruling's text asks for these words, so this is not raised as a defect.
- **The comments over `.body` and `.strip`.** No sentence is made false by the code.
  - `.body` (`:197-199`): "an indent one level deeper than this group's, one fold control's box and the strip's gap (`--group-gap`, which the strip's `gap` reads as well)". True: `:203` adds `var(--group-gap)` and `:217` reads it.
  - `.strip` (`:207-210`): "A nested group's indent is padding before the fold control, so the strip paints its whole band. The gap between the strip's parts is the section's `--group-gap`, which the body adds to the indent at each level." True: `:220` pads, `:222` paints `--panel`, `:217` reads the section's `--group-gap`, and each level's body adds it once.
  - "Section" names the `<section class="group">` element and is used in the same sense in the head comment (`:37`), so it is no synonym drift.
  - Both paragraphs are filled at 100 columns, ASCII, with no history word.
- The head comment's "the strip's 6 px gap" (`:38`) now repeats the value `--group-gap` holds, with no pointer to the property. This is not a finding: the round asked that the sentence stay true and it is true. A later change of `:193` would make `:38` false.
- Prose rules of spec.md:21 over the delta: no em dash, no quip, no "not X but Y" construction, ASCII (verification line 3).

### Behaviour

none. The round changes no computed value: `--group-gap` is 6px on every section, so `gap` and the indent resolve as before the round (cascade table above). No unstated host- or user-visible change was found.

### Declined to judge

- **The look on a page**: computed sizes, the drawn alignment of the nested fold control under the parent's label, the painted band while rows scroll, the sticky Table header under both strips, and the themes. This is done at landing, and this review ran no page.
- **The fold control's width with icons off** (`rice.icons: false`, the report's first limitation). By reading it is held at the B minimum. Not measured.
- **Whether `docs/HELP.md:295` should say "one fold control and its gap"**, and whether the head comment should name `--group-gap` in place of "6 px". Both wordings follow the round's rulings, so each is the orchestrator's call.
- **The builder's tool-call log** (whether every edit was made with the edit tools) cannot be seen from the tree. `git status --short` and `diff -rq` show only the round's paths.
- **The report's statement "Light (the default, the first theme)"** was not checked against `appearance.yml`, as in the first review.

Reviewer usage: aa17a11de3b868799, claude-opus-5-5, 153451 tokens, 26 tool uses, 5 min 16 s
