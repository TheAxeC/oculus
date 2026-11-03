# Brief check of O125 (a group's heading strip is solid over a wallpaper)

Everything below was read or run in `/Users/axelfaes/workspace/oculus` on main at 5a761e08d (`git log --oneline -3`). The only uncommitted changes there are to the ledger files (`git status --short`: plan.md, orchestrator-state.md and queue.md modified, briefs/O125.md untracked).

There are three findings for the session to act on before dispatch:
1. `src/lib/shell/rail/UpdateTray.svelte:261-266` is outside the write list. Its comment becomes false when the step lands, and the `--panel-on-wall` override it describes loses its only nested reader.
2. Item 2 asks for a head-comment sentence that is false for the case open item 637 was raised for.
3. The step widens ruling 637. That widening is a premise found wrong, and it is not booked as an open item.

## Names

Commands:
- `git grep -n -F '.strip' -- src tests config docs README.md ':!config/local.yml'`
- `git grep -n -E '\.strip\b' -- src | grep -v heads/GroupHead.svelte`
- `git grep -n -i -E 'strip' -- src tests config docs README.md ':!config/local.yml' | grep -i -E 'wall|translucent|panel-on-wall|show(s)? through|reads? through'`
- `git grep -n -i -E 'heading' ... | grep -i -E 'wallpaper|translucent|panel-on-wall|layer'`
- `git grep -n -E -e '--panel-on-wall\s*:' -e 'style:--panel-on-wall' -- src`
- `git grep -l -e 'var(--panel-on-wall)' -- src`

What they show about the `.strip` rules:
- No selector outside `GroupHead.svelte` reaches its `.strip`. The other `.strip` hits are scoped to their own components: `SplitView.svelte:195,202`, `Tabs.svelte:401`, `FoldedPane.svelte:97`, and `Workbench.svelte:430` (`.stripless`).
- No global rule targets `h3`, `section`, `.group` or tree rows with a background. These printed nothing: `git grep -n -E ':global\([^)]*h3...'`, a grep for `role='treeitem']` and `data-part=` selectors, and `git grep -n -A4 -E ':global\(\*\)\s*[,{]' -- src | grep background`.
- `--panel` is never set translucent:
  - Every `--panel:` in `src` is a 3- or 6-digit hex in a theme file (`git grep -n -E -e '--panel\s*:' -- src`).
  - Nothing sets it at runtime or through `style:` (`git grep -n -E 'style:--panel|setProperty\(.--panel'` hits only `Pane.svelte:71`, which sets `--panel-on-wall`).
  - App colour themes are settled to alpha 1 by `settle()` (`src/lib/themes/vscode-map.ts:302-314`, called at :405 for `--panel`).

Hits outside the write list:
- **`src/lib/shell/rail/UpdateTray.svelte:261-263`: made false by the change.** The comment reads: "A group's sticky strip inside it paints the panel share of a wallpaper layer, which here is the tray's own fill, so what scrolls under the strip stays hidden."
  - Line 265 redefines `--panel-on-wall` on `.tray` to the popover share.
  - After the change the tray's GroupHead strips (`UpdateTray.svelte:170`, `ScheduleList.svelte:70`) paint `--panel` and read nothing of it.
  - The only other reader left is the tray's own `background` at :266. The tray's other imports (Confirm, Modal, ToolButton, ScheduleList) do not read `--panel-on-wall`; the `git grep -l` above lists no such file.
  - The file must join the write list. The comment needs rewriting, and the redefinition at :265, whose stated reason is gone, should either be written as the tray's own colour or keep its own true reason.
- `src/lib/ui/display/table/Table.svelte:127-128` and `src/lib/views/system/machine/processes/ProcessTable.svelte:204-205` point at "the strip of `tokens.css` that keeps a mix of its own". These stay true only if item 3's rewrite of `tokens.css` keeps that sentence for the table and the Calendar. The brief says those keep their mixes; the builder should be told these two files point at that sentence.
- `src/lib/themes/tokens.css:293-297` lists the readers of `--panel-on-wall` and does not name GroupHead, so it stays true.
- `src/lib/shell/panes/floats/FloatLayer.svelte:207-213` says a free float's view "its tinted box, its cards and its surfaces paint nothing". Group headings are not named there, so it stays true.
- `src/lib/ui/frame/Pane.svelte:39-43` and :71 (the `share` doc) stay true.
- `src/lib/views/system/workbench/Settings.svelte:500-501` cites GroupHead's `z-index: 2`, which the step keeps, so it stays true.
- `config/options/appearance.yml:149` ("How solid the panels stay over the image") says nothing of headings and is not made false.
- `docs/palette.md`, `docs/apps.md` and `README.md` hold no text on the strip.
- HELP.md: `grep -n -o -i '.\{0,120\}wallpaper.\{0,160\}' docs/HELP.md` hits only lines 347, 553 and 571, and none of them is about headings.
- `src/lib/ui/controls/heads/FoldHead.svelte`, `SubHead.svelte` and `FoldControl.svelte` hold no wallpaper text.

