# Step O104 refuter report (on .agents/worktrees/migration-O104, base 3b366cd98)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
npm run test:quick -- --base 3b366cd98
  ok svelte-kit sync (6.0 s)
  ok prettier (6.1 s): All matched files use Prettier code style!
  ok ASCII gate (6.4 s)
  ok eslint (13.8 s)
  ok svelte-check (38.8 s): 1793382777139 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok vitest (137.7 s): Duration 126.23s
  ok vitest slow (142.6 s): Duration 131.26s
  ok vitest checks (147.6 s): Duration 136.18s
  test:quick: 153.8 s; every command passed
  not covered: tests reaching no changed file within import depth, build, lint of unchanged files

npm run diagrams, npm run docs:palette
  not rerun: both write into the tree, and this review changes nothing.

git grep -n "EntryEditor" -- src docs tests
  not run: outside the three git commands this review may use. In its place:
grep -rn "EntryEditor" src docs tests
  printed nothing, exit 1

patch --dry-run -p1 -d ~/workspace/research-hub < .scratch/migration/agents/reviews/O104-hub.patch
  17 files, exit 0, no failed hunk

The patch applied to scratch copies outside the repository, each file loaded with yaml.safe_load:
  all 17 files: every top-level row holds the section of the brief's table, no name of the table missing, no name outside it, no nested row with a section, and each file equal to the hub's file once `section` is taken off.
  rows per file: 15, 11, 23, 23, 28, 10, 10, 13, 15, 5, 12, 5, 7, 11, 6, 6, 20

sh utils/unused-exports.sh
  exit 0, 337 lines, "Unused exports (227)"
  lines naming any of the 96 paths the step changes or adds: none
  names imported on a removed line of `git diff 3b366cd98 -- src` (167) that also stand in the list (835 names): none

python3 yaml read of config/schemas/manifest-schema.yml, key sections:
  Core, Indexing, Content, Connections, Dates, Recovery, Deposit & compute, Outcome, Overrides (rare), Website, Strategy, Positions, Degrees, Awards, References, Profiles

grep -n "entry's page" docs/templates.md
  printed nothing

sed -n 8p ~/workspace/research-hub/.oculus/data/literature/literature.yml
  its title is filled in on the entry's page

