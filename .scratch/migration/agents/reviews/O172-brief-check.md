# Step O172 brief check (on main at 4a8e29067)

Brief check of O172, on main at 4a8e29067 (`git log -3 --oneline`). Nothing was changed.

The defects that need a change before dispatch:
- N1: the new file's folder is full.
- P1: the textarea list is incomplete, and the one field it misses that is drawn outside `EntryFields` is `career.order_note`.
- P2: the data count is wrong.
- C1: checks 3 and 4 use `git grep`, which the rules file forbids a builder.
- C2: check 4 cannot print what it says.
- C3: the reason for the `<div>` rests on server rendering, and the app has none.

# Names

Each grep below ran across the repository without `.scratch`, with `':!config/local.yml'`. Paths inside "Paths this step writes" are left out unless stated.

**N1 (defect): the new file's folder is at its limit.**
- `git ls-files src/lib/views/shared/card | awk -F/ '{print $6}' | sort -u | wc -l` prints 10: card-layout.ts, card.ts, CardDocs.svelte, Clamp.svelte, feed, pane-fold.ts, project, record, Reveal.svelte, RootChip.svelte.
- `sh utils/folder-check.sh` exits 0 today. Item 2's `src/lib/views/shared/card/FieldMarkdown.svelte` makes 11, which the rules file ("At most ten tracked items in a folder") and `tests/checks/tree/size.test.ts` refuse.
- `src/lib/views/shared` (10) and `card/record` (10) are also full, and `card/feed` holds 10 items.
- My judgment: a new folder such as `card/text/` holding `Clamp.svelte` and `FieldMarkdown.svelte` keeps `card/` at 10. `CardBrief` and `EntryFields`, both on the write list, import `Clamp` and name its path in a head comment.
- The rule requires the split, so this is no widening.

`inlineMarkdown`, `git grep -n 'inlineMarkdown'`, hits outside the write list:
- `src/lib/views/academic/present/markup.ts:19,99`, not false.
- `src/lib/views/feeds/leads/Leads.svelte:52,263`, not false.
- `src/lib/views/shared/card/record/sets/ArchivalCard.svelte:18,56` and `OrphansCard.svelte:13,47`, not false.

Head-comment claims, `git grep -n -i 'one paragraph\|inline renderer\|inline content\|inline markdown\|block margins'`:
- Outside the write list: `src/lib/ui/frame/card/Card.svelte:40`, `Leads.svelte:262`, `ArchivalCard.svelte:55`, `OrphansCard.svelte:46`, `present/markup.ts:94`. All not false.
- `src/lib/views/shared/prose/Intro.svelte:42` is an unrelated use.
- `tests` and `docs` hold no hit outside the two named test files.

`firstSentence`, `git grep -n 'firstSentence'`, hits outside the write list:
- `src/lib/state/boards/board/index.ts:17` (re-export), not false.
- `src/lib/views/boards/focus/Band.svelte:31,128`, `src/lib/views/boards/focus/lanes/LaneCard.svelte:45,249`, `src/lib/views/boards/projects/BoardList.svelte:30,76`. Their result changes as item 7 intends; not false.
- Comments `BoardList.svelte:6` and `src/lib/views/shared/card/project/ProjectCard.svelte:26` (`git grep -n -i 'first sentence'`), not false.

`radar.threatens`, `git grep -n 'radar\.threatens\|threatens'`:
- The key appears only in `config/text/views/feeds/radar.yml:21` and `RadarCard.svelte:301`, both on the write list.
- `threatens` as the data field: `docs/data-map.md:333`, `docs/templates.md:1727,1745`, `src/lib/state/feeds/radar.ts:104`, `tests/fixtures/hubs/demo/.oculus/data/literature/radar.yml:26`. They name the data field and are not false.

`Clamp` children comment:
- `inline content` occurs only at `Clamp.svelte:23`, on the write list.
- `src/lib/views/shared/card/card-layout.ts:10,19,22` holds the measure, unchanged and not false.

`FILTERED`:
- Only `tests/checks/source/html-sites.test.ts:23,142`, on the write list.
- `FILTERED_TYPES` (`src/lib/data/model/...`, `src/lib/data/snapshot/schema/run.ts`, `src/lib/state/boards/collection/bar.ts`) is another name, unaffected.