## The step line

Line 1629: `grep -n -A1 '^- O125 ' .scratch/migration/plan.md`. Each part, mapped to the brief:
- "a `GroupHead` strip paints solid `--panel` wherever it stands over a wallpaper": the opening paragraph of "What to build" and item 1.
- "(an untinted pane": C1. "a tinted pane": C2 and C3. "a card", "a `Surface`": C5. "a free float)": C4.
- "a lane": named in the "What to build" opening paragraph. No case names a lane; it is covered only by C5's "any `data-surface` element". The look list (C1, C2, C4, C6, C7) includes no card or lane.
- "in every view": item 1, a single component. No case or check names it beyond C1 and C2.
- "so no text scrolls visibly behind a heading": C1's "no chip text shows through".
- "without a wallpaper nothing changes": C6 and the Behaviour line.
- "(ruling 637)": the ruling line at plan.md:3452 reads "(a), a group's sticky heading strip paints solid `--panel` inside a `Surface` or a tinted pane, in every view".
  - The step line and the brief go further than that: wherever the strip stands, including an untinted pane outside any surface.
  - The Step 0 at plan.md:1630 records the reason. Its quoted phrases match the original text of item 637 (`git show 1880ed8eb -- .scratch/migration/orchestrator-state.md | grep 637`).
  - It is not booked for Axel. The state file's "## Open items" holds only item 638, the Rulings line is unchanged, and `orchestrator-state.md:171` still records the narrow wording.
  - The hub rules make "a premise found wrong" a stop that goes to Axel, and spec.md:18 calls a departure from a ruling a decision.
  - My judgment: the wider reading is the one the item's own named case requires. The session still has to either book it as an open item or record why it is not a stop.
- Items 2, 3 and 4 (comments, tokens.css, HELP.md) have no part in the step line. They come from spec.md:72, which is correct.

## Premises

| Brief claim | Command | Result |
|---|---|---|
| GroupHead 253 lines | `wc -l` | 253; holds |
| `.strip` sticky with `background: var(--panel)` at 189-203 | `cat -n` | holds |
| `body.wall` rule at 211-216, free-float rule at 218-222 | `cat -n` | holds |
| Head comment at 15-20 | `cat -n` | Holds |
| `--panel-on-wall` at tokens.css:298 | `sed -n 215,310p` | Holds |
| `--wall-panel` at theme.ts:106 | `sed -n 100,112p` | holds |
| Status pane untinted at Status.svelte:108 | `sed -n 100,160p` | holds |
| Gallery's nested strips after the toolbar's Surface | `sed -n 205,250p` | holds |
| The `data-surface` carriers | `git grep -n 'data-surface' -- src` | The list is incomplete (below) |
| Pane.svelte:71 share | `sed -n 60,75p` | Holds |
| tokens.css:223-244 and the quoted text | read | Holds; line 234 ends short, so the spec.md:45 rewrap applies to the whole comment |
| HELP.md:571 | `sed -n 565,575p` | Holds |
| No GroupHead test | `git grep -n -i 'GroupHead' -- tests` | holds |
| No guarded.md entry | `grep -n -i 'GroupHead\|heads/' guarded.md` | holds |
| `docs` listing and no `docs/adr` | `ls docs; ls docs/adr` | holds |
| Table.svelte:136-139, Calendar.svelte:376-380 | read | Holds |
| AccountSetup tinted pane | `grep -n 'GroupHead\|<Pane\|tinted'` | holds |
| Verify list | state file block | holds |
| `CLAUDE_CODE_EFFORT_LEVEL` unset | `printenv` | exit 1 |

On the `data-surface` carriers: the real attributes of Lanes and Band are at `Lanes.svelte:212` and `Band.svelte:142`. The grep also prints carriers the brief does not name: `views/boards/focus/Tasks.svelte:141`, `views/shared/graph/Graph.svelte:289`, `views/sources/repositories/diff/DiffSection.svelte:405`, `views/sources/venues/Ribbon.svelte:109`, `views/apps/frame/ApprovalPanel.svelte:60`, `views/academic/present/screen/Stage.svelte:42`. This changes nothing in the build.