node case-run.mjs, python3 case-table.py (the report's quoted evidence)
  not rerun: neither program is on the tree or quoted in source. See 1. Spec, first finding.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds, `schema/field.ts`, `SCHEMA_FIELD`, `formFieldOf`, `docs/data-map.md` and the key list of `docs/templates.md` read; the case test "a schema row's section" in `tests/data/sources/career.test.ts` read and green.
- 2: holds, the list printed above is the brief's order; `hub-layer.ts` reads it; the comment of `manifest-schema.yml` is corrected.
- 3: holds, `src/lib/state/forms/record-fields.ts:77-90`: listed names, then unlisted in first-row order, then the rest under `editor.other`, a file's `Other` joining it. No field falls outside a group.
- 4: holds for `RecordPage.svelte` and `Project.svelte`. The page rebuilds that do not hold to the frame are items 8, 9 and 10, 4. Behaviour, first finding.
- 5: holds, `editor-target.ts` read against base `EntryEditor.svelte`: block on Save with fault, refusal under the field, required reminder, feed partial save, Add person's hub, draft kinds `project` and `page`, close question through `registerUnsaved`, tab label move, `editor.unknown` with the draft kept. The project keeps its refusal line, no reminder and its `stored()` re-read after the await.
- 6: holds, `EntryCard`, the four registry cards, `LeadCard`, `RadarCard`, the Career cards and toolbar read; own action id placed by `RUNS`; Edit in File stays; no schema, no row; `stateId` gives one tab.
- 7: violated, 4. Behaviour, second finding (`LineCard` page drops `muted`). The rest of the item holds.
- 8: violated, 4. Behaviour, first finding (text outside cards on no `Surface`). The contents and the toolbar hold.
- 9: violated, 3. Standards, first finding, and 4. Behaviour, first finding. The contents hold.
- 10: violated, 4. Behaviour, first finding, for the `Empty` of `Listing.svelte:97`. The contents hold.
- 11: violated, 4. Behaviour, third finding (the body's path). The rest of the item holds.
- 12: holds, no Inbox or search file is among the 96 changed paths, and `src/lib/views/shared/forms/entry/entry-add.ts` is unchanged.
- 13: holds for the patch, by the rerun above; fixture rows and `docs/templates.md` match the table with `followup` in Dates and `used_by` in Connections. One change beyond the mapping: 1. Spec, third finding.
- 14: violated, 1. Spec, second finding. The six named sentences are corrected.

Cases of the brief's "Cases":

- The project page and the project editor, before and after: met, line by line against base: blocks, order, gap 12, no tint on the page, `tinted` on the editor, toolbar, status bar, `oninput`, Save, Revert, folds, refused line, no reminder. Only a tab naming no record differs: its Pane title and labels take the `editor.record_*` words and it carries no `data-project=""`, which item 5's "worded for any record" asks. The look is declined below.
- A venue's page: met, reading of `RegistryPageCard` and `Entry.svelte`.
- A venue's editor: met, `formGroups` over the 20 rows of the patched file.
- An application's editor: met, same reading over its 15 rows.
- A person's page: met for the contents and the toolbar, the disabled state and tip read; see 4. Behaviour, first finding.
- A lead's and a Lit Watch paper's page: met, reading; the save goes through the feed path of `pageTarget`.
- Career: met, reading of `Career.svelte`, `CareerCard.svelte`, `career-view.ts`, `editor-target.ts`.
- A career file with no schema: met, reading.
- Archival, Orphans and No funding: met, reading; `listing:<set>` gives one tab.
- A LinkedIn idea: partial, a relative image in the body resolves wrongly, 4. Behaviour, third finding. Mark posted moves the tab: `promotedFile` at `post-card.ts:21` matches the rename in `feeds.ts`, which keeps the name after `xx-`.
- A post whose file was removed: met, `Post.svelte` draws `linkedin.post_gone`.
- A schema row with no `section:`: met, `formGroups`.
- A schema row naming a section the list does not hold: met, `formGroups`.
- An edit in an entry's editor tab, then a close: met, reading of `form-draft.ts` and `draftDirty`.
- An entry's editor while a source tab holds unsaved text: met, `blockedBy` with `pageFile`.
- A save refused for one field: met, reading.
- A save that changes a venue's `name`: met, reading of the editor's label effect; `Entry.svelte`'s stays.
- An entry deleted while its editor tab is open: met, reading.
- An entry whose identity has a fault, as ruled by open item 598 (a): met, reading, the key-less row disabled with `blockedBy`'s words, Edit in File on.
- A person of a people file with no schema: met, reading.
- The Orphans card with no orphans: met, reading of `Listing.svelte`, with the `Surface` point of 4. Behaviour, first finding.
- `section: ""`, and a section named `Other`: met, the table test and `formGroups`.
- A hub collection keyed `listing` or `post`: met by reading `viewIdProblems` (`src/routes/views.ts:198`) over the built-in ids. The quoted run has no source to rerun: 1. Spec, first finding.
- Edit pressed from the page and from the card: met, `stateId` ignores the label.
- A required field emptied: met, reading.
- An entry of a file with no schema: met, reading.
- Two hubs holding one key in one collection: met, `stateId` holds `hub`.
- An Add person from a field of an entry of a second hub: met, reading.

## 1. Spec

- `.scratch/migration/agents/reviews/O104-report.md`, the part on the cases' first run: "`case-run.mjs`, in the session scratchpad: printed, from the pure modules..." and "Two inline commands were run after the ruling, neither kept: `python3 -c` comparing each hub file with the patched copy with `section` taken off, and a `python3` heredoc comparing two knip lists by name."; what is wrong: the brief admits no script except by a Rulings line, and `O104-cases.md` says "Write no further script". The two inline programs came after that sentence. Open item 262 (a) allows a case-run program whose source and output are quoted; `case-run.mjs` and `case-table.py` are quoted by output alone, are gone, and were also used for the changed-tree rows. The report does not say how the hub patch, the fixture rows and the `docs/templates.md` rows were produced. Failure scenario: a reader of DONE row 13 or case "A hub collection keyed `listing` or `post`" cannot rerun the evidence and is left with outputs of programs nobody can read. My own check of the patch and the fixture gives the same result, so no result is overturned. Verdict: the brief's script sentence is violated; no item's result changes.
- `tests/fixtures/hubs/demo/.oculus/data/academic/career.yml:1`: "The career file (FAKE example data), edited in the Career view"; also `docs/templates.md:99`, `docs/templates.md:1711`, `config/text/views/academic/career.yml:10` "so it has no form. Add a schema: to the file to edit it here.", and `src/lib/views/boards/entry/EntryFolder.svelte:9-10` and `:76` "the entry's unsaved edits"; what is wrong: the Career view has no form after this step and an entry's page holds no unsaved edits, so each sentence is false. All are on paths or in a tree the step owns, and `EntryFolder.svelte` is not among the 96 changed paths although its comment describes the form this step removes. Item 14 asks that sentences false once the forms leave the pages are corrected. Failure scenario: a hub author copying the template, or a user reading `no_schema`, looks for a form on the Career page; a maintainer of `EntryFolder.svelte` protects a draft the page no longer holds. Verdict: item 14 violated.
- `tests/fixtures/hubs/demo/.oculus/data/literature/literature.yml:8`: "its title is filled in in the entry's editor."; what is wrong: item 13 asks the same mapping and nothing else on the fixture; this row's help text also changed, and it now differs from the hub's row, and "in in" reads as a slip. The report states the change. `docs/templates.md` holds no such sentence. Failure scenario: the fixture's text no longer matches the hub's row it mirrors, and the two rows of `tests/data/hubs/hub-portfolio.test.ts` were changed to follow it. Verdict: item 13 partial on the fixture; the sentence needs its rewording.

Scripts: none is in the diff. The added files the brief does not name: `RegistryPageCard.svelte`, `ProjectCards.svelte` and `sets/listing.ts` lie under the brief's `registry/` and `sets/` directory paths; `CareerCard.svelte` is outside the path list, is internal, and is named in the report with its reason. No finding on any of them as a path.

## 2. Proof

- `.scratch/migration/agents/reviews/O104-report.md`, the DONE / NOT DONE part and the first line: "Everything in the brief is done" with "One sentence of the hub stays false until the orchestrator decides on it"; what is wrong: the builder's claim on hub `literature.yml:8` is true, and `grep "entry's page" docs/templates.md` printed nothing, but "one sentence" undercounts. `~/workspace/research-hub/.oculus/data/academic/career.yml:1` reads "edited in oculus's Career view on the Academic page" and `.oculus/data/academic/funding.yml:1` reads "Every entry has a page with an editor built from the schema". The first line is also false against 1. Spec, second finding. The decision that rests on it: what the orchestrator asks Axel about the hub's sentences. Failure scenario: Axel rules on one sentence and two stay false after landing. Verdict: the report's first line does not stand.
- `.scratch/migration/agents/reviews/O104-report.md`, "Unused exports": "filtered to every file the step changes or adds, prints nothing"; what is wrong: nothing against the claim, which the rerun reproduces; the filter alone cannot see an export of an unchanged file orphaned by the step, and the base copy holds no `utils/` to compare with. My check of removed import names against the list found none, so this leaves no open defect. No verdict.

## 3. Standards

- `src/lib/views/academic/career/Career.svelte:159-160` and its style block: `<p class="said" class:error={said.error} data-website-said>` with its own `.said` and `.said.error`; what is wrong: Ruling 593 makes a rebuilt page keeping its own style a finding, and the frame owns the outcome line. `RecordPage.svelte:48-52` has no error tone, so the Career page redraws it. The builder lists this as a judgment call; the frame should take the tone, so that one rule draws every outcome line. Failure scenario: a change to the outcome line's look reaches every record page but Career. Verdict: item 9 violated.
- `src/lib/views/shared/card/record/registry/RegistryPageCard.svelte:60` and `:63`: "held?.domains[entry.id]", "held?.pillars[entry.id]"; what is wrong: a direct index on a map keyed by file data where `byKey` (`guards.ts`) exists so a prototype name reads as nothing. Failure scenario: an entry keyed `constructor`, not yet in the snapshot after its save, reads a function and `DomainCard` draws from it. The window is small. Verdict: item 7, the reading only.

## 4. Behaviour

- `src/lib/views/boards/person/Person.svelte:269`, `:282` and `:288-301`; `src/lib/views/academic/career/Career.svelte:182`; `src/lib/views/boards/listing/Listing.svelte:97`: `<Empty message={t('person.no_projects')} />` and `<FolderFiles folder={folderPath} root={hub}>` with no `Surface`; what is wrong: the tint left these Panes, and the Pane's own comment says an untinted view wraps text that is no card in a `Surface`. `Project.svelte:161` and `:193` do, and `EntryFolder` wraps the same folder body. The report's list for the look does not state this change. Failure scenario: a person with no projects, or a person with a folder, on a pane over a wallpaper: the empty line and the file rows are read off the picture, which the project page never does. Verdict: items 8, 9 and 10 violated; Ruling 593.
- `src/lib/views/shared/card/record/registry/RegistryPageCard.svelte`, the `<LineCard` call from line 90: "{...shared} {line} projects=... venues=... tiers=..."; what is wrong: `Pillars.svelte:146` hands `muted={kind.key === OFFPILLAR}`, and the page does not, so `LineCard`'s `{#if !muted}` at line 91 and `class:muted` at line 128 differ. Failure scenario: an off-pillar line opens with a card other than the one its view draws. Verdict: item 7 violated.
- `src/lib/views/feeds/post/Post.svelte:90`: "<RenderedMarkdown path={entry.file} root={hub} text={entry.body} framed />"; what is wrong: `entry.file` is a name inside the feed's folder, while every other caller passes `linkedinSourcePath(folder, entry.file)` (`Linkedin.svelte:162`, `PostCard.svelte:44`), and `folder` is at hand at `Post.svelte:54`. Failure scenario: a post with a relative image, its sidecar in the feed's folder, resolves against the hub's root, so the picture does not draw on the page. Verdict: item 11 violated; case "A LinkedIn idea" partial.

## Declined to judge

- The look of every page and editor (project, entry, venue, person, Career, the three sets, post), the `Toolbar` overflow with "this is me" and the hub chip, a `bare` `ToolButton` with its title in that overflow, wallpaper rendering, the preview tab behaviour and the tab label move on screen: no page can be opened in this review, so these go to the landing's look.
- Whether the hub's false sentences change: outside the hub patch, which holds `section:` alone; the decision is the orchestrator's or Axel's.
- `npm run diagrams`, `npm run docs:palette`: they write, so they were not rerun; their outputs are covered only by the ASCII gate and the suite above.
- The speed of `pageOf` per card on the editor rows: not measured; no page runs here.
- How the patch and the fixture rows were produced: the report does not say; my check of the result is above.

Reviewer usage: acbb52be2a1105eff, claude-opus-5-5, 130606 tokens, 74 tool uses, 16.4 minutes.

## Repair round 1, refuted (on .agents/worktrees/migration-O104, base 3b366cd98)

Result: 8 of the 9 round items close as claimed and item 6 does not. Two sentences of oculus's own docs that the step made false stand (finding 1), so item 14 stays violated and the report's first line is short of them. The hub patch's non-`section:` lines are exactly the three of item 8. Five findings, every one small enough for landing or a ruling; none is a red check.

```
npm run test:quick -- --base 3b366cd98   (from the worktree)
  ok ASCII gate (1.1 s)
  ok prettier (1.1 s): All matched files use Prettier code style!
  ok svelte-kit sync (2.8 s)
  ok eslint (23.2 s)
  ok svelte-check (40.5 s): 1793384807663 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok vitest slow (116.4 s): Duration 108.03s
  ok vitest (117.6 s): Duration 109.18s
  ok vitest checks (119.7 s): Duration 111.35s
  test:quick: 122.7 s; every command passed
  not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree; the build; the lint of unchanged files

npm run diagrams, npm run docs:palette
  not rerun: both write into the tree. The delta of the .dot files read against the diff: boards to ui +3 (Person, Entry, Listing import Surface), feeds to ui +1 (Post), views to ui +4, state to data +1 (lines.ts imports guards). Each matches.

git grep -n "EntryEditor" -- src docs tests
  not run: outside the git commands of this review. In its place:
grep -rn 'EntryEditor' src docs tests
  printed nothing, exit 1

patch --dry-run -p1 -d ~/workspace/research-hub < .scratch/migration/agents/reviews/O104-hub.patch
  17 "patching file" lines, exit 0, no failed hunk

npx vitest run tests/data/sources/career.test.ts
  Test Files 1 passed (1), Tests 28 passed (28)
npx vitest run tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow
  Test Files 1 passed (1), Tests 16 passed (16)
npx vitest run tests/checks/source/comment-width.test.ts
  Test Files 1 passed (1), Tests 2 passed (2)

grep -rn 'data-website-said' src tests docs config (--exclude=local.yml), guarded.md
  no hit in code, tests, docs, config or guarded.md; only the two lines of the report

grep -c '<Surface' Person, Career, Listing, Post, Entry, EntryFolder
  4, 3, 2, 3, 2, 5, as the report says

sh utils/unused-exports.sh
  exit 0, 337 lines. Of the step's files only "src/lib/state/boards/structure/lines.ts: inEntryOrder", a base export, as the report says. OFFPILLAR and registryRecord are not listed.

hub patch, line by line (each - line paired with its + line, `section:` taken off the + line):
  213 pairs. Three differ beyond section:
    funding.yml:1  "Every entry has a page, and an editor built from the schema", rest of the line byte-equal
    career.yml:1   "...shown in oculus's Career view on the Academic page and edited in its editor."
    literature.yml:8  "...and its title is written in the entry's editor." with section: Core
  Nine added lines with no - line, each a bare `    section: <name>` on a block row.
  Lines beginning + : 239, of which 17 are +++ headers: 222 added, 220 rows and 2 header lines. The report's per-file counts sum to 222.

patch applied to scratchpad copies, yaml.safe_load, against the brief's table:
  17 files, 220 rows, every row the table's section, no name of the table missing, no nested row with a section. With `section` taken off, the one value differing from the hub is literature's `title` help.

grep over the hub's 17 files (no local.yml read) for the sentences of the step:
  literature.yml:8, career.yml:1, career.yml:6, funding.yml:1, events.yml:1: five, as the report says.

The report's Doc text quotes matched against guarded.md, line by line: lines 83, 220, 276 equal; the clauses of lines 85 and 278 each found once.

LC_ALL=C grep -n '[^ -~]' docs/templates.md docs/data-map.md docs/HELP.md, the report, the hub patch
  printed nothing

git status --short, before and after this review's runs: unchanged.
```

### Verdicts

The round's nine items, each claimed closure:

- 1 (outcome line): closed. `RecordPage.svelte:61-64` draws `class:error={saidError}`, `.said.error` is `--danger`, and `Career.svelte:156-163` hands `said` and `saidError`. Its `<p>`, `.said`, `.said.error` and whole `<style>` block are gone. `data-website-said` goes with the `<p>`: nothing read it, the base had no test of it, and the report states it twice. Its removal costs nothing. Finding 3 is on the prop's doc.
- 2 (text outside a card): closed except `Post.svelte:96`, finding 2. Person, Career, Listing, Entry, EntryFolder read; the folder body matches `EntryFolder.svelte:128`.
- 3 (off-pillar): closed, `RegistryPageCard.svelte:99`.
- 4 (a post's images): closed, `Post.svelte:98`, the same call as `Linkedin.svelte:162` and `PostCard.svelte:44`.
- 5 (`byKey`): closed. The builder's reason reproduces: the `views` row of `tests/checks/tree/layer-rows.ts:277-285` does not list `data/helpers/guards`, and the `state` row does.
- 6 (false sentences): partial, finding 1. Every named line is corrected, the `no_schema` sentence is word for word, and `config/options/sources.yml:149`, `config/defaults/sources.yml:57` and `EntryFields.svelte:14` are good corrections.
- 7: closed. `literature.yml:8` of the fixture ends as ruled; `hub-portfolio.test.ts` holds no such text and takes no change.
- 8: closed, exactly the three lines, see above. Two hub sentences stay outside the ruling, finding 5.
- 9: closed. "Scratch programs" gives how the patch, fixture rows and template rows were made, and the first line and the count of five are corrected. The first line's "everything else ... is done" does not stand against finding 1.

Reach beyond a finding:

- `OFFPILLAR` to `lines.ts`: necessary. `RegistryPageCard` lives under `views/shared` and may not import `Pillars.svelte`, so the word had to sit where both read it, and `lines.ts` already holds `lineKinds`. No behaviour change in `Pillars.svelte`. The path is outside the brief's list and the report marks it.
- `registryRecord` in `lines.ts:254`: one caller site, two calls, the smallest form that reads through `byKey` from a view. Within the finding.
- The `title` help of the fixture's `career.yml` and of `docs/templates.md`: inside item 6's "every other sentence".

Items of the brief's "What to build", over the whole diff:

- 1: holds, `field.ts:151`, `record.ts:424`, `formFieldsOf` (top level only), `data-map.md`, `templates.md:1097`; the table test reads and passes.
- 2: holds, `manifest-schema.yml` sections as asked; `hub-layer.ts` reads the same list.
- 3: holds, `formGroups` in `record-fields.ts` read: listed, then unlisted, then the rest under one Other.
- 4: holds, `RecordPage.svelte` and `Project.svelte` read.
- 5: holds, `Editor.svelte`, `editor-target.ts` read against base `EntryEditor.svelte`: block on Save, refusal under the field, reminder, feed partial save, Add person's hub, the project's refusal line and no reminder, tab label move, `editor.unknown`, draft kinds.
- 6: holds, `editorAction`, `editorRows`, `RUNS`, `EntryCard`, `LeadCard`, `RadarCard`, `CareerCard` read.
- 7: holds, `muted` now handed and `byKey` read; the page draws the view's card.
- 8: holds, `Person.svelte` read. Finding 4 is a comment.
- 9: holds, `Career.svelte`, `CareerCard.svelte`, `career-view.ts` read; the outcome line is the frame's.
- 10: holds, `Listing.svelte`, `listing.ts`, `ProjectCards.svelte`, `OrphansCard.svelte` read.
- 11: holds, `Post.svelte`, `post-card.ts` read; the body's path is right. Finding 2 is the Surface's kind.
- 12: holds, no Inbox or search file changed.
- 13: holds, by the table run above; the hub patch now carries the three ruled lines.
- 14: violated, finding 1.

Cases of the brief's "Cases":

- The project page and the project editor, before and after: met, reading; only a tab naming no record differs, as item 5 asks.
- A venue's page: met, reading.
- A venue's editor: met, 20 rows, Core, Indexing, Content, Dates by the table run.
- An application's editor: met, 15 rows, Core, Content, Connections, Dates.
- A person's page: met, reading.
- A lead's and a Lit Watch paper's page: met, reading, feed path of `pageTarget`.
- Career: met, reading.
- A career file with no schema: met, reading; no Edit in the toolbar or on a card.
- Archival, Orphans and No funding: met, reading; `listing:<set>` gives one tab.
- A LinkedIn idea: met, reading; path corrected; `promotedFile` moves the tab.
- A post whose file was removed: met, `Post.svelte:78-80`.
- A schema row with no `section:`: met, `formGroups`.
- A schema row naming a section the list does not hold: met, `formGroups`.
- An edit in an entry's editor tab, then a close: met, `form-draft.ts`.
- An entry's editor while a source tab holds unsaved text: met, `blockedBy` in `pageTarget`.
- A save refused for one field: met, reading.
- A save that changes a venue's `name`: met, the editor's effect and `Entry.svelte`'s.
- An entry deleted while its editor tab is open: met, reading.
- An entry whose identity has a fault, as ruled by open item 598 (a): met, reading.
- A person of a people file with no schema: met, reading.
- The Orphans card with no orphans: met, `Listing.svelte` with its `Surface`.
- `section: ""`, and a section named `Other`: met, table test and `formGroups`.
- A hub collection keyed `listing` or `post`: met, by reading `viewIdProblems`; the quoted run's program is gone, which the report states.
- Edit pressed from the page and from the card: met, `stateId`.
- A required field emptied: met, reading.
- An entry of a file with no schema: met, reading.
- Two hubs holding one key in one collection: met, `stateId` holds `hub`.
- An Add person from a field of an entry of a second hub: met, reading.

### Findings

1. Spec. `docs/data-map.md:57` and `config/defaults/sources.yml:34`.
   - Quoted hunks: "and the open leads, and every entry has a page with an editor built from its schema." and "Every entry has a page with an editor built from the schema, where it is edited and deleted, Add asks the new entry's primary key".
   - What is wrong: item 6 closes with "the hits left are other editors ... or a sentence true of the code", but both sentences are the one Axel ruled false in hub `funding.yml:1`, and the page holds no editor after this step. The item's listed grep patterns do not match the words "with an editor", so its grep missed them; the item's closing clause still covers them. The builder's grep also ran over three pages of `docs` where the item says `docs`; `docs/apps.md` and `docs/palette.md` hold no hit, so that narrowing changes nothing.
   - Failure scenario: a hub author reading the data map or the defaults comment looks for the form on the entry's page.
   - Verdict: item 14 violated, round item 6 partial, and the report's first line short by these two.
   - Fix at landing:
     - data-map: "every entry has a page and an editor built from its schema."
     - sources.yml: "Every entry has a page, where it is deleted, and an editor built from the schema, where it is edited, Add asks the new entry's primary key".
     - The report's first line takes them.

2. Standards. `src/lib/views/feeds/post/Post.svelte:96`.
   - Quoted hunk: "<Surface>" around "<RenderedMarkdown ... framed />".
   - What is wrong: `.framed` draws a border and pads its content, and `Surface.svelte`'s head comment says "A `fitted` one paints exactly under its content, for content that draws a border and a padding of its own". The plain Surface pads 8 px on each side and paints 4 px above and below.
   - Failure scenario: a post over a wallpaper: the body's frame stands 8 px narrower than the card above it, inside a band of panel.
   - No item's text is broken; ruling 593's look, round item 2.
   - Fix at landing: `<Surface fitted>`. No effect without a wallpaper.

3. Standards. `src/lib/views/shared/card/record/RecordPage.svelte:28`.
   - Quoted hunk: "/** What the card's last write answered, drawn over the card; the empty text for none. */".
   - What is wrong: round item 1 hands this prop Career's `said`, which is the answer of Write the website, a toolbar press, or the words of why the button is off (`Career.svelte:~131`). The head comment was changed to fit; the prop's doc was not.
   - Failure scenario: a reader of the frame takes the line for a card's answer and looks for the card that wrote it on Career.
   - Fix at landing: `/** The page's outcome line, drawn over the card; the empty text for none. */`.

4. Standards. `src/lib/views/boards/person/Person.svelte:25`.
   - Quoted hunk: "// holds no form: Edit opens the editor beside it (views/boards/editor/Editor.svelte)," followed by "// and a person of a people file with no schema has no Edit."
   - What is wrong: `spec.md`, "What every package obeys": a comment the step edits is rewrapped at 100 columns so no line inside a sentence ends short. This line is 90 columns and "and a" fits. `comment-width.test.ts` checks only the upper bound.
   - Failure scenario: none for behaviour; the paragraph reads as hand-broken.
   - Fix at landing: rewrap the paragraph at lines 23 to 28.

5. Spec, for Axel, not for landing. `~/workspace/research-hub/.oculus/data/academic/events.yml:1` and `career.yml:6`.
   - Quoted hunks: "(every entry has a page with an editor built from the schema, Add asks the key and opens that page, ...)" and `  - { field: title, type: text, help: "The title of the career file's editor page." }`.
   - What is wrong: the report states both correctly. Both stay false after landing, because the ruling of item 8 says "and nothing else" and a landing fix would widen that ruling.
   - Failure scenario: events.yml says what funding.yml no longer says, and the hub's `title` help differs from the fixture's and `docs/templates.md`'s.
   - Fix, on his yes:
     - events.yml:1: "every entry has a page, and an editor built from the schema".
     - career.yml:6, patched row: `  - { field: title, type: text, section: Strategy, help: "The title of the strategy card and of the editor's tab." }`.

Under Proof and Behaviour there is no other finding of this run. The first review's Proof 2 raised no defect and stays so.

### Declined to judge

- The look of every changed page and of the Post frame over a wallpaper: no page can be opened in this review; finding 2 is by reading. It goes to the landing's look.
- `Project.svelte:133` and `:135` stand on no `Surface`, as at the base, while `RecordPage.svelte:8-9` now says what a view draws outside a card sits on one. Wrapping them changes the project page over a wallpaper, and ruling 593 says that page does not change, so whether to wrap them or reword the sentence is the orchestrator's or Axel's.
- `muted={line.kind === OFFPILLAR}` against `kind.key === OFFPILLAR` at `Pillars.svelte:145`: the two differ only for a hub whose merged `pillar_kinds` holds no `offpillar` row, where the view draws the line unmuted under Other and the page draws it muted. No such hub is on the tree and the cost is a tone, so I raise no finding.
- `npm run diagrams`, `npm run docs:palette`: they write. Their output is judged by the `.dot` delta above.
- Whether the report's count of 5 runs of the list is right: no record outside the report. A red run followed by a fix and one more run is what `spec.md` allows.

Reviewer usage: a794fd0690f9f9703, claude-opus-5-5, 288659 tokens, 41 tool uses, 11.9 minutes.

## Closed

The first review's findings were closed in repair round 1 (`agents/briefs/O104-round1.md`), and this run gives their closures above. The run's findings are not sent to the builder.

- Finding 1: fixed at landing, `docs/data-map.md:57` and `config/defaults/sources.yml:34`, with the two sentences the finding gives.
- Finding 2: fixed at landing, `<Surface fitted>` at `Post.svelte:96`.
- Finding 3: fixed at landing, the doc of `said` in `RecordPage.svelte`.
- Finding 4: fixed at landing, the paragraph of `Person.svelte` rewrapped.
- Finding 5: fixed at landing in the hub. The words "and nothing else" of round item 8 are the orchestrator's, the two sentences are false because of this step, and item 14 of the brief is the same reason.
- Declined point on `RecordPage.svelte:8-9`: the sentence now says a section a view draws outside a card sits on a `Surface`, so it holds for `Project.svelte`, whose page is unchanged under ruling 593.
