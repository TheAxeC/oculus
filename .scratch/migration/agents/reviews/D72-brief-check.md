# Step D72 brief check (on main at 8b5782e89)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/D72.md`. Read in full: the brief (190 lines), `agents/spec.md` (104 lines), `plan.md`'s Goal, the D72 line (`grep -n '^- D72 ' plan.md` gives 781) and the Rulings section from Z849 to open item 78, plus the tree at 8b5782e89. Nothing was changed. The main findings are listed here first and argued in the sections below:

- The venue's read-only field contradicts Z854.
- The Leads premise is false: no lead form exists.
- `utils/docs/` breaks the folder limit.
- The entry page cannot import `Editor.svelte` across the view boundary.
- A records field is often a map, which the brief does not cover.
- No write is named for a feed's Add.
- `waiting-on` referrers of a person are missed.
- No guarded entry is named for the new tests.
- One case asks for breakage testing.
- The venue case names a field (`rank`) that does not exist.

## 1. Names

Command (each name, outside the write list, plan/briefs/reviews/history excluded): `git grep -n -I -E "<name>" -- ':!tools/oculus/src' ':!tools/oculus/tests' ':!tools/oculus/config/sources.yml' ':!tools/oculus/config/layout.yml' ':!tools/oculus/config/text' ':!tools/oculus/HELP.md' ':!tools/oculus/DESIGN.md' ':!tools/oculus/docs/apps.md' ':!docs/DATA-MAP.md' ':!tools/oculus/docs/diagrams' ':!tools/oculus/package.json' ':!**/local.yml' ...`.

- `Entry.svelte`, `FEED_RULES`, `entry-file`, `addInFile`, `AddButton`, `RegistryTools`, `docs/palette`, `docs:palette`: no hit outside the write list.
- `Editor.svelte`: `.scratch/migration/choices.md:3416` and `orchestrator-state.md:165`. Both are log text, and the change does not make them false.
- `manifest-draft`: `.scratch/migration/agents/guarded.md:75-76`, which is G28's Code and Test lines.
  - Made false if the draft is generalised under another name.
  - G28's sentence "the file editor (an entry that Add put in its text included...)" describes the source-tab Add that item 3 replaces, so it becomes false.
  - G28 names no entry editor. Its "survives a tab switch, a reload and a change of its file on disk" is the rule the new editor must meet.
  - `src/lib/state/sessions/source/draft-entry.ts` is G28 Code. Its only importer is `src/lib/views/shared/forms/entry-file.ts` (`grep -rln "draft-entry" src`). It is orphaned once `addInFile`/`placeInFile` go, and the brief does not say whether it and its G28 test go.
  - `guarded.md` is the orchestrator's file. **Finding:** the brief names none of these G28 rewrites.
- `people_file`, `organisations_file`, `resources_file`:
  - `.oculus/config/sources.yml:49,52,55` stay true under decision 3.
  - `tools/oculus/config/catalogs/options.yml:1342-1358`: the people_file help says "the Person view". That is false if the person's page becomes the `entry` view (see section 2, the item 1 / item 6 conflict), and true otherwise. `config/catalogs/options.yml` is not in the write list (only `glyphs.yml` and `icons.yml` are). **Finding.**
  - `tools/cockpit/...`: cautionary reference only.
- `collections:`:
  - `.oculus/config/sources.yml:58`: the comment "An entry is added and edited in the file, which Add and Edit in File open" becomes false. The orchestrator's landing text adds only the three list lines. **Finding.**
  - `config/catalogs/options.yml:1363` ("Each key except venues, datasets, pillars, domains and data also becomes a collection view") stays true.
  - `docs/DATA-MAP.md:187-189` is in the write list.
- The hub's data head comments are made false by item 3. They are hub data, outside the write list, and the brief names no landing reword. **Finding.**
  - `funding/funding.yml:1`: "An entry is added and edited in the file, which Add and Edit in File open, ...".
  - `network/events.yml:1`: "(an entry is added and edited in the file, which Add and Edit in File open)".
  - The demo hub's files say only "a write and Edit in File address the entry by it", which stays true.
