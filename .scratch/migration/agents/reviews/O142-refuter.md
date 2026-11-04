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