`CardDetails` head comment:
- References outside the write list: `src/lib/state/sources/files.svelte.ts:6`, `PressBox.svelte:5`, `ProjectCard.svelte:17`, `RecordDetails.svelte:7`. They describe its place and columns and are not false.
- `src/lib/ui/display/text/CodeText.svelte:11` ("a project card's prose fields") stays true for STATUS, RESULTS, IDEAS and the one-line NEXT.

Comments inside the write list that the change makes false and the brief does not name. The rules file's grep-and-reread bullet already binds the builder to them, so this is no defect:
- `DatasetCard.svelte:19-20`, `RadarCard.svelte:25-26`, `VenueCard.svelte:24-25`, `EntryFields.svelte:38-39`.
- `CardBrief.svelte:6` (ELI5 link through `LinkedText`).
- `Clamp.svelte:88-89` ("a text holding inline markup").
- `html.ts:38` and `:215` (`HtmlMemo`).
- `presets.ts:700-701` ("a line broken across a manifest reads as one").
- `tests/ui/html.dom.test.ts:2`.

# The step line

Plan line read with `sed -n 1734p .scratch/migration/plan.md`; ruling at `.scratch/migration/plan.md:3669`. `git diff HEAD -- .scratch/migration/plan.md` shows the line's correction, uncommitted, as the brief says.

| Part of the line | Requirement |
|---|---|
| a field of the schema type `textarea` | item 4 (through `kindOf` to `EntryFields`, own cards); gap below |
| the other long note fields | item 4 (`note`, `statement`, Inbox `what`) |
| on a card and on the record page | item 4 |
| which `inlineMarkdown` or, on a project card and page, `LinkedText` and `CodeText` draw as one paragraph | items 1, 4 (`CardBrief`, `CardDetails`) |
| drawn as block Markdown | items 1, 2 |
| single newlines kept | item 1 (`breaks: true`) |
| lists and paragraphs included | items 1, 2 |
| spaced for a card | item 2 (`--field-gap`) |
| the clamp on a long card field keeps working | item 3 |
| (ruling 732) | line 3669 of the plan |

Part with an unserved instance:
- `career.order_note` has schema type `textarea` (`career.yml` schema, read by a node program: `goal:text | milestone:text | order_note:textarea`).
- It is drawn on a card by `src/lib/views/academic/career/Career.svelte:96-97`, then `src/lib/views/academic/career/CareerCard.svelte:45` (`<dd><LinkedText text={line.text} /></dd>`). No item builds it.
- The value is empty in the hub today (`order_note set: false`).
- The line requires it, so adding `CareerCard.svelte` is no widening. That card's lines also hold non-field text, so the site needs a choice.

Requirements with no part of the line:
- Item 7 (`firstSentence`): a one-line cut is not drawn as block Markdown. Its reason is Decision 4.
- Items 5 and 6 are consequences of "block Markdown" on sites the line covers.

# Premises

