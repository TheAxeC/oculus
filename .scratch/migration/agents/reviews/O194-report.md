# O194 report: a card's long text stays inside its card

Everything in the brief is done.

## Open items of the state file

The state file's "Open items" section (`.scratch/migration/orchestrator-state.md:189`) holds no entry: `awk 'NR>=189 && NR<=230' .scratch/migration/orchestrator-state.md` prints the heading, blank lines and the closing note only.

## The cases' first run, on the unchanged tree, by reading

No case is one the brief's rules get wrong. One case (the `.unknown` key) is not reached by item 1 and needed a rule of its own in EntryFields.svelte, which is on the write list.

- Projects board, Graph-Bandits, Graph-Transfer, Online-Clustering, PILLAR tag. Today: the ToolButton label (`ToolButton.svelte:119`) is a flex item with `min-width: auto`, so it is as wide as the Tag's min-content (468 px) inside a 338 px button; the Tag's `max-width: 100%` (`Tag.svelte:91`) is 100% of that label, so its ellipsis never cuts and the words run past the card. Its tip is `open in Pillar` alone (`CardLinks.svelte:229/245`). After: `.tool.plain > :global(.label) { min-width: 0 }` holds the label to the button, the button is held by `.tip > :first-child` (`Tooltip.svelte:363-366`) and the PressBox, which `.taglist` (flex-wrap) puts on its own line and shrinks to the line (the measurement's PressBox w=340 = taglist w=340); the Tag cuts with its own ellipsis. Tip: the whole line, then `open in Pillar`.
- The same cards narrower than 320 px (`CardGrid.svelte:35` gives one column of the pane's width). Today the same overflow, wider. After: every plain press of the card is bounded by its line as above; the facts row's unpressed Tags and Chips sit in Tooltip spans with `min-width: 0` and their own `max-width: 100%`, so they already cut inside the row. Proof of "every row": the look on landing.
- Robust-Emb's VENUE. A `wrap` Tag (`CardLinks.svelte:155`, `Tag.svelte` `.tag.wrap` and `overflow-wrap: anywhere`): its min-content is one character, so it wraps today and after; the tier glyph is the empty-label Tag with `glyphTip` in its own Tooltip with `tabindex="0"`, untouched. Its press tip stays `open in Venue` alone (CardLinks `tipOf` gives no words line to a `wrap` kind).
- Short tags (DATASETS toy-embed, TEAM Dr. Dana Example). They fit, so nothing is cut today or after. Tip today `open in Datasets` / `open in Team`; after `toy-embed` then `open in Datasets`, `Dr. Dana Example` then `open in Team`.
- A WAITING ON value naming neither a person nor a project (`CardLinks.svelte:209`, no press). Today a Tag flex item of `.taglist`, cut by its own ellipsis, with no title. After: `titled` gives the span its whole words as the native `title`; no tabindex is added.
- Literature card `demo:coauthor2021sketching`. Today 4 px over, tip `Open this record as its own tab`. The read: the chain is PressBox (flex item of EntryFields `.row`, `min-width: 0`, shrunk to the line like CardLinks's) then `.tip` then the button, each with `min-width: 0`, then the ToolButton label with `min-width: auto`, the only box whose width is not bounded; the 4 px are at that label. After item 1 the label is bounded by the button, so the Tag is inside the card. Tip after: its whole words, then `Open this record as its own tab`.
- NamedBy tag with a long name (`NamedBy.svelte:73-77`). Today the same overflow as case 1 and no tip at all (no `title`, not icon-only, so `tip` is `''`, `ToolButton.svelte:53`). After: cut inside the column; tip of its words and a hint naming what it opens.
- Person chip with a long name (`EntryFields.svelte:182-188`). Today a pressable Chip in a Tooltip span inside `.row`; the Chip has `max-width: 100%`, `min-width: 0` and an ellipsis label, so it cuts inside the card; its tip is `Open this person as their own tab` without the name. After: the name, then that hint.
- Long `.unknown` key (`EntryFields.svelte:194`). Today a span flex item of `.row` with `min-width: auto` and no break rule: a key with no break opportunity longer than the row overflows the card. Item 1 does not reach it. After: `min-width: 0` and `overflow-wrap: anywhere` on `.unknown`; it breaks inside the card and keeps its native title `No record has the id {0}`.
- Terminal theme with `rice.brackets` on. The Tag's `[` and `]` are `::before` and `::after` of the inline-flex Tag, so they are its flex items; with the Tag held to its button the brackets sit at its edges and the label cuts between them. A plain ToolButton draws no brackets (`:not(.plain)`, `ToolButton.svelte:491-501` at base). Today the closing bracket is past the card; after, inside.
- A QuickPick row longer than its list. `.tool.plain` has `white-space: inherit` (`ToolButton.svelte:355` at base), so the row's words wrap today. The new rule adds no `white-space`, `overflow` or `text-overflow`; `min-width: 0` does not change the label's min-content contribution, so the row's width and wrapping are as today.
- Origins.svelte's plain press in its sentence. The inline-flex `.tip` in the `<p>` is sized to its content; `min-width: 0` lowers no intrinsic size and adds no overflow rule, so the baseline (taken from the first flex item) is as today.
- Focus lane card venue (`LaneCard.svelte:235`, plain cut, `title={one.tip}`). `cut` already gives the label `min-width: 0` (`ToolButton.svelte:417-418` at base), and its tip `Venue: <whole name>` already holds the whole words, so the venue is drawn and tipped as today; LaneCard's one edit is the deadline tag's `titled` (Repair round 1).
- A Present slide's tags. `titled` is off by default and no Present file passes it, so no title is added.

## DONE / NOT DONE

| Item | State | Proof (last round, output as printed) |
|---|---|---|
| 1. `min-width: 0` on a plain ToolButton's label, no overflow, white-space or ellipsis rule, every new selector naming another component's class inside `:global(...)` | DONE | `src/lib/ui/controls/tool-button/ToolButton.svelte`: `.tool.plain > :global(.label) { min-width: 0; }`; boundaries test passes (row 5) |
| 2. The Literature card's 4 px ended | DONE by item 1 (read; the look on landing proves it) | see the cause below |
| 3. Whole words on hover: pressed tags of CardLinks, CardDetails, ProjectCard's domain, EntryFields's record key, NamedBy, CardSessions; CardFacts's presses keep their base tips, which hold the whole words; unpressed tags through Tag's off-by-default `titled` on every project card and record card (the list in "Repair round 1"); cut Chips of EntryFields, ProjectCard's stage and EntryCard's status; none for a wrap tag or a Tag with no words; tip assembled by the callers | DONE | the Verify lines of "Repair round 1"; behaviour is the look on landing |
| 4. ToolButton.svelte and tool-button.ts moved into `src/lib/ui/controls/tool-button/`, split by concern, every importer's path changed, no allow-list line added, removed or widened | DONE | `wc -l`: ToolButton.svelte 511, ToolFace.svelte 57, tool-button.ts 159; `controls/` holds 9 items; row 5 and row 7 |
| 5. Every comment the change makes false rewritten | DONE | list under "Comments read" |
| 6. Grep of changed names and paths, change carried to every hit | DONE | `grep -rn "controls/ToolButton\.svelte\|controls/tool-button\.ts\|controls/tool-button'" src tests config docs README.md --exclude=local.yml` prints nothing; `grep -rn "caller's tooltip carries" ...` prints nothing |
| Verify 1, prettier | DONE | `npx prettier --check <238 changed files>`: `All matched files use Prettier code style!` |
| Verify 2, eslint | DONE | `npx eslint <the .ts and .svelte changed files>` printed nothing |
| Verify 3, ASCII gate | DONE | the spec.md perl gate over the 238 changed files printed nothing |
| Verify 4, `npm run check` | DONE | `COMPLETED 4690 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| Verify 5, tree checks | DONE | `npx vitest run tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts --testTimeout 0 --maxWorkers 2`: `Tests  29 passed (29)`; `sh utils/folder-check.sh`: `folder-check exit 0` |
| Verify 6, contrast | DONE | `npx vitest run tests/checks/look/contrast.test.ts`: `Tests  56 passed (56)` |
| Verify 7, no import at the old path | DONE | `git grep -n "controls/ToolButton.svelte\|controls/tool-button'" -- src tests config docs README.md` printed nothing, `grep exit 1` |
| Verify 8, unused exports | DONE | `sh utils/unused-exports.sh`: 336 lines; `diff <base list> <after>`: `diff exit 0`, no line added |
| Verify 9, plan's verify list | not the builder's | runs at landing |
| Verify 10, comment lines read against spec.md | DONE | history-word grep below; width is the comment-width test |
| Tests that exercise the changed files (added to the last round) | DONE | `npx vitest run tests/checks/source/keys.test.ts tests/checks/source/catalog-file-keys.test.ts tests/checks/config/config-folder.test.ts tests/ui/tabs/tab-actions.client.test.ts tests/shell/rail/schedule-dialog.test.ts tests/shell/commands/debug/debug-toolbar.test.ts tests/shell/commands/clone-ask.test.ts tests/views/sources/bar-actions.test.ts tests/views/system/workbench/app-badges.test.ts --testTimeout 0 --maxWorkers 2`: `Tests  67 passed | 2 skipped (69)` |

`npm run diagrams` ran right before the last round of the first build and printed no change; for Repair round 1 see that section.

The step adds no test and changes no assertion; the six changed test lines are paths (below). `agents/guarded.md` has no entry for these files.

## Files with line counts

From `git diff --numstat` and `wc -l`, after the last change:

| Path | Change | Lines now |
|---|---|---|
| `src/lib/ui/controls/ToolButton.svelte` | moved to `tool-button/ToolButton.svelte` | |
| `src/lib/ui/controls/tool-button.ts` | moved to `tool-button/tool-button.ts` | |
| `src/lib/ui/controls/tool-button/ToolButton.svelte` | face moved out, plain label rule, comments | 511 |
| `src/lib/ui/controls/tool-button/ToolFace.svelte` | new: the glyph or picture and the label box | 57 |
| `src/lib/ui/controls/tool-button/tool-button.ts` | head comment, `plain` and `cut` docs | 159 |
| `src/lib/ui/controls/Tag.svelte` | +31 -9: `titled` prop, comments | 160 |
| `src/lib/ui/controls/Chip.svelte` | +4 -3: comment | 321 |
| `src/lib/views/shared/card/project/CardLinks.svelte` | +19 -4 | 321 |
| `src/lib/views/shared/card/project/CardDetails.svelte` | +9 -3 | 177 |
| `src/lib/views/shared/card/project/CardFacts.svelte` | +3 -2: one comment sentence, the import path | 177 |
| `src/lib/views/shared/card/project/ProjectCard.svelte` | see "Repair round 1" | 469 |
| `src/lib/views/shared/card/project/PressBox.svelte` | +14 -9: head comment | 55 |
| `src/lib/views/shared/forms/entry/card/EntryFields.svelte` | +26 -10 | 486 |
| `src/lib/views/shared/forms/entry/card/NamedBy.svelte` | +25 -4 | 113 |
| `config/text/views/boards/project.yml` | +1: `project.card.tag_tip` | |
| `config/text/views/shared/entry-form.yml` | +1: `entry_form.open_setting` | |
| `tests/checks/tree/allow-styling.ts` | 3 path lines | |
| `tests/checks/tree/boundaries.test.ts` | 3 path lines | |
| `src/lib/ui/controls/segment/Segment.svelte` | 1 import line | |
| the importers under `src` | 1 import line each: `git diff --numstat` with `awk '$1==1 && $2==1'` counts 222 files of one changed line, Segment.svelte and EntryLink.svelte among them | |

Outside the write list's letter: `src/lib/ui/controls/segment/Segment.svelte` imports ToolButton as `'../ToolButton.svelte'`, which the brief's grep of `controls/ToolButton.svelte` does not list; it is an importer and had to change. `config/text/views/shared/entry-form.yml` holds the new tip key NamedBy needs, which the write list allows by naming "the text file that holds a tip key the step adds".

The import paths were changed by hand with sed over the files the grep lists: `grep -rl "controls/ToolButton\.svelte" src tests | xargs sed -i '' 's#controls/ToolButton\.svelte#controls/tool-button/ToolButton.svelte#g'` (230 files, `tool-button.ts`'s head comment among them, rewritten afterwards with Edit) and `sed -i '' "s#import ToolButton from '../ToolButton.svelte';#import ToolButton from '../tool-button/ToolButton.svelte';#" src/lib/ui/controls/segment/Segment.svelte`. The files were moved with `mv`.

## The 24 plain-press files

The rule changes a label's used width only where its button is narrower than the label's content, which is where it overflowed; it changes no intrinsic size, no wrapping and no overflow painting. So a label of plain words looks the same (its words overflow the label box exactly where they overflowed the button), and a look changes only where the label holds a box that cuts itself (a Tag, a Chip).

- `views/shared/card/project/CardLinks.svelte`: changes. A tag longer than its line cuts with an ellipsis on its own line under its kind's label; tips gain the words line.
- `views/shared/card/project/CardDetails.svelte`: changes. A DISSEMINATED IN title longer than the column cuts; tip gains the title.
- `views/shared/card/project/CardFacts.svelte`: changes. A long compute name or folder name cuts inside its box; the tips are the base's (`Compute: <name>`, the whole path), which hold the whole words.
- `views/shared/card/project/ProjectCard.svelte`: changes. A long domain cuts; tip gains the words.
- `views/shared/forms/entry/card/EntryFields.svelte`: changes. A long record name cuts inside the card (the Literature card's 4 px); tip gains the words.
- `views/shared/forms/entry/card/NamedBy.svelte:74`: changes. A long name cuts; the press gains a tip.
- `views/boards/focus/Band.svelte:114`, `lanes/LaneCard.svelte:218`, `:235`, `shell/keys/PaletteRow.svelte` (both), `views/shared/links/FolderFiles.svelte`, `views/system/findings/Findings.svelte`: no change; each is `cut`, whose label already has `min-width: 0`.
- `views/boards/focus/CommandCenterView.svelte`, `Focus.svelte`, `views/system/machine/processes/ProcessTable.svelte:77`, `machine/debug/LaunchEdit.svelte:109-110`, `Debug.svelte`, `views/system/findings/AuditSection.svelte`, `views/system/workbench/editors/Origins.svelte`, `views/shared/latex/Main.svelte`, `views/academic/latex/Latex.svelte`, `views/sources/repositories/merge/MergeSide.svelte`, `views/sources/search/Problems.svelte`, `shell/commands/AppQuickBox.svelte`: no visible change; their labels are words, and words that overflow are painted where they were.
- `ui/forms/choice/QuickPick.svelte`: no change in the common case; a row whose button is narrower than its longest word now breaks its other words at the button's width rather than at that word's width, a case only a list narrower than one word reaches.

## Allow-list and test lines changed for the move

From `git diff -U0 tests/checks/tree/allow-styling.ts tests/checks/tree/boundaries.test.ts`; each is the same line with the moved path, none added, removed or widened:

- `allow-styling.ts:16` before `'shell/keys/PaletteRow.svelte styles .tool of ui/controls/ToolButton.svelte through .result :global(.tool)'`, after `'... of ui/controls/tool-button/ToolButton.svelte through .result :global(.tool)'`.
- `allow-styling.ts:20` before `'views/shared/card/CardDocs.svelte styles .tool of ui/controls/ToolButton.svelte through .doc.human :global(.tool)'`, after `'... of ui/controls/tool-button/ToolButton.svelte through .doc.human :global(.tool)'`.
- `allow-styling.ts:32` before `'views/shared/links/CrossLinks.svelte styles .tool of ui/controls/ToolButton.svelte through .member :global(.tip), .member :global(.tool)'`, after the same with `ui/controls/tool-button/ToolButton.svelte`.
- `boundaries.test.ts:491` before `'ui/controls/ToolButton.svelte',`, after `'ui/controls/tool-button/ToolButton.svelte',` (the fixture's own file name).
- `boundaries.test.ts:508` and `:510`: the expected strings, `ui/controls/ToolButton.svelte` to `ui/controls/tool-button/ToolButton.svelte`.

On the unchanged tree: the three `allow-styling.ts` lines must name the owner path `primitiveClasses` computes, so with the old paths after the move the boundaries test would report them; the three `boundaries.test.ts` lines are a self-contained fixture in a scratch folder and pass with either path. Judged by reading.

## Judgment calls the brief left open (each reversible)

1. The split (Decision 4's "part split out"): `ToolFace.svelte`, what the button shows (the glyph or picture and the `label` box, or a cell's content), with the `.picture` rule; ToolButton keeps the button, its tooltip and every variant rule. The variants reach the label through `:global(.label)` as before the move. ToolButton is at 511 lines, 9 under the limit; the variant rules all style the one button element and cannot leave its component, so no further cut by concern was found.
2. The two-line tip is the catalog line `project.card.tag_tip: "{0}\n{1}"`, used by every caller that adds a words line, so the line break lives in the catalog, the tooltip's `white-space: pre-line` draws it, and no helper module outside the write list was needed.
3. Tag's prop is `titled` (boolean, default false). Tag itself gives no title when `wrap` is set or the label is empty, so a caller cannot give a wrap tag or a glyph-only tag a title by mistake.
4. NamedBy's hints: a person `Open this person as their own tab` (`collection.open_person`), a funding scheme `Open this record as its own tab` (`collection.open_record`), a setting the new `entry_form.open_setting: Open this setting in Settings`. NamedBy's inert tags get `titled`.
5. CardFacts (ruled in Repair round 1): a press whose tip already holds the whole words keeps that tip, so the compute press keeps `Compute: <name>` and the folder press the whole path, as on the base.
6. EntryFields's venue Chip (card and page) is a cut Chip on a record card like `personChip`, so it got the same two-line tip (`collection.open_venue` on the second line).
7. Unpressed tags given `titled` in the first build: CardLinks's no-press tag (Tag drops it for the venue), ProjectCard's domain without a press and its deadline, EntryFields's pairs and chips tags and its deadline (card and page), NamedBy's inert tag. Tags inside a caller's Tooltip or titled span whose words hold the whole value (CardFacts's facts, ProjectCard's stale tag) are left without it. The other cards' tags are in "Repair round 1".
8. The `.unknown` key wraps (`overflow-wrap: anywhere`, `min-width: 0`) rather than being cut, as the same file's `.value` does, since its title already gives it whole.

## The Literature card's cause

The ToolButton label's `min-width: auto` (`ToolButton.svelte:119` at base), the box item 1 changes. The PressBox border is not it: PressBox's `max-width` is on the content box (no `box-sizing`), but every PressBox caller (CardLinks `.taglist`, CardDetails `.tags`, Card's `.meta`, ProjectCard `.row`, EntryFields `.row`, NamedBy `.tags`, LaneCard `.tags`) puts it in a flex line as an item with `min-width: 0`, and flex shrinking holds its border box to the line, as the measurement shows (PressBox w=340, taglist w=340). PressBox is left without `box-sizing: border-box`, since that would make the lane card's capped venue 2 px narrower, against the case "drawn and tipped as today". Settled at the look on landing.

## Host- or user-visible changes, before and after

- Projects board card (the demo hub, card view), PILLAR of Graph-Bandits, Graph-Transfer, Online-Clustering: before, the line runs 116 px past the card; after, on its own line under PILLAR, ending in an ellipsis inside the card; hover shows the whole line, then `open in Pillar`. Same in the terminal theme with both brackets inside.
- Every pressed tag on a project card (WAITING ON, FUNDING, PILLAR, DATASETS, TEAM, RELATED, the domain, DISSEMINATED IN on the project page): tip before one line (`open in X`); after two lines, the words then that line. The venue's, the compute press's and the folder press's tips are unchanged.
- An unpressed tag on a project card or record card (examples above): before no hover words; after the browser's native title with the whole words. No tab stop added.
- Literature collection card `demo:coauthor2021sketching`, PROJECTS record tag: before 4 px past the card; after inside; tip before `Open this record as its own tab`, after the words then that line.
- A record's page, NAMED BY: before a long name runs past the column and the press has no tip; after it cuts and its tip is the name then the hint.
- Person chip and venue chip on a record card or page: tip before the hint alone; after the name then the hint.
- A record key no record has, longer than the row: before it runs past the card; after it breaks onto further lines.

## Comments read

Rewritten: `ToolButton.svelte` head comment (names ToolFace), the cut comment (formerly 409-410) and its `:global` comment (formerly 415-416), new plain-label comment; `tool-button.ts` head comment (path, ToolFace, the variant list with `compact`, `small`, and `joined` and `cut` as modifiers) and the `plain` and `cut` docs; `Tag.svelte` head comment and the CSS comment formerly at 108-109; `Chip.svelte` CSS comment formerly at 187-190; `PressBox.svelte` head comment (users now include EntryFields and NamedBy; the width paragraph); `CardLinks.svelte`, `CardDetails.svelte`, `CardFacts.svelte`, `ProjectCard.svelte`, `EntryFields.svelte`, `NamedBy.svelte` head comments. Still true: the `plain` CSS comment (formerly 336-339), Tooltip.svelte's head comment, `LaneCard.svelte:304`, `Band.svelte:280-281`, `Chip.svelte:61` and the MenuOpener and Ticker comments naming `ToolButton.svelte` by its file name. `docs/HELP.md`, `docs/data-map.md` and `docs/decks.md`: `git grep -n "ToolButton\|tool-button" -- docs README.md config` printed nothing at the start of the work.

History words: the added lines of every hand-edited file, grepped for `before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]{2,}|20[0-9]{2}-`, gave only the three `diff` header lines of the new and moved files (their timestamps), no comment line.

Helper grep: before adding the tip line, `git grep -n "join('\\\\n')" -- src/lib/views src/lib/shell` and the tip functions of the tree were read; no shared two-line tip helper exists (`RepoItems.svelte:147` joins its own two lines inline).

## Limitations and sharp edges

- A Tag outside the project cards and record cards (Band, Ribbon, Present, the session rows, the HPC and Usage views, the forms of the Settings and Workbench views) gives no whole words on hover; Tag.svelte's comment states the rule for the cards only. Listed in "Repair round 1".
- Every case's on-screen result is unmeasured here: the builder runs no page, so each case's proof is the look on landing, in the states named above.
- 2 skipped tests in the extra run are the real-hub cases that skip where the hub holds no data (`tests/fixtures/real-hub.ts`).

## Anything in the brief that was wrong

- "every import of either (230 files ...)": the 230 of the brief's grep miss `src/lib/ui/controls/segment/Segment.svelte`, which imports `'../ToolButton.svelte'`; changed with the rest.
- The brief lists `DatasetCard.svelte:161-173` among wrap tags that never cut; there `wrap={page}`, so on a card those tags do cut, but each sits in a Tooltip whose words are the whole value, so they already have their words on hover.

## Runs of the last round of the first build

The last round of the first build ran once, after its last change: prettier, eslint and the ASCII gate in one command, `npm run check`, the four tree checks with `utils/folder-check.sh`, the contrast test, the catalog and render tests, the old-path `git grep` and `utils/unused-exports.sh`, each once. No whole-suite command was run (`npm run test:quick`, `npm test`, `npm run test:checks`, `npm run test:landing` and a bare `npx vitest run`: none).

## Repair round 1

Both findings sent back are done. Nothing in the round is left undone.

### Spec 1, the record cards' tags

Every `<Tag` under `src/lib/views` was listed with `grep -rn "<Tag\b" src/lib/views` (50 files) and each card's Tag read in its context. A card here is a component drawn as a project card or a record card (through `RecordCard.svelte`, the feed, registry, inbox, literature and project cards, the Focus lane card), with the parts `RecordCard.svelte` draws inside it (`Followups.svelte`, `Subtasks.svelte`, `CrossLinks.svelte`, imported at `RecordCard.svelte:57`, `:58`, `:61`). Line numbers are those after the round.

| File:line | Tag | What it got |
|---|---|---|
| `academic/career/CareerCard.svelte:46` | `career.hidden` | `titled` |
| `feeds/inbox/InboxCard.svelte:215` | the triaged kind | `titled` |
| `feeds/inbox/InboxCard.svelte:218` | the account | `titled` |
| `feeds/literature/LiteratureCard.svelte:171` | each source's name | `titled` |
| `feeds/literature/LiteratureCard.svelte:174` | `literature.open` | `titled` |
| `shared/card/CardDocs.svelte:113` | a document with no press | `titled` |
| `shared/card/feed/LeadCard.svelte:323` | the fit | `titled` |
| `shared/card/feed/LeadCard.svelte:325` | the expired status | `titled` |
| `shared/card/feed/LeadCard.svelte:344` | the country | `titled` |
| `shared/card/feed/LeadCard.svelte:347` | the type | none: `wrap` |
| `shared/card/feed/PostCard.svelte:91` | the number or `linkedin.idea_tag` | `titled` |
| `shared/card/feed/PostCard.svelte:93` | the category | `titled` |
| `shared/card/feed/RadarCard.svelte:277` | `radar.new` | `titled` |
| `shared/card/feed/RadarCard.svelte:280` | the relevance | `titled` |
| `shared/card/feed/RadarCard.svelte:295` | the motif | `titled` |
| `shared/card/feed/RadarCard.svelte:337` | `radar.new_idea_candidate` | `titled` |
| `shared/card/project/CardSessions.svelte:58` | the session count | `titled` |
| `shared/card/project/CardSessions.svelte:60` | the live count | `titled` |
| `shared/card/project/CardSessions.svelte:70` | the tool, inside a RowButton | the RowButton's title (`:65`) is `t('project.card.tag_tip', entry.tool, t('sessions.select_tip'))`: the tool, then the hint |
| `shared/card/project/CardFacts.svelte:109`, `:114`, `:134`, `:139`, `:144`, `:149`, `:156` | lead, lane, submitted, year, code, reproduced, compute without a press | none: each sits in a Tooltip whose words hold the whole value (`lead_tip`, `lane_tip`, `submittedWords().tip`, `year_tip`, `code_tip`, `repro_tip` `Reproduced` for the label `reproduced`, `compute_tip`) |
| `shared/card/project/CardFacts.svelte:166`, `:174` | compute press, folder press | none: base tips kept (Spec 2) |
| `shared/card/project/CardLinks.svelte:223`, `:234`, `:247`, `:263` | the link kinds' tags | first build: press tips through `tag_tip`, the no-press tag `titled`, the glyph-only tag none (no words), the wrap kind none |
| `shared/card/project/CardDetails.svelte:144` | DISSEMINATED IN press | first build: `tag_tip` |
| `shared/card/project/ProjectCard.svelte:371`, `:384`, `:390` | domain without press, domain press, deadline | first build: `titled`, `tag_tip`, `titled` |
| `shared/card/project/ProjectCard.svelte:394` | stale | none: inside `<span title={stale_tip}>`, whose words hold the count |
| `shared/card/record/registry/DatasetCard.svelte:146` | the access | `titled` |
| `shared/card/record/registry/DatasetCard.svelte:161`, `:167`, `:173` | size, path, fetch | none: each in a Tooltip whose text is the same words, `wrap={page}` |
| `shared/card/record/registry/DatasetCard.svelte:181` | the modality | `titled` |
| `shared/card/record/registry/DomainCard.svelte:71` | the project count | `titled` |
| `shared/card/record/registry/LineCard.svelte:110` | the project count | `titled` |
| `shared/card/record/registry/LineCard.svelte:120` | each venue tier's count, in the metrics Tooltip | the Tooltip's text (`:115`, `countsTip` at `:83`) is `pillars.counts_tip`, then each tier tag's words, one to a line, through the new `tierWords` (`:104`) that the tag's label also uses |
| `shared/card/record/registry/VenueCard.svelte:265` | the quartile | `titled` |
| `shared/card/record/registry/VenueCard.svelte:272` | `venues.conc`, in a Tooltip | the Tooltip's text (`:268-271`) is `t('project.card.tag_tip', t('venues.conc'), t('venues.conc_tip', concentrated))`: the tag's word, then the reason |
| `shared/card/record/registry/VenueCard.svelte:276` | the fee | `titled` |
| `shared/card/record/registry/VenueCard.svelte:279` | the deadline | `titled` |
| `shared/card/record/registry/VenueCard.svelte:325` | each theme word | `titled` |
| `shared/card/record/sets/ArchivalCard.svelte:51` | `pillars.not_active` | `titled` |
| `shared/card/record/sets/NoFundingCard.svelte:35` | the unfunded count | `titled` |
| `shared/card/record/sets/OrphansCard.svelte:41` | `pillars.on_no_line` | `titled` |
| `shared/forms/entry/card/EntryCard.svelte:293` | Lead | `titled` |
| `shared/forms/entry/card/EntryCard.svelte:301` | `settings.not_in_list` | `titled` |
| `shared/forms/entry/card/EntryFields.svelte`, `NamedBy.svelte` | every Tag | first build (`tag_tip` presses, `titled` tags) |
| `boards/focus/lanes/LaneCard.svelte:223` | the deadline | `titled` |
| `boards/focus/lanes/LaneCard.svelte:241`, `:250`, `:253` | marks and facts, in a press or a Tooltip | none: `one.tip` already holds the whole words (`stage_tip`, `chip_tip`, `form_tip`, `year_tip`, `lead_tip`, `tier_tip`, `venue_tip` with `fact.whole`, `submittedWords().tip`; `LaneCard.svelte:160-202`) |
| `shared/forms/dated/Followups.svelte:184` | `project.card.not_until` | `titled` |
| `shared/forms/dated/Subtasks.svelte:196` | the deadline | `titled` |
| `shared/links/CrossLinks.svelte:105` | the kind's stage | `titled` |

Not cards, so not edited (the Tag grep's other callers): `academic/present/**` (slides), `boards/editor/Editor.svelte`, `boards/focus/Band.svelte` (the Focus band), `boards/project/Project.svelte` (the project page's documents), `personal/account-setup/AccountSetup.svelte`, `sessions/terminal/transcript/TurnRun.svelte`, `shared/forms/accounts/AccountList.svelte`, `shared/sessions/CommandBar.svelte` (its tag sits in a span titled with the findings), `shared/sessions/sections/TimelineTurns.svelte`, `shared/sessions/SessionRow.svelte`, `sources/data/recover/*`, `sources/venues/Ribbon.svelte`, `sources/venues/Venues.svelte`, `system/**` (the HPC, Usage, Gallery, FieldControl and settings List views). Tag.svelte's head comment (`:13-14`) and its CSS comment (`:129-131`) now state the hover rule for project cards and record cards, so they are true of every caller. Chip.svelte's CSS comment (`:187-191`) now says a card gives the whole value.

Cut chips on the cards, for the Chip comment: ProjectCard's stage chip is now in a Tooltip `t('project.card.stage_tip', stage)` (`ProjectCard.svelte:356-364`, with the `Tooltip` import at `:46`), and EntryCard's status chip is in a Tooltip `t('project.card.chip_tip', status)` (`EntryCard.svelte:296-298`, with the import at `:50`). The tips are the strings LaneCard and CardFacts use for the same chips. CardFacts's chips, LaneCard's chips, RootChip and EntryFields's chips already had tooltips holding their words. Both head comments say so (`ProjectCard.svelte:11-14`, `EntryCard.svelte:11-13`).

### Spec 2, the compute and folder tips

`CardFacts.svelte:161` is `title={t('project.card.compute_tip', resource.label)}` and `:173` is `<ToolButton plain label={folder.name} title={folder.path} onclick={onfolder}>`, as on the base. The head comment is back to the base wording, with one sentence added (`:24-25`): a press's words are cut inside its box, and its tip already holds them whole, so no line of words is added. `git diff 55fa909a3 -- src/lib/views/shared/card/project/CardFacts.svelte` shows only that sentence and the import path. The same rule applies to the other presses whose tip already holds the whole words: LaneCard's venue press (`Venue: <fact.whole>`), which is left as on the base. No other press of the step's callers keeps its tip: each one's base tip was a hint without the words (`open in X`, `Open this ... as its own tab`, `sessions.select_tip`).

### Verify, the last round as printed

`npm run diagrams` ran as the round's first command. Against the base it leaves four generated files changed by one count each, the two new `Tooltip` imports: `docs/diagrams/layers.dot` and `.svg` ("views to ui" 1110 to 1112), and `docs/diagrams/layer-views.dot` and `.svg` ("folder views/shared to layer ui" 263 to 265). `git status --porcelain docs` lists those four only.

The checks ran over the 251 files that `git diff 55fa909a3 --name-only --diff-filter=AM` and `git ls-files --others --exclude-standard src tests config` list. From `.agents/scratch/verify.log`:

```
== diagrams
diagrams exit 0
 4 files changed, 4 insertions(+), 4 deletions(-)
files      251
== 1 prettier
Checking formatting...
All matched files use Prettier code style!
== 2 eslint
eslint exit 0
== 3 ascii
ascii end
== 4 check
1795656210231 COMPLETED 4690 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
== 5 tree
 Test Files  4 passed (4)
      Tests  29 passed (29)
folder-check exit 0
== 6 contrast
 Test Files  1 passed (1)
      Tests  56 passed (56)
== 7 old path
git grep exit 1
== 8 unused
     336
diff exit 0
== 10 history
history grep exit 1
== extra
 Test Files  13 passed (13)
      Tests  137 passed | 2 skipped (139)
== done
```

- ESLint printed nothing, with exit 0.
- The ASCII gate is spec.md's perl command over `$(find src tests config -type f ! -name local.yml)`. `bin` does not exist in this tree (`ls -d bin`: no such file), so it was left out of the `find`. The gate printed nothing.
- The tree run is `npx vitest run tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts --testTimeout 0 --maxWorkers 2`.
- Verify 7 is `git grep -n "controls/ToolButton.svelte\|controls/tool-button'" -- src tests config docs README.md`.
- Verify 8 is `sh utils/unused-exports.sh`, compared with the 336-line base list. No line was added, so the new `tierWords` is not exported.
- The extra run tests the changed files: `npx vitest run tests/checks/source/keys.test.ts tests/checks/source/catalog-file-keys.test.ts tests/checks/config/config-folder.test.ts tests/checks/diagrams/diagrams.test.ts tests/checks/imports/cycles.test.ts tests/checks/imports/order.test.ts tests/views/boards/focus/rows.test.ts tests/ui/tabs/tab-actions.client.test.ts tests/shell/rail/schedule-dialog.test.ts tests/shell/commands/debug/debug-toolbar.test.ts tests/shell/commands/clone-ask.test.ts tests/views/sources/bar-actions.test.ts tests/views/system/workbench/app-badges.test.ts --testTimeout 0 --maxWorkers 2`. The 2 skipped tests are the real-hub cases.
- No test names the round's cards (`grep -rlE "LineCard|VenueCard|RadarCard|..." tests` lists only `allow-styling.ts` and `boundaries.test.ts`). Their hover words are the look on landing.
- Verify 10: the history-word grep over every added line of `src`, `config` and `tests` (`git diff 55fa909a3 -U0 ... | grep -nE "before|used to|no longer|still|...|O[0-9]{2,}|20[0-9]{2}-"`) printed nothing (`history grep exit 1`). Every changed comment paragraph is wrapped as a whole at 100 columns, which the comment-width test checks.
- Every edit of the round was made with the Edit tool. Prettier's `--write` laid out three of the edited Tag lines.

### Files the round changes, with line counts now

| Path | Lines |
|---|---|
| `src/lib/ui/controls/Tag.svelte` | 160 |
| `src/lib/ui/controls/Chip.svelte` | 321 |
| `src/lib/views/academic/career/CareerCard.svelte` | 110 |
| `src/lib/views/feeds/inbox/InboxCard.svelte` | 364 |
| `src/lib/views/feeds/literature/LiteratureCard.svelte` | 276 |
| `src/lib/views/shared/card/CardDocs.svelte` | 235 |
| `src/lib/views/shared/card/feed/LeadCard.svelte` | 464 |
| `src/lib/views/shared/card/feed/PostCard.svelte` | 142 |
| `src/lib/views/shared/card/feed/RadarCard.svelte` | 422 |
| `src/lib/views/shared/card/project/CardSessions.svelte` | 124 |
| `src/lib/views/shared/card/project/CardFacts.svelte` | 177 |
| `src/lib/views/shared/card/project/ProjectCard.svelte` | 469 |
| `src/lib/views/shared/card/record/registry/DatasetCard.svelte` | 345 |
| `src/lib/views/shared/card/record/registry/DomainCard.svelte` | 145 |
| `src/lib/views/shared/card/record/registry/LineCard.svelte` | 266 |
| `src/lib/views/shared/card/record/registry/VenueCard.svelte` | 429 |
| `src/lib/views/shared/forms/entry/card/EntryCard.svelte` | 352 |
| `src/lib/views/boards/focus/lanes/LaneCard.svelte` | 371 |
| `src/lib/views/shared/forms/dated/Followups.svelte` | 289 |
| `src/lib/views/shared/forms/dated/Subtasks.svelte` | 348 |
| `src/lib/views/shared/links/CrossLinks.svelte` | 207 |
| `src/lib/views/shared/card/record/sets/ArchivalCard.svelte` | 98 |
| `src/lib/views/shared/card/record/sets/NoFundingCard.svelte` | 67 |
| `src/lib/views/shared/card/record/sets/OrphansCard.svelte` | 73 |
| `docs/diagrams/layers.dot`, `layers.svg`, `layer-views.dot`, `layer-views.svg` | one count each |

The round writes three files outside the round brief's named list, each found by item 1's grep as a part drawn on a record card: `Followups.svelte`, `Subtasks.svelte` and `CrossLinks.svelte`. It also writes `EntryCard.svelte`, `LaneCard.svelte`, `CareerCard.svelte`, `DomainCard.svelte` and `LineCard.svelte`, the three set cards `ArchivalCard.svelte`, `NoFundingCard.svelte` and `OrphansCard.svelte`, the "any other card" the round brief allows. ProjectCard.svelte and CardFacts.svelte are on the step's own brief.

### Runs of the last round

The last round ran once, after the last change: every line above, each once. No whole-suite command was run.