- `slug`:
  - `src/lib/state/boards/board/presets.ts:306,317` (the bucket ids of `tab_rollup`) is in the write list. Adding accent stripping changes a bucket id only for an accented label. No engine label is accented: `sed -n 146,175p config/layout.yml | grep label | LC_ALL=C grep -c '[^ -~]'` gives 0.
  - Near copies of the same rule: `src/lib/server/edit/feeds.ts:219` (`slugOf`, capped at 80) and `src/lib/state/feeds/radar.ts:109` (`slugOf`, capped at 40). The brief moves only `slug()` "to a shared helper". **Finding (minor):** under spec.md's "a rule exists once" and G21, the brief should say whether the two `slugOf` join the helper.
  - `utils/migrations/migrate-joint-work.mjs:64` is not changed and not made false.
- `code` placement: `Collection.svelte:15`, plus its head comment at `Collection.svelte:2-5` ("the References page's for Code"), both in `src`. `git grep "Code view"` outside `src`: no hit.
- New `career` write:
  - `config/text/views/system/history.yml:41` (`kind_host`) is in the write list and needs a `kind_career` beside it.
  - `src/lib/state/system/apps/words.ts` and `src/lib/state/sessions/source/write-files.ts:152-174` switch on write kinds. They are in `src`. `write-files.ts` is what makes G28's refusal (a write over a file a tab holds unsaved) cover `career.yml`; the brief does not name it.
  - G8 and G9 in `guarded.md` list one test row per write kind, outside the write list (see section 4).
