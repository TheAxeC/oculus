# Step O194 refuter report (worktree `.agents/worktrees/migration-O194`, base 55fa909a3)

## Verification (rerun by the reviewer)

From the worktree root, over the 238 changed files (`git diff 55fa909a3 --name-only --diff-filter=AM` and the three files under `src/lib/ui/controls/tool-button/`):

```
npx prettier --check <238 files>                 All matched files use Prettier code style!
npx eslint <the .svelte/.ts/.js of the 238>       (printed nothing)
ASCII gate of spec.md over the 238 files         (printed nothing)
npm run check                                    COMPLETED 4690 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npx vitest run tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts --testTimeout 0 --maxWorkers 2
                                                 Test Files  4 passed (4)  Tests  29 passed (29)
sh utils/folder-check.sh                         exit 0
npx vitest run tests/checks/look/contrast.test.ts --maxWorkers 2   Tests  56 passed (56)
grep -rn "controls/ToolButton.svelte\|controls/tool-button'" src tests config docs README.md --exclude=local.yml   exit 1 (no hit)
sh utils/unused-exports.sh, diff against the base list   336 lines, diff exit 0
the report's extra run (keys, catalog-file-keys, config-folder and six render tests)   Tests  67 passed | 2 skipped (69)
git diff 55fa909a3 --numstat | awk '$1==1 && $2==1' | wc -l   222; each one import line, Segment.svelte '../ToolButton.svelte' -> '../tool-button/ToolButton.svelte' among them
History-word grep over every added line, ToolFace.svelte and the moved pair   (no hit)
```

Sample of the import sweep read line by line: PaletteRow.svelte, LaneCard.svelte, Origins.svelte, CardDocs.svelte, QuickPick.svelte, Segment.svelte. The moved files read whole against the base: the face block moved into ToolFace.svelte, `.picture` with it, one new rule, comments.

## Verdicts

- Item 1: holds. `tool-button/ToolButton.svelte:344-346` `.tool.plain > :global(.label) { min-width: 0; }`, no overflow, white-space or text-overflow rule; read against the measured chain it alone holds the Tag (label 468 to 338, the Tag's words 318).
- Item 2: holds for what the diff does; the cause named is not shown, Proof 1.
- Item 3: violated, Spec 1. Within the write list it holds (CardLinks, CardDetails, ProjectCard's domain, CardFacts, EntryFields's record key, NamedBy, the person and venue Chips, `titled` off by default, wrap and empty tags excluded, tips put together by callers).
- Item 4: holds. ToolButton.svelte 511, ToolFace.svelte 57, tool-button.ts 159 in `controls/tool-button/`; `controls/` holds 9; three allow-styling.ts and three boundaries.test.ts lines the same at the new path.
- Item 5: holds for every comment listed; the new sentences in Tag and Chip state a rule callers outside the write list do not follow, Standards 1.
- Item 6: holds.
- Cases: the PILLAR tag, the narrow column, the Literature card and the terminal brackets not verifiable (the look); the venue, short tags, the unpressed WAITING ON tag, NamedBy's tip, the person chip, the `.unknown` key, QuickPick, Origins, the lane card venue and the Present slides met by reading.

## 1. Spec

- Spec 1: unpressed tags on other record cards, and two project-card rows, still give no whole words on hover: `views/shared/card/feed/RadarCard.svelte:280, :295`; `feed/LeadCard.svelte:323, :325, :344`; `record/registry/VenueCard.svelte:265, :273, :276, :322`; `feed/PostCard.svelte:93`; `views/feeds/literature/LiteratureCard.svelte:171`; `record/registry/DatasetCard.svelte:146, :181`; `views/feeds/inbox/InboxCard.svelte:218`; `project/CardSessions.svelte:67` (a Tag inside `<RowButton title={t('sessions.select_tip')}>`); `card/CardDocs.svelte:113`. Each is cut by its own ellipsis and has no title, tooltip or `titled`. The step line and item 3's first sentence cover them; the report lists part of them as outside the write list, leaving out LiteratureCard:171, DatasetCard:146 and :181, VenueCard:265, :273, :276 and InboxCard:218. Failure: a source name, a country or a theme word longer than the card shows "Journal of Neural Eng..." with no way to read it. Fix: add these callers, give each such Tag `titled`; CardSessions's tool name goes on the first line of the RowButton's title. Booking it for later is the lazy option.
- Spec 2: CardFacts's compute tip names the resource twice (`CardFacts.svelte:163-167`, `tag_tip` of the name and `compute_tip` "Compute: {0}"); the folder tip is the name, then a path ending in it. The tips of the base already held the whole words. No verdict.
- Spec 3: `src/lib/ui/controls/segment/Segment.svelte:10` is an importer the brief's grep missed; the change is required by item 4 and is one line. No verdict.

## 2. Proof

- Proof 1: the builder's read of the Literature card's 4 px does not explain the measurement: on the Literature card the words were already cut and the Tag has no glyph (EntryFields.svelte:209), so the label's `min-width: auto` did not set its width there. A second cause stays open (PressBox's `max-width` on a content box with a 1 px border each side, PressBox.svelte:37-41, or the `.row` gap). Settled by the look walking that tag's box chain.

## 3. Standards

- Standards 1: `src/lib/ui/controls/Tag.svelte:13-22`, `:130-131` and `Chip.svelte:188-189` state that callers give the whole words on hover, false for every caller of Spec 1 (spec.md, "What every package obeys"). Closed by Spec 1's fix.

## 4. Behaviour

None. The move into ToolFace.svelte changes no variant's look: ToolFace renders no wrapper, every rule reaching into the button uses `> :global(.label)` or `> :global(.glyph)`, `.picture` moved with its element, Tooltip's `.tip > :global(*:first-child)` still matches the button. No element gets two tips from the diff.