Reproduced as stated:
- `html.ts` numbers `:80`, `:221`, `:228`, `:546`, `:581`, `:602`, `:721`, and the comment text 536-545 (read).
- `ALLOWED_TAGS` content, read at 80-118.
- Every `file:line` of the "Own cards" fact (`grep -rn inlineMarkdown src/lib/views`).
- `Clamp` facts; `card-layout.ts:10,19`.
- `presets.ts:706` and its four callers.
- `LinkedText` and `CodeText` looks.
- `html-sites.test.ts:23`.
- `grep -n 'type: textarea' config/schemas/manifest-schema.yml` (9 lines, the brief's names).
- The Deposit-only grep (`Deposit.svelte:82`, `DepositZenodo.svelte:7,24`).
- `grep -rln firstSentence tests` prints nothing.
- `wc -l` 828 and 475.
- Marked 18.0.12 (`node -p`).
- Decisions 1's five cases: each input is present in its file and the output matches, by a node program with `new Marked({breaks:true,gfm:true})`.
- `Clamp` and project grep sites as listed.

Line numbers slightly off (no consequence):
- `UNKEPT_TAGS_AS_TEXT` is at `html.ts:567`, not 566.
- `markLinks` starts at `:182`; `:186` is its `setAttribute`.
- `EntryFields` snippet `text` is 212-222, not 213-223.

**P1 (defect): the list of textarea fields is incomplete.** A node program over each file's `schema:` (tasks.yml excepted) prints textarea fields the brief omits:
- `academic/education`: `note`, `about`.
- `academic/career`: `order_note`.
- `research/resources`: `access`.
- `literature/literature`: `abstract`, `note` (0 rows in the file).

Education, resources and literature reach `kindOf` body if drawn by `EntryCard`. I did not verify which card draws them. Career is the gap above.

**P2 (defect): the data count of line 22 is wrong.**
- Same program: `academic/education ... nl 3 ... {"nl:about":3,"inl:br":3}`. So three education `about` values hold single newlines, against "every other value is one paragraph with no newline".
- "57 manifests" does not reproduce: `git ls-files '*project.yml'` in the hub prints 120; `find projects side-projects -maxdepth 3 -name project.yml` prints 79. The hub's `scan:` lists seven folders.
- The conclusion holds over all 120: 261 filled values of `eli5`, `next`, `latest`, `outcome`, `reproduced.note`, no newline, none other than one paragraph.
- Funding `about` 4: reproduced.
- Every other non-tasks collection file: `nonpara 0`.

**P3:** line 21 says G5 "names the three tests". `sed -n 19,21p .scratch/migration/agents/guarded.md` names four. The file is under `.scratch/migration/`, not the repository root (`agents/guarded.md: No such file or directory` from the root).

**P4:** line 23's "the limit of 880" is the limit for a source file. `EntryFields.svelte` is a component, limit 520 (rules file, "A source file stays at or under 880 lines and a Svelte component at or under 520"). 475 is under it.

**P5:** line 16 and item 4 ("Every field listed ... is drawn through `FieldMarkdown`") cannot hold for a lead's `note`. `git grep -nE "word\('" -- src/lib/views/shared/card/feed/LeadCard.svelte` reads title, inst, country, typ, focus, fit, status and url. `git grep -nE "'note'" -- src/lib/views src/lib/state/feeds src/lib/state/boards` finds no reader of it, and 20 leads hold one (node program: `note set 20`). It is drawn nowhere on the unchanged tree. Item 4's "LeadCard (the note)" means the joined focus and fit. Drawing `note` would be a widening.

# Cases and checks

**C1 (defect):** Verify 3 and 4 (`git grep`, brief lines 161, 162) are commands the rules file forbids a builder. "Where you work" reads: "The git commands you run are `git status`, `git diff` and `git show` ... any other git command ... you never run". `grep -rn` with `--exclude=local.yml` is the allowed form.

**C2 (defect):** Verify 4 cannot print "one catalog key". `git grep -n 'radar.threatens' -- src config ':!config/local.yml'` prints only `src/lib/views/shared/card/feed/RadarCard.svelte:301`. The catalog line is `threatens: 'threatens: {0}'` under its group, and the call is split over lines.

**C3 (defect):** item 4's reason and C12 rest on server HTML. `git grep -n 'export const ssr' -- src` prints `src/routes/+layout.ts:3:export const ssr = false;`, and no route overrides it. "A block inside a `<p>` is invalid markup" stands alone as the reason. "A server-rendered page would be parsed differently" is false in the product and would be false if it reached a comment. C12 run through `svelte/server` is a validity check of the output, nothing more.

Other inconsistencies with the rules file:
- Line 86 ("Every other case is checked by a run the report quotes") and line 81 ("first run of every case") clash with the bullet "A builder runs no page ... its row in the report names the look on landing as its proof". C3 (height), C4, C5, C6, C11, C14 and C16 are cases only a page shows. Line 53 says "and by the look"; line 86 does not.
- Line 149 ("A field of one paragraph looks as it does on the unchanged tree: same words, same height ...") clashes with item 5 and C14 for a threat long enough to wrap. On the unchanged tree it is one flex item after the glyph; in its own column it is narrower and can be taller.
- C10 "the code look of the unchanged tree": on the unchanged tree an ELI5 prints its backticks (`LinkedText`), so only NEXT has that look. A wording point.
- Item 9 adds a fifth test to G5. The rules file reads "An entry keeps one test per unit ... file its text and its Code line name, written as a table", and G5's Code line names one file. My reading is that `fieldMarkdown` is a new renderer and so a unit. G5's four existing tests are no evidence either way.

Cases that ask about a place the step does not change:
- C18 (titles stay `inlineMarkdown`).
- The report's "Doc text" section (`agents/guarded.md`, a ledger file) is the only other. The rules file requires G5 to name the test.

No other case is inconsistent with the rules file.

# The question

Goal: a long field is drawn with its newlines, paragraphs and lists on a card and on the record page, with the clamp still working.

- C1, C2: no, read at the look on a card and a page. Yes if only a program calling `fieldMarkdown` runs them, since it never touches a card.
- C3: no at the look.
- C4, C5: no at the look.
- C6: yes for the open state. It reads the cut state only (Implied inputs 3).
- C7, item 9: yes. They prove the sanitiser over the function, not that any card draws through it. That is G5's concern, not the goal.
- C8: no.
- C9: yes. The case has no formula, so a block map beside `plain` that shares the formula map passes while the same text with a formula collides in `mathMemo`.
- C10, C11: no.
- C12: yes. It names three of the ten components, and server HTML is not what the app draws (C3 above).
- C13, C15: no.
- C14, C16: no at the look.
- C17: yes for "on a card"; it can be run on the function alone.
- C18: yes, by design; it guards the title.

The step line holds no check of its own.

Verify:
- 1, 2, 5: yes, they are not checks of drawing.
- 3: yes. It passes with a field dropped or drawn by anything else.
- 4: cannot be met as written.
- 6: as C7.
- 7: yes, a reading of prose.

Items:
- Item 1: no, by C1, C2.
- Item 2: no at the look.
- Item 3: no, by C4 to C6.
- Item 4: yes for `DatasetCard`, `LineCard`, `DomainCard`, `VenueCard`, `InboxCard` and a multi-paragraph `RadarCard` note. No case gives them a field with newlines, and only Verify 3 and C12 touch them. A case per card would be a widening; the look's before-and-after list can carry it.
- Item 5: no, by C14.
- Item 6: no, by C15.
- Item 7: no, by C13.
- Item 8: no; `html-sites.test.ts` fails on an unlisted call.
- Item 10: has no check; a reviewer's read.

# Implied inputs

Each would add a case or a requirement, so each is reported as a widening unless a reader decides the line requires it. Outputs are from `new Marked({breaks:true,gfm:true})`.

1. Lead with empty `focus` and a `fit`: today's join gives ` - fit`, and Marked prints `<ul><li>medium fit</li></ul>`. Expected: `fit` as a paragraph. Not in the hub today (`empty focus with fit 0`). Cost: a bullet on a card.
2. `reproduced.note` holding a list (item 4 joins date, ` | `, note): `2026-11-01 | - a` newline `- b` prints `<p>2026-11-01 | - a</p>` and a one-item list. Same defect item 6 fixes for leads. Expected: the date, then the note's blocks. Not in the hub (`single-nl 0`).
3. Clamp open on a text of exactly four lines with a paragraph gap. `.text` is measured with the gap when open and without it when cut, so `long` is true open and false cut, and "Show less" vanishes when pressed. Reached because `more` is one prop for every body field of an entry (`EntryFields.svelte:85-88`). Expected: no control for such a text. Item 3 fixes the measure as it stands.
4. A sentence broken over two lines in a manifest: item 7 returns the first line, cut with no `...`, where the doc comment at `presets.ts:700-701` says the opposite. Expected: per item 7, the first line. Not in the hub today.
5. A task list `- [ ] one`: prints `<input disabled="" type="checkbox">`, which `ALLOWED_TAGS` keeps. Expected: a disabled box and the words. A reader-visible element no case names.
6. A display formula `$$...$$` alone on a line: the block extension is reached only by the new parser. Expected: typeset, no widening of the column.
7. A `pre`, `table` or `img` inside the first four lines of a cut clamp: its padding breaks "whole lines". Not in the hub apart from the task note, whose content I did not read.

# ADRs

None. `ls docs/adr` prints `ls: docs/adr: No such file or directory`, exit 1.

# Dictated text

Each is found by `grep -n '<text>' .scratch/migration/agents/briefs/O172.md`.

- Line 53, test title `is the sanitiser over the field renderer, so no long field reaches a card around it`: holds.
- Line 49, the catalog label `threatens:`: holds (a catalog line; the value needs YAML quotes for its colon).
- Line 52, `'fieldMarkdown('`: holds.
- Line 28, `fieldMarkdown(text, math, memo)`: holds.
- Line 33 and line 93, path `src/lib/views/shared/card/FieldMarkdown.svelte`: breaks "What every package obeys", ten items in a folder (N1).
- Line 35, `margin-top: var(--field-gap, 0.45em)`: holds.
- Line 36, `padding-left: 1.25em`: holds.
- Line 37, `1em`: holds.
- Line 39, `overflow-wrap: anywhere`, `min-width: 0`: holds.
- Line 41, `--field-gap: 0`: holds.
- Line 41, comment words "the text may hold blocks": holds.
- Line 50, ` - ` kept as the join: breaks "every user-facing string from a catalog file ... A literal string ... anywhere a reader sees it is a defect" on `LeadCard.svelte:151`, a line item 6 changes. The literal is on the tree, and a catalog key would add `config/text/views/feeds/leads.yml`, a path outside the list. Reported as a widening, not a defect.
- Line 51, the marks list: holds.
- Line 161 and line 162, the `git grep` commands: break "Where you work" (C1). Line 162 is also unmeetable (C2).
- Line 159, `npm run diagrams`, then `npm run test:quick` and "every command passed": holds.
- Line 171, "Everything in the brief is done": holds.
- Line 181, section name "Doc text": holds.

Not dictated, but stated facts: line 125 "thirteen sites". My count of the calls item 4 replaces is 17 (EntryFields 4, CardBrief 2, CardDetails 1, Dataset 2, Radar 2, Lead 1, Inbox 1, Line 2, Domain 1, Venue 1). No decision rests on it.

# Declined to judge

- The hub's `.oculus/data/academic/tasks.yml` was not read. The brief's count of it (one note with blank lines and a list) and its `note` textarea are taken as given.
- Which card draws education, resources and literature entries was not verified by a run. The `kindOf` route to `EntryFields` is read, not exercised.

# Usage

a7b3f00ada05c428a, claude-opus-5-5, 221472 tokens, 27 tool uses, 10.2 min

# Closed (the session's change to the brief for every finding above, made before the preparation commit)

- N1, the folder: item 2 makes the folder `src/lib/views/shared/card/text/`, `Clamp.svelte` moves into it with `mv` and `FieldMarkdown.svelte` is written there, so `card/` stays at 10. Internal, booked in `choices.md`.
- P1: the list of textarea fields is completed; `career.order_note` is drawn through `FieldMarkdown` (item 4, `Career.svelte` and `CareerCard.svelte` added to the paths, since the step line requires a field of that type on a card).
- P2: the data line is corrected from the counts of the check (three education `about` values, 120 manifests, 261 filled values).
- P3, P4: corrected in "What is on the tree". The line numbers of `html.ts` and `EntryFields.svelte` are corrected too.
- P5: item 4 says the joined focus and fit; the fact says a lead's `note` is drawn nowhere and stays so.
- C1, C2: Verify 3 and 4 use `grep`, and Verify 4 is rewritten to what it can print.
- C3: the server-rendering reason is removed; item 4 gives invalid markup as the reason; C12 is a reading of every changed site.
- Cases that only a page shows: the rule "the builder runs no page" is stated above the cases, and each such case names the look.
- "What it must do": the wrapped radar threat is named as the exception.
- C10's wording, C18 removed, "thirteen sites" corrected to seventeen. C9 has a row with a formula. C6 has the open state.
- Implied 1, 2: item 6 covers an empty focus and a `reproduced.note` holding a line break. Implied 3: item 3 measures with the gap off while open. Implied 4: item 7 rewrites the doc comment, and C13 has the broken sentence. Implied 5, 6: added to C16 and C8. Implied 7: Decision 3 says a `pre` or `table` in a cut clamp may be sliced by its own padding.
- Item 4, cards with no case: the report's before and after names each card, for the look.
- Item 7 "no part of the line": kept by Decision 4, since a one-line cut on a card is a long field drawn on a card.
- Item 9 and G5: kept, as each renderer in `html.ts` has its own sanitiser test under G5 and the new function is a new renderer.
- The literal ` - ` on `LeadCard.svelte:151` stands on the tree; a catalog key would be a widening, so it is left as it is.
- The base copy is named at the head of the brief.
- Dictated text: the path and the two commands are changed as above and held; the catalog value is written `'threatens:'`, which holds.
