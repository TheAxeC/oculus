# Brief check of O194

Brief check of O194 (`.scratch/migration/agents/briefs/O194.md`), read-only, oculus main at a4a4acbfe. `plan.md` has no section headed Goal (`grep -n -i "^#.*goal\|^goal\|\*\*goal" .scratch/migration/plan.md` prints nothing), so the head paragraph (lines 1-3), the O194 line (1764) and Rulings 3806-3813 were read.

## Names

- `project.card.open_in`: `config/text/views/boards/project.yml:108`, `CardDetails.svelte:135`, `CardLinks.svelte:229`, `:245`, `ProjectCard.svelte:370`; all in the write list.
- `.tool.plain`: ToolButton.svelte:340, 341, 459, 492, 498, and `src/lib/ui/forms/choice/QuickPick.svelte:180-181` (`.row :global(.tool.plain)` sets the gap to 6px), outside the write list; not made false unless the class is renamed.
- `.tool.cut`: only ToolButton.svelte:411 and :417.
- ToolButton's `.label` outside the write list: `views/shared/links/CrossLinks.svelte:186-200` (a `small` button, stays true); `ui/menu/trigger/MenuOpener.svelte:277` (its own label); `tests/checks/tree/allow-styling.ts:24` and `:28`, HELD lines whose owner list `tests/checks/tree/boundaries.test.ts:281-292` (`primitiveClasses`) builds from every class a `ui/` component names outside `:global(...)`: a new rule naming `.label` (or a scoped `.tip`/`.tool` in Tag) outside `:global` turns `boundaries.test.ts` red. The brief should say the new selectors stay inside `:global(...)`.
- `src/lib/ui/controls/tool-button.ts` is outside the write list: its doc comments for `plain` (96-102) and `cut` (119-124) and line 3 become false or incomplete. Add it.
- "the caller's tooltip carries the whole value": Tag.svelte:109 and `src/lib/ui/controls/Chip.svelte:188`; false today for a cut Chip on a record card.
- PressBox importers outside the list: `NamedBy.svelte:73-77` (no `title`), `EntryFields.svelte:197-206`, `LaneCard.svelte:233-237`; PressBox.svelte:4-8 lists its users without NamedBy and EntryFields, false today.
- `git grep -n "ToolButton\|PressBox\|plain press\|caller's tooltip\|Tag\.svelte" -- docs README.md config` prints nothing.
- Reach: `git grep -l "controls/ToolButton.svelte\|controls/tool-button" -- src tests | wc -l` prints 230; `git grep -ln "<Tag\b" -- src | wc -l` prints 51.
- LaneCard.svelte:304 and Band.svelte:280-281 stay true.

## The step line

- The overflow: premise 1, item 1, case 1. "every row of a project card and of the record cards": item 1, item 2. "wrapped or cut with an ellipsis": item 1, Decision 2. "in every theme": item 1 and the terminal case. "at every card width": item 1 (`CardGrid.svelte:35` confirmed) and the narrow case.
- "its full text on hover as the card's other long rows do": item 3 and Decision 1. The card's other long rows use the browser's native `title` (`LiteratureCard.svelte:206`, `RadarCard.svelte:289`, `RecordCard.svelte:319`, `ProjectCard.svelte:382`, `LaneCard.svelte:211`), so item 3's "as every tip in oculus is drawn" is false as stated, and the departure is not among the Decisions.
- "it lands before O193 ... (ruling 788)": no item serves it; it is the orchestrator's landing order.

## Premises