- `docs/palette.md` and `task-add`: no hit outside (the cockpit's `subtask-add` hits are a different name).

## 2. The step line

The D72 line (`plan.md:781`) has seven parts. Each is mapped below to the brief's "What to build".

- (1) Page per entry, opened from its card's title, folder blocks only when `link` names a folder: item 1, cases 1 and 2. Present.
- (2) Editor from the file's `schema:`, its sections, a widget per field under label and help, Save posting only what changed, unsaved edits kept and asked about on close: item 2. Present.
- (3) Add asks the key, writes `new-entry` and opens the page in its editor; Delete on the card menu and the page toolbar asks first, writes `delete-entry`, undoable: items 3 and 4. Present.
- (4) Pillars, domains, venues, data and statements, by ruling 72: items 1 to 5. Present. However:
  - **Finding (rule clash):** the brief makes `name` the read-only venue field (item 2, decision 1, case "The editor of a venue: `name` read-only"). Z854 (`plan.md:1877`, booked in `choices.md:4020` and `orchestrator-history.md:10`) chose (a): `id` read-only and `name` editable, since `venue_id` names a venue by `id` and `entryId` (`src/lib/server/files/fs/collections.ts:75`) addresses a venue by `id`. The brief never cites Z854.
  - Z854 also reverses the literal words of Axel's ruling 72. The state file's automode demand leaves "a reversal of a ruling Axel gave" open for Axel. Either the brief follows Z854, or the point goes to Axel as an open item. It cannot stand as written.
  - Ruling 72's "naming each of them": see item 5 below.
- (5) People, organisations, resources and career, by ruling 73: items 5, 6 and 7. Present. However:
  - **Finding (internal conflict):** item 1 says every entry's page, people included, is "the `entry` view". Item 6 says "The Person page becomes the person's page", and the `person` view (`Person.svelte:7`, opened from `CardLinks.svelte:110`, `EntryCard.svelte:269` and `node-view.ts:13`) is a separate view id. The brief does not say which view a person's page is. If `person` is dropped, saved layouts holding `person` tabs show as unknown (no migration code is allowed), and that has to be stated.
- (6) Leads and radar, by ruling 74: items 4 and 8. Present. However:
  - **Finding (false premise):** item 8 keeps "the lead form's `lead-add`". No lead form exists. Z722 (1) removed the Leads add form and `addLead`. The Leads Add is the source-tab Add: `Leads.svelte:33,119` call `addInFile`, and `grep -rn "addLead\|lead-add" src/lib/state src/lib/views` finds no caller.
  - **Finding (gap):** item 3 says every Add writes `new-entry`, which cannot write a feed. The brief names no write for a feed's Add: `lead-add` (`addLead`, which refuses an empty or held title) or `radar-add` (`addRadarEntry`, with its bucket check and `found` date; `url` and `bucket` are `required` in `feeds/literature-radar.yml:18-19`).
- (7) `:task-add` and the palette page, by ruling 75: items 9 and 10. Present. Every clause of ruling 75 is carried: title, `status: todo`, the key rule with `-2`/`-3`, undoable, the notice with Open, Shift+Enter, the empty title, the generated page with its contents, the landing comparison, and the HELP.md link.
- Ruling 71 (2), the reversal of Z343 for this editor: item 2. Present.
- Parts of the brief with no requirement on the step line:
  - Item 11's `code` placement removal. It is a D71 leftover; open item 69 is the ruling it rests on, and the brief should cite it.
  - The "`:goto` where `:goto` reaches entries today" clause. It is empty: `cmd_goto` is "Open a project in a tab" (`config/text/app.yml:48`) and reaches no entries.
  - Decisions 2, 3 and 8. They are derived and named as decisions.

## 3. Premises

Each line gives the brief's premise, the command run, and the result.

- No ADR folder. `ls tools/oculus/docs/adr docs/adr`: "No such file or directory" for both. Holds.
- Collections at `config/sources.yml:54-65`, 11 keys. `grep -n 'collections:\|_file:' config/sources.yml`: 54 to 65. Holds. The hub repeats the list whole at `.oculus/config/sources.yml:59-70`. Holds.
- `*_file` keys at `config/sources.yml:44-50`. Lines 44, 47 and 50. Holds.
- "The demo hub `tools/oculus/demo/` has no `.oculus/config/`". **False.** `git ls-files tools/oculus/demo/.oculus` gives `config/behavior.yml` and `config/catalogs/vocab.yml`. The conclusion still holds: there is no `sources.yml` there, so the engine's list is used. The sentence needs rewording.
  - The demo also holds `CAREER.yml` at its top, not `registries/career.yml`, so the demo has no career file at the configured path.
- `grep -c '^schema:'` gives 1 for each of the 17 files. Holds (rerun over all 17).
- Identity fields. A python read of each schema's first field: `name` for venues, `title` for both feeds and for career, `key` for the rest. Holds. `identityFieldOf` is at `validate.ts:236`. Holds. `KEYED_FIELDS` is at `collection-text.ts:30`. Holds. `createEntry` is at `entries.ts:388-503`. Holds.
- Type counts "text 106, textarea 23, tags 22, select 21, date 9, records 7, metalist 5, checkbox 3". Reproduced only over all 17 files (the 11, people, organisations, resources, career and both feeds), not over "the collection files": over the 11 alone it is text 69, textarea 15, tags 15, select 14, date 7, metalist 5, records 1, checkbox 1. The wording needs correcting. `records` is at `data.yml:35` plus `career.yml:8,13,20,31,37,44`. Holds.
- **Missing premise:** a records field is a map in most real cases.
  - All 54 `retrieval` values in `data.yml` are maps: python `Counter(type(e['retrieval']))` gives `{'dict': 54}`.
  - In `career.yml`, `situation` is a map of scalars (`open: true`, `fields: []`) and `eligibility` is one map. `record.ts:12` says "A `records` field holds a list of records, one record, or with `map: true` a map".
- `Editor.svelte` is 348 lines and draws readonly, checkbox, select, chips/tags, textarea/lines, date and keymap (`grep -n "field.type ===" Editor.svelte`: lines 186 to 233). Holds. `draft.ts:7-22` records as cards. Holds (lines 7-9, with lines 15-16 keeping unnamed keys "as the file has them and sent back unchanged", so they are not editable).
- `schema.ts` is 428 lines and `manifest-draft.ts` exists (133 lines). Holds.
- Server writes. `writeEntry` at `entries.ts:218`, `removeEntry` at 356, `createEntry` at 388: holds. Undo at `undo.ts:226-231, 519-523`: holds. Client only `writeEntry` at `writes.svelte.ts:341`: holds. Bookmarks at `fs.svelte.ts:835-837`: holds.
  - **Missing premise:** `new-entry` routes to `homeOf(into)`, the primary or else the first hub (`writes.ts:496-509`, `hubs.ts:160`). `delete-entry` and `entry` route through `routedEntry`. So an Add on a merged card list never writes a second hub.
- Feed routes at `writes.ts:547-612` and `FEED_RULES` at `feeds.ts:45-49`. Holds.
  - `writeFeedField` writes one field per call and does no type check against the schema (`feeds.ts:648-685`). `lead-add` and `radar-add` route to `homeOf` with no `root`.
- "Add today ... used by `AddButton.svelte` and `RegistryTools.svelte`". Inexact. `addInFile` is called from `Collection.svelte:173`, `Leads.svelte:119` and `registry-file.svelte.ts:90`; `AddButton` is the button only. Leads is missing from the list.
- `Entry.svelte` 314 lines, `pageFolder` at `collection.ts:338`, `pageState` at 351, `crossLinks` at 604. Holds.
- Record view paths: all exist (`ls`). `Person.svelte` 302 lines, `CareerPanel.svelte` 488 lines, `writeHost` at `writes.svelte.ts:384`. Holds. The server's `writeHost` is in `writes/subtasks.ts:234`.
- `Collection.svelte:8-17` holds `code`. Holds (line 15).
- Rail pages "`config/layout.yml:88-89`". Only `references` is at 88-89. `academic` is at 84-85, `pillars` at 86-87 and `incoming` at 68 (`grep -n` over `layout.yml`). Correct the citation.
- Manifest reference fields at `manifest-schema.yml:46-81`. Holds. `no_key` at `findings.yml:202` and `check.ts:278`. Holds (the `enum` branch at 268-290).
- `commands()` at `palette.ts:447-548` with the names listed. Holds. HELP.md "The palette" at 63-69 and key rows at 134-138. Holds.
- Diagrams precedent. Holds. But `diagrams.mjs` parses source text and imports no `src` module (its imports are node built-ins and its own `.mjs` files).
  - Decision 7's generator "reads the palette's registry and the text catalog through the same modules the page reads". `palette.ts:39` imports `t` from `state/shared/words/text.ts`, which imports `generation.svelte.ts` and `glyphmode.svelte.ts` (runes). `palette-modes.ts:13-27` imports by `$lib` aliases.
  - A plain `node utils/docs/palette.mjs` cannot load these modules. **Finding:** the brief names no loading route (for example Vite's own module loader, already a dependency).
- `slug()` at `presets.ts:306`. Holds.
- `tasks/tasks.yml` holds uncommitted edits. `git diff --stat -- tasks/tasks.yml` gives "7 insertions(+), 20 deletions(-)". In the working tree, `entries:` now holds only comments (python `yaml.safe_load` gives `entries: None`). This is a live input of `:task-add` that no case covers (section 6).
- Not stated by the brief and needed:
  - **Finding:** `utils/` already holds 10 tracked items (`git ls-tree --name-only HEAD tools/oculus/utils/ | wc -l` gives 10). Adding `utils/docs/` makes 11, which `utils/folder-check.sh` refuses (spec.md, "At most ten tracked items"). Decision 7's path breaks the rule.
  - Other folders already at 10 that the step will probably add to (same command): `server/edit/writes`, `server/edit`, `state/boards`, `state/client`, `state/workbench`, `views/shared`, `views/shared/forms`, `views/sources`.
  - **Finding:** `Editor.svelte` is a view (`id: 'editor'`, `Editor.svelte:5`). The view boundary ("views/ imports no other view", `tests/checks/tree/boundaries.test.ts:319-327`) forbids `views/boards/entry`, `views/boards/person` and `views/boards/focus` from importing it. The editor form has to move under `views/shared/` (10 items), and the brief's "the step extends `Editor.svelte`" does not say so.
  - Sizes: `Palette.svelte` is 526 lines, already over 520. `EntryCard.svelte` is 518. `writes.ts` and `writes.svelte.ts` are 779 each. `palette.ts` is 723. `feeds.ts` is 716. `collection.ts` is 712 (`wc -l`). The step's changes to the first two force splits. The brief does not name them.
  - spec.md has the brief name a base copy and the base `unused-exports` lines. The brief names neither (they may be added at worktree creation; the session should confirm).

## 4. Cases and checks

- "The editor of a venue: `name` read-only; editing `rank`...". Two problems:
  - It contradicts Z854 (section 2).
  - `rank` is no field of `registries/venues.yml`. The schema fields are name, id, short, category, jif, quartile, tier, wos, scopus, format, free, wants, themes, link, timing, deadline, deadline_month, held_month, call and email, and `grep -c rank registries/venues.yml` gives 0. **Finding.**
- "Add on Venues ... refused with 'a new entry needs a non-empty id'" and "refused with the existing sentence ('two entries share the ...')". Items 2 and 3 also say the server's reason is shown. These sentences are English literals in `entries.ts:190,412`. spec.md ("An error from the engine or a library is mapped to a catalog line before it is shown") is inconsistent with showing them raw. The tree already shows them raw (`writes.svelte.ts:166`), so the brief either maps them or names the departure. **Finding.**
- "`npm run docs:palette` run twice ...; a colon command added to `commands()` without regenerating makes the palette page check fail". As worded, this asks the builder to change `commands()` to watch the check go red. spec.md bans that ("Code is never deliberately broken to see whether a test catches it"). It can only be a test over a fixture registry handed to the generator. **Finding.**
- Test rule (spec.md, "A test exists only as the test of one entry of `agents/guarded.md`... A step that needs a new entry stops and asks"):
  - The brief names no guarded entry.
  - `tests/checks/docs/palette.test.ts` has none: G25 names only the diagrams.
  - The new `career` write kind and the widened `FEED_RULES` need rows under G8/G9 (`tests/server/edit/feeds.test.ts`, `tests/server/core/changes.test.ts`, `tests/routes/edit/undo/undo.test.ts`).
  - The generalised draft falls under G28 (`tests/state/forms/manifest-draft.test.ts`).
  - Without the entries ruled before dispatch (as Z853 did for D71), the builder must stop at its first test. **Finding.**
- Cases that check places the step does not change:
  - "A select field ... refused by the server" (the existing `typeRefusals` of `writeEntry`).
  - "two entries of one identity ... refused" (the existing `duplicate()`).
  - Both are read through the new editor, so they are acceptable.
- No other case is inconsistent with the rules file. The DOM cases (reload, close question, Shift+Enter, notice) go to the look by spec.md; the brief's case list does not say so, but spec.md covers it.

## 5. The question

The step line has no check of its own; the brief's verify list stands for it. Each item, then each case:

- Item 1: could pass without the goal. A person's page could be the old `person` view or the `entry` view, and the brief allows both.
- Item 2: could pass without the goal.
  - Records are tested only as cards on `data.yml`'s `retrieval`, which is one map. An editor that rewrites it as a list, or that cannot edit career's `situation` (`open: true` with `fields: []`, every key unnamed and, under the "as the Settings editors draw records" rule, not editable), passes every case.
  - Identity read-only passes for venues while `id`, the referenced field, stays editable.
- Item 3: could pass without the goal. Every case is on the primary hub. An Add on a merged card list holding a second hub's collection writes the primary (`homeOf`), and no case covers it.
  - Feed Add has no stated write, so it passes with any behaviour.
- Item 4: could pass without ruling 72's "naming each of them".
  - A person's referrers come from the Person page's joins (`state/boards/person.ts:1-3`: joint work and `collaborators`). These miss projects whose `waiting-on` names the person (`manifest-schema.yml:59`, `from: [people, projects]`).
  - A resource named by `slurm.resource` in `behavior.yml` (the hub's `utwente`) is named by no question.
- Item 5: the same gap for people.
- Item 6: tested on fixtures. The real hub gains the three collections only at landing, which the brief states.
- Item 7: the one case changes `milestone`, a text field. It passes with records sections that do not save: situation's labels, a host's open score columns, and eligibility's single map.
- Item 8: the case changes one field (`fit`). Save of two changed fields of a feed entry is two `feed-field` writes (one field per write, `feeds.ts:648`). A partial refusal is untested.
- Item 9: covered except a workspace with no primary hub, where `homeOf` takes the first hub, and a title racing a clash written meanwhile.
- Item 10: "never from a hand list" is not reached by the comparison check: a generator with a hand list also regenerates identically. Only the reviewer's reading guards it.
- Item 11: no gap beyond section 1's misses (hub comments, `options.yml`, G28).
- Cases:
  - Venue case: passes without the goal (Z854).
  - Dataset case: passes while the folded `notes: >` scalar inside `retrieval` is re-rendered in another style, since the whole field is rewritten as a `BlockMap` (`yaml-values.ts:25-31`). The case should say the untouched sub-fields keep their text.
  - Add on Tasks with `review-x`: passes while the new entry lacks the required `title` and `status` (`tasks.yml` schema `required: true`), which then gives `required` findings. The case does not say what is expected.
  - Pillar Delete: sound.
  - Lead page: sound once the status control is checked at the look.
  - The rest pass only if the goal is reached.

## 6. Implied inputs

None of the following is under "Cases" except where it says so.

- A collection of a second hub, Add on the merged card list. Expected: the brief must state where it writes. Today `new-entry` writes the primary hub; the case under "Cases" covers pages and editors only.
- A file whose `entries:` holds nothing. This exists now: the hub's `tasks/tasks.yml`, working tree, has `entries:` followed only by comments. Expected: the entry is written under `entries:`, the comments are kept, and the reparse is checked (`entryPlace`, `collection-text.ts:178-210`). `:task-add` succeeds on it.
- An identity with odd characters:
  - A lead or radar title with `:`, quotes or `#`.
  - A key starting with a workspace hub's key and a colon (`splitHubId`, `hub-names.ts:53-61`, routes it to that hub).
  - Expected: the page opens and the writes address that entry in its own hub. Add refuses a key that `splitHubId` would read as another hub's.
- A records field holding a map: `data.yml` `retrieval` (all 54), career `situation` (a map of scalars) and `eligibility` (one record). Expected: a single-record field is drawn as one card with no add or remove and saved as a map; `situation` is drawn as label and value rows with add and remove, and saved as a map.
- An `open: true` records field: career `hosts` (score columns) and `situation`. Expected: unnamed keys are drawn and editable as label and value rows, and kept on Save. The Settings rule (kept, not editable) leaves `situation` uneditable.
- A write racing a file change. The entry write carries no base (`bodies.ts:228-232`). Expected: Save posts only changed fields, so a field another writer changed and the editor did not is kept, and an edited field overwrites. An unsaved edit survives a change of the file on disk (G28).
- A source tab holding unsaved text of the collection file, or of `career.yml`, while the editor saves, adds or deletes. Expected: refused before sending and the edit kept (G28; `write-files.ts` must list the `career` kind).
- A feed entry in another hub, Add and Delete. `feed-delete` takes `root`; `lead-add` and `radar-add` do not. Expected: Delete writes that hub, and Add writes the primary (or is not offered on a second hub's entries). State which.
- Two feed entries of one title. Feed writes have no duplicate refusal and address the first. Expected: refused as for collections, or stated.
- Add on a collection with required fields beyond the identity: tasks `title` and `status`, joint-work `person`, radar `url` and `bucket`. Expected: Add writes the identity, the page's editor opens on the new entry, and the `required` findings show until filled. Otherwise Add asks for the required fields. State which.
- A person referred to only by a project's `waiting-on`. Expected: Delete's question names the project.
- A resource named by `behavior.yml`'s `slurm.resource`. Expected: Delete's question names it, or the brief states that config references are not referrers.
- A workspace with no primary hub. Expected for `:task-add`: the first hub's tasks collection (`homeOf`), or nothing written with a sentence. State which.
- A long title for `:task-add`. Expected: a key length cap (the server's `slugOf` caps at 80) or none, stated.
- A saved layout holding `person` tabs, if the person page is folded into `entry`. Expected: shown as unknown (no migration), stated.
- The entry page open when its entry is deleted from its own toolbar, then Undo. Expected: the page says no entry, then shows the entry again after Undo. Partly covered by item 1's "no longer exists".

## 7. ADRs

`ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" for both. `find . -type d -name adr -not -path '*/node_modules/*' -not -path './.agents/worktrees/*'` finds none, and the only `NNNN-*.md` files in the repository are Jekyll gem fixtures under `side-projects/theaxec.github.io/vendor/`. No ADR exists, so none touches the step.

## 8. Dictated text

Each dictated line was found with `grep -n '{ key: people\|non-empty id\|two entries share\|kind: .career\|utils/docs\|review-the-raw-pls\|`rank`\|lead form' D72.md`. `LC_ALL=C grep -n '[^ -~]' D72.md` prints nothing, so the brief is ASCII throughout.

- `D72.md:35-39`, the rulings 71 to 75 in quotation marks: quotations of Axel's rulings, not text for a file.
- `D72.md:48`, `{ key: people, file: registries/people.yml }` and the two like it: holds against the rules file (one line of YAML). Its form differs from the lines it joins, which quote the path and align the columns (`  - { key: data,           file: "registries/data.yml" }`, `config/sources.yml:55`). The engine file and the hub's "Doc text" should use the file's own form.
- `D72.md:74`, "a new entry needs a non-empty id": a quotation of the existing server sentence (`entries.ts:412`). Showing it to the reader breaks spec.md's catalog rule (section 4).
- `D72.md:92`, "two entries share the ...": the same rule as line 74. It is also truncated with "...".
- `D72.md:131`, `{ kind: 'career', fields }`: a wire format, named as decision 5. Holds.
- `D72.md:60,109,133`, `utils/docs/palette.mjs` and `tools/oculus/utils/docs/`: break spec.md's ten-item folder rule (`utils/` holds 10 items).
- `D72.md:84`, `review-the-raw-pls-rebuttal`: holds.
- `D72.md:70`, `rank`: names no schema field (section 4).
- `D72.md:50`, "the lead form's `lead-add`": names a control that does not exist (Z722).
- The palette's sentences at `D72.md:86,87,89` are content, not dictated words, and go through catalog strings. Holds.

## Declined to judge

- Whether Z854 was within automode's bounds or is a reversal that belongs to Axel. The state file's automode exclusions point to Axel; the session decides.
- Which view a person's page should be (`person` or `entry`).
- Which write a feed's Add should use.
- Whether Add should ask for the required fields. These are design choices for the session or Axel.
- Whether a Node-only loader for the palette generator is feasible without a new dependency. I did not run any loader.

Agent usage: a8e7f3738fcbe9974, claude-opus-5-5, 244,227 tokens, 106 tool uses, 11.7 min.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- The venue's read-only field against Z854: the brief keeps `name` read-only as Axel ruled and makes `id` read-only too (item 2, decisions 1 and 2, the venue case); Z854's editable `name` reverses his ruling, so Z859 replaces it and open item 82 asks Axel whether `name` becomes editable.
- The person's page, `person` or `entry`: decision 9 keeps the `person` view as a person's page (item 1, item 6), so no saved tab changes.
- No lead form: item 8 no longer names one; "What is on the tree" says the Leads Add is the source-tab Add, which item 3 replaces.
- No write named for a feed's Add: item 3 names `lead-add` for a lead and `radar-add` for a paper, the paper's Add asking title, address and bucket (decision 2); cases added for both.
- `:goto` reaching entries: the clause is removed from item 1.
- The `code` placement's ruling: item 11 cites open item 69's ruling and names the head comment.
- G28's sentence, `draft-entry.ts`, the guarded entries of the new tests: the section "Guarded entries" (Z860) gives G8, G9, G25, G28 and G32 their words and rows; item 3 removes the part of `draft-entry.ts` only the source-tab Add used.
- The hub's comments made false (`.oculus/config/sources.yml:58`, `funding/funding.yml:1`, `network/events.yml:1`): item 11 and the report's "Doc text" give them to the orchestrator for landing.
- `options.yml`'s people_file help ("the Person view"): stays true under decision 9; no change.
- The two `slugOf`: item 11 makes the three rules one shared helper with a length argument; "What is on the tree" names them.
- The `career` kind in `write-files.ts` and History: item 2 and item 7 name both.
- The demo sentence: rewritten (its `.oculus/config/` holds no `sources.yml`).
- The type counts: reworded as counts over the 17 files with a schema.
- Records held as a map: "What is on the tree" states the three shapes; item 2 draws and saves each; the dataset and career cases test them.
- `new-entry` writes the primary: stated in "What is on the tree", item 3 and decision 10; a case covers a merged card list.
- `addInFile`'s callers and the rail lines: corrected.
- The palette generator's loading: item 10 and decision 7 put the page function in `src/lib/shell/keys/` and load it through Vite's server module loading.
- `utils/docs/` breaking the folder limit: the generator is `utils/diagrams/palette.mjs` and its test in `tests/checks/diagrams/`; the folder and size limits and the files over them are stated, with the folder and size checks added to "Verify before you report".
- `Editor.svelte` across the view boundary: item 2 moves the editor form to a shared component under `views/shared/forms/entry/`.
- The base copy and the unused-exports lines: "What is on the tree" names the base copy; "Verify before you report" compares `unused-exports.sh` with the base.
- `rank`: the venue case edits `short`.
- Server sentences shown raw: item 2 says the editor shows a refusal as every write's refusal is shown today (`tell`); the cases name the refusal instead of quoting it.
- The breakage case of the palette check: rewritten to test the page function over a small registry given to it, never by changing the real registry.
- `waiting-on` and `slurm.resource` referrers: item 5 adds both; two cases added.
- The single-field career and feed cases: career cases for `situation`, host score columns and `eligibility`; the lead case changes two fields and expects two `feed-field` writes.
- Implied inputs: cases added for the comment-only `entries:`, a key read as another hub's, the merged card list, a source tab with unsaved text of `career.yml`, a feed entry of a second hub, two feed entries of one title, the 200-character title, a deleted page and its Undo; item 2 says only changed fields are posted, so a field another writer changed stays.
- The dictated `collections:` line form: item 6 now asks for the list's own form (quoted path, aligned columns) instead of dictating the line.
- Dictated line added after the check, "The committed diagrams and the palette page match the source they are drawn from." (`grep -n "palette page match" agents/briefs/D72.md`): holds against spec.md (ASCII, plain, one sentence, no history).
- Dictated words added after the check, "the file editor (Edit in File opens the file at the entry and puts no text), the entry editor and the career editor" (`grep -n "the entry editor and the career editor" agents/briefs/D72.md`): holds; it replaces G28's clause and keeps its form.