## Declined to judge

- Every on-screen result (containment at each width, the terminal brackets, the Literature card's 4 px, the look of a cut tag on its own line): the look.
- A double tip the diff leaves as it was: ProjectCard passes `tip=` drawn as `<div class="slot" title={tip}>` (RecordCard.svelte:319), and LaneCard's card has `title={project.title}` (LaneCard.svelte:212), so a pressed tag's Tooltip and the card's native title can show together.
- Whether a cut tag on its own line under its kind's label is the look Axel wants.
- The brief's check 7 as `git grep` (outside the reviewer's three git commands; run as plain grep).

Usage: a40f5b361cc792a2f, claude-opus-5-5, 215535 tokens, 67 tool uses, 1294 s

## Repair round 1, refuted

Reviewer over round 1, read-only, worktree `.agents/worktrees/migration-O194`, base 55fa909a3, snapshot `migration-O194-round-1/`. The delta: 11 files of `files.txt` changed (Chip, Tag, LaneCard, InboxCard, LiteratureCard, CardDocs, CardFacts, ProjectCard, Followups, Subtasks, CrossLinks), and 17 paths not listed there read as their change since the base (the four diagram files, CareerCard, LeadCard, PostCard, RadarCard, CardSessions, DatasetCard, DomainCard, LineCard, VenueCard, ArchivalCard, NoFundingCard, OrphansCard, EntryCard).

Verification lines, over the 255 files the step changes (251 outside docs/): prettier "All matched files use Prettier code style!"; eslint printed nothing, exit 0; ASCII gate printed nothing; `npm run check` COMPLETED 4690 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS; size, boundaries, comment-width, history Tests 29 passed (29); folder-check exit 0; contrast Tests 56 passed (56); old-path grep exit 1; unused-exports 336 lines, diff exit 0; history-word grep exit 1; the round's extra run Tests 137 passed | 2 skipped (139); `git diff 55fa909a3 --stat -- docs` 4 files, "views to ui" 1110 -> 1112, "folder views/shared to layer ui" 263 -> 265; the report's line counts as given.

The reviewer's own `grep -rn "<Tag" src/lib/views` lists 52 files; every Tag in every card file read against the builder's table matches row by row. No `titled` Tag sits inside a press or a caller's Tooltip.

### Verdicts

- Brief items 1 to 6: hold (2 by reading; the Literature card's second cause is for the look).
- Round items 1 and 2: hold.
- Cases: PILLAR containment, the narrow column and the terminal brackets not verifiable (the look); the Literature card partial (tip met, containment for the look); every other case met by reading.

### Findings

- Spec 1, `src/lib/views/shared/card/project/CardSessions.svelte:64-71`: the RowButton's tip has the tool ("claude") on its first line, while the cut text of the row is the session's title (`.nm`, CardSessions.svelte:116-120); a long session title cannot be read on hover. Fix: the first line is the session's title. No verdict.
- Standards 1, `src/lib/ui/controls/Tag.svelte:13-19`: the third sentence reads as a rule for every caller, false for the Present slides, `system/machine/usage/Usage.svelte:196-208`, `sources/venues/Ribbon.svelte` and `boards/focus/Band.svelte`. Fix: open it with the card scope. No verdict.
- Standards 2, the round's report: the builder ran `git ls-files`, which spec.md's "Where you work" forbids; the reviewer rebuilt the list from `git diff` and `find` and got the same 251 files, so no result is wrong. No verdict.
- Behaviour 1, `src/lib/views/shared/card/project/ProjectCard.svelte:358-366` with `:440`: the new Tooltip around the stage chip sits inside RecordCard's `<div class="slot" title={tip}>` (RecordCard.svelte:319), so on a card whose label is the short title the chip shows two tips at once, the bubble and the native full title; new in the diff, and not stated in the report's visible changes. EntryCard's status chip has no double tip. No verdict.
- The other additions (EntryCard's status chip tip, LineCard's counts tip and `tierWords`, VenueCard's "concentrated" tip, Followups, Subtasks, CrossLinks, the four diagram files, LaneCard's deadline) hold by reading.

### Declined to judge

- Every on-screen result (containment, the brackets, the Literature card's 4 px, the stage chip's two tips, the cut tag on its own line).
- Whether the Usage view's account cards count as record cards.
- Other non-Tag cut rows on the record cards beyond CardSessions's `.nm`.
- Check 7 as `git grep` and the builder's `git ls-files` list (outside the reviewer's git commands).

Usage: a10e599f9abb66762, claude-opus-5-5, 221987 tokens, 77 tool uses, 1386 s

### Closed, over round 1

- R1 Spec 1 (CardSessions's tip names the tool, the row cuts the title): fixed at landing, the tip is the tool, the session's title, then the hint (`CardSessions.svelte`), seen on the look with a made-up session.
- R1 Standards 1 (Tag's third head-comment sentence reads as a rule for every caller): fixed at landing, the sentence opens with "On those cards" (`Tag.svelte`).
- R1 Standards 2 (the builder's `git ls-files`): recorded in the booking; the reviewer's own list gave the same 251 files, so no result rests on it.
- R1 Behaviour 1 (the stage chip's Tooltip under the card's native title): fixed at landing at its cause, together with the same double tip under the pressed tags the first run left open: the card's hover words for a cut title moved from the whole card to its title (`Card.svelte` `tip`, `RecordCard.svelte`), and LaneCard's full title from the card to its name; the look saw one tip on the stage chip and the title's words on the heading.
- Declined points: the Usage view's account cards are no project or record card of the step; the non-Tag rows were swept on the look by a walk of every element of every card against its box, none past the card.