1. The split route is blocked: ToolButton.svelte 519 lines, and `src/lib/ui/controls` already holds ten tracked items (Chip.svelte, confirm, editor, heads, RowButton.svelte, segment, Tag.svelte, text, tool-button.ts, ToolButton.svelte), so a new file there breaks the folder rule; moving ToolButton into a subfolder changes 230 import sites. The brief must name where a split goes.
2. The 20 files are wrong both ways: `Clamp.svelte` is a false hit (its `plain$` is the comment at line 170); missed are `NamedBy.svelte:74`, `views/system/machine/processes/ProcessTable.svelte:77`, `views/system/machine/debug/LaunchEdit.svelte:109-110`, `views/boards/focus/Band.svelte:114` (plain cut), `views/boards/focus/lanes/LaneCard.svelte:218`, `:235` (plain cut). The real set is 24 files.
3. The measurement table is supported by the CSS (Tag.svelte:88, 91, 110-114; ToolButton's label has `min-width` only under `.cut` :417 or `.status` :276; button and tip `min-width: 0` at ToolButton.svelte:343, Tooltip.svelte:353, 363-366; PressBox `max-width: 100%`; 340 = 338 + two 1 px borders; 468 = 448 + 16 px glyph + 4 px gap). Also: `.taglist` wraps (CardLinks.svelte:281-287), so a cut tag sits on its own line under its label; Decision 2's reason ("one line per kind") does not hold there.
4. Line numbers: the label span is ToolButton.svelte:119; `:335-339` is 336-339; `:405-416` spans the joined comment at 403-407 (cut comments 409-410 and 415-416); Tag.svelte:108-109 is a CSS comment, not the head comment.
5. The Literature card: the record's `projects: [tensor-sketch]`, drawn by EntryFields.svelte:191-206 (PressBox, plain ToolButton with `title={t('collection.open_record')}`, Tag). The measured words already end in an ellipsis, so the 4 px may have another cause; one candidate, PressBox.svelte:33-41, a content box with a 1 px border each side and no `box-sizing`. Only the look settles it.
6. `ls docs/adr` prints "No such file or directory"; guarded.md has no entry; `sh utils/unused-exports.sh` gives 336 lines, identical to the base list; no glossary; contrast.test.ts measures `-txt` token pairs.

## Cases and checks

- No case contradicts the rules file.
- The palette case is redundant: PaletteRow.svelte:58 and :74 are already `plain` with `cut`.
- No case for the unpressed half of item 3, nor for a pressed tag whose tip is not `open in` (EntryFields "Open this record as its own tab", collection.yml:30; NamedBy with no title).
- QuickPick and AppQuickBox rows inherit `white-space: normal` (ToolButton.svelte:355), so a long row wraps today; item 1's "cut, rather than overflow" would turn wrapping rows into cut rows.
- Origins.svelte:31-36 and Focus.svelte:360-366 draw a plain ToolButton in running text; no case checks the baseline if the plain label gains `overflow: hidden`.

## The question

- The step line's check (the look on the demo hub): yes, it could pass while EntryFields and NamedBy tags are cut with no words on hover, and a cut Chip, a long unpressed tag or a long `.unknown` key (EntryFields.svelte:194) are unreached.
- Item 1: yes for record-card rows that are not a Tag.
- Item 2: yes, the builder may attribute the 4 px to the shared cause by reading.
- Item 3: yes, CardLinks alone satisfies the cases, leaving CardDetails, ProjectCard's domain, EntryFields, NamedBy and cut Chips (`personChip`, EntryFields.svelte:182-188) without their full text on hover. The tab stop of an unpressed tag is a user-visible shape the brief should decide.
- Items 4 and 5: not about the goal; they miss `tool-button.ts` and `allow-styling.ts`.

## Implied inputs

- A Tag with no words (CardLinks.svelte:219-224): no tip of its words, no extra tab stop.
- An unpressed Tag inside a caller's Tooltip (CardFacts.svelte:106-157, LaneCard.svelte:239-249): one tip, not nested.
- A Tag inside a pressed ToolButton: only the press's tip; Tag has no prop telling it it is pressed.
- A Tag with a glyph tip (venue): unchanged, no second stop.
- Present slide tags (`present/parts/project/Project.svelte`, `parts/Legend.svelte`, `arrange/Group.svelte`): no tooltip or stop added unless decided.
- `wrap` tags (CardLinks venue, `LeadCard.svelte:347`, `DatasetCard.svelte:161-173`): keep wrapping; say whether a tip is given.
- A Focus lane card tag (LaneCard.svelte:235, `title={one.tip}`): drawn as today; a tip change inside ToolButton would change it.
- RecordCard rows that are not a Tag: a cut Chip (whole name on hover), the `.unknown` key span (stays inside, native title kept).
- NamedBy tags: today they overflow; after the change they cut with no tip; need the whole words on hover, so NamedBy.svelte in the write list.
- A plain press in running text: stays on the baseline.
- An RTL name: none in the demo hub; not required.

## ADRs

None exist.

## Dictated text

None: the quoted lines (22, 24, 37, 42, 44, 76, 121) quote the tree, the measurement, demo data or section names; `LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing.

## Declined to judge

- Whether the Literature card's 4 px shares the CardLinks cause (needs a page).
- Whether `overflow: hidden` on an inline-flex button's label moves its baseline in Chrome (needs a page).
- Whether a cut tag on its own line under its label is the look Axel wants (a look question).

Usage: accc28dffde18681b, claude-opus-5-5, 206106 tokens, 62 tool uses, 604 s

## Closed

Every finding is closed by a change to the brief, listed by finding:

- Premise 1, the split route: Decision 4, ToolButton.svelte and tool-button.ts move into `src/lib/ui/controls/tool-button/` with the part split out, every importer's path changed; the write list names the folder and the importers.
- `tool-button.ts` comments: in the write list and item 4.
- `:global` and `allow-styling.ts`: item 1 constrains every new selector to `:global(...)`; `tests/checks/tree/allow-styling.ts` is in the write list only for a path change the move makes, with no line added to an allow list.
- Chip's sentence and cut Chips: item 3 covers Chip; Chip.svelte in the write list.
- PressBox's user list: item 4 rewrites PressBox.svelte:4-12.
- The 24 files: premise bullet corrected to the 24, Clamp removed, the five added.
- Native `title` against Tooltip: Decision 1 rewritten, a pressed tag's tip through its button's Tooltip (the `title` every press already gives), an unpressed tag's whole words as the native `title` of the tag, as the cards' other long rows do, with no tab stop added; named as a decision.
- The landing order: stated under "What is on the tree" as the orchestrator's, no item.
- Decision 2's reason: rewritten to the flex-wrap behaviour.
- Line numbers: corrected.
- The Literature card's possible second cause: item 2 names the PressBox border candidate.
- The palette case: replaced by the QuickPick wrap case.
- Unpressed and other-hint cases: added.
- QuickPick wrapping: item 1 rewritten, rows that wrap today keep wrapping; no `overflow: hidden`, `nowrap` or ellipsis is added to the plain label.
- Running text baseline: a case added; item 1 adds no overflow rule to the plain label.
- Implied inputs: each added to Cases with its expected result; the tip text is assembled in the callers, never in ToolButton, so LaneCard and Band keep theirs; Present slides get no tip, since the tag's title is opt-in by the caller.