Missing from the brief, though spec.md:32-33 and :89 say the brief names them: the worktree path, the base copy and the base's `unused-exports` output.

## Cases and checks

- No case breaks the rules file.
- C3 (a strip in a tinted pane with `share`) describes no instance in the tree (`share=` panes are `Merge.svelte:175` and `Terminal.svelte:367`, neither draws a GroupHead), so C3 is checkable only by reading.
- Verify item 5 asks for a reading "against the standards page's rules on sentence length"; spec.md has no sentence-length rule. It should cite spec.md:21 (plain prose) and :45 (rewrap at 100 columns).
- **Item 2 asks for a sentence that is false.** "over a wallpaper it is therefore a solid band inside the translucent surface around it" is false for C1, where the strip stands in an untinted pane that paints `transparent` over a wallpaper (`Pane.svelte:112-114`); there it is a solid band over the picture itself.

## The question

- Step line and item 1: reach the goal for every container, since `--panel` is opaque in every shipped and app theme; a new rule elsewhere could repaint the strip, caught only by the look.
- Item 2 could pass verify item 3 while carrying the false sentence; only a reader catches it.
- Items 3 and 4: text only.
- Verify 1 proves only the gates; verify 2 and 3 pass if the `body.wall` rules are gone, a translucent rule under another selector would pass both.
- C1, C2, C4, C6, C7 at the look cannot pass without the goal in those views.
- C5, C8, C9, C10 by reading hold after the change; C3 has no instance.
- The strip's 4 px corner radius leaves its corners unpainted with and without a wallpaper; my judgment is that no text can be read there.

## Implied inputs

- **The Update tray**, missing: strips in `UpdateTray.svelte:170` and `ScheduleList.svelte:70`, the tray redefines `--panel-on-wall` at :265. Expected: solid `--panel`, no blur, inside the tray's popover-share fill.
- **A docked float**, missing: `data-float-place` set to an edge and no `data-surface` (`FloatLayer.svelte:138`), painting `transparent` (:215-217). Expected: solid `--panel`, no blur.
- Other `data-surface` carriers, implied by C5: expected solid `--panel`.
- A `share` pane (C3), nested strips (C7), tree rows (C8), rice themes over a wallpaper, a theme whose `--panel` has alpha (none exists), content painting over the strip: no further case needed.

## ADRs

`ls docs/adr` prints "No such file or directory". No ADR touches the step.

## Dictated text

None. Item 2's required content contains the false clause reported under "Cases and checks".

## Declined to judge

- Whether `npm run test:quick` passes after the change.
- The rendered result of any case in a browser.
- `CLAUDE_CODE_EFFORT_LEVEL` in the builder's environment.
- The report path under `.scratch/` set against spec.md:36: the plan-wide convention.
- Whether the widening of ruling 637 needs Axel's word or can stand as the session's premise correction.

Usage: a65323d96f2f0ed22, claude-opus-5-5, 169675 tokens, 65 tool uses, 7 min 59 s.

## Closed

1. UpdateTray finding: `src/lib/shell/rail/UpdateTray.svelte` joins "Paths this step writes" as a new item 5 of "What to build": the comment at :261-263 rewritten, and the `--panel-on-wall` redefinition at :265 replaced by the tray's own fill written directly on its `background`, since no reader inside the tray is left; case C11 added for the tray's strips.
2. Item 2's false clause: the item now asks for words true in both places: a solid band over the picture in an untinted pane, and inside the surface around it elsewhere.
3. The widening of ruling 637: the session judges it no stop. The correction makes the ruling reach the case it was raised for and follows the reason the ruling states ("so a heading never has text behind it", "for every view"); the narrow reading would leave that case unchanged, which is the lazy option. The correction was reported to Axel in plain words in the turn it was made, and the brief and plan.md's Step 0 record it. Recorded in the brief's Decision 1.
4. Table and ProcessTable point at the tokens.css sentence: item 3 now tells the builder to keep that sentence true for the table and the Calendar, naming both files.
5. The `data-surface` list: the brief's premise now gives the full grep output.
6. Worktree path, base copy and unused-exports output: named in "What is on the tree".
7. Verify item 5: cites spec.md:21 and :45.
8. Docked float: case C12 added. Lane and card in the look: C5 is added to the look's list.
9. C3: marked as checked by reading only, no instance in the tree.
