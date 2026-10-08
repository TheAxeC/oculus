# M6 premise recheck on main at 3bf3bf4c6. Every check below was run in this session; nothing was changed.

Seven findings change what M6 builds, beyond line numbers that moved:
- `lead-add` is now a write kind that apps may send (E4).
- The shared-identity finding already exists (`checkEntryIdentity`).
- The tree already has a way to retire a write kind (`RETIRED_KINDS`, which `deck` uses).
- D23c already added `column` to the source tab and to `SourceFile`. A column now selects the word at it.
- HELP.md was cut to an index (Q125/Q126). The sentences the brief edits now live in the `docs/` guides.
- M8 is ready at the same time and shares about ten paths with M6.
- The brief's Cases and Verify sections still ask for breakage testing.

# 0. Main's head and the commits since the brief

- `git rev-parse HEAD`: `3bf3bf4c6876e35dd3a198d65892c2f27c719053`.
- `git log --oneline 273196959..HEAD -- tools/oculus/src tools/oculus/config tools/oculus/docs tools/oculus/DESIGN.md tools/oculus/HELP.md | wc -l`: 29 commits, newest first:
  - 3bf3bf4c6 D28; 1ae5e7c8d X3e; d098915b5 / c88b76443 D11.
  - 0d440a6ef, a84214dad, d5d7f727b (D15, PDF).
  - 0753a5e76 D45; 639820b91 D23b; eede45985 PR4; c0a4af9c1 D23c; a29014904 PR3.
  - 6561f82ae Q126; 797e1e5dc D23; e7952e163 Q125; 548004bcc; abf4356cf Q124.
  - 4ce24363b O30b; c86f10f2f E4g; 687cd1d5c PR1; 02ac124ec Q123; 10ac00c69 E4; 09509b5b6 A3; 3cb170eae O30.
  - 61f253977; d7ff5fd3d D44; 8aa491caa; 722a287a7 D20; 5b4e737a8 D38.
- `git log --oneline 88431d114..HEAD | wc -l`: 193 commits since the brief's base 88431d114 (2026-10-05 14:03).
- Every step the brief waits for has landed: D20, D38, X3e and D28 (log above).
- The queue (`queue.md:3-9`):
  - "Ready to prepare, in queue order: M6, M8 ... and D33".
  - "In flight (0 of 6 slots): none".
  - M7 runs after M6.
- ADRs: `ls docs/adr` in tools/oculus prints "No such file or directory", and `.agents/plan.yaml` names no `adr` key. No ADR governs M6.

# 1. Premises

Authority and plan:
- **Plan line numbers. Moved.**
  - `grep -n "^- M6 " plan.md` prints 236; the brief says 228.
  - `grep -n "^- Z340 \|^- Z343 \|^- Z436 \|^- Z550 " plan.md` prints 1141, 1146, 1239, 1339. The brief says 1067, 1072, 1165, 1265.
  - `grep -n "^- Z343," orchestrator-history.md` prints 286; the brief says 175.
  - The rulings' text holds. Z550 (`plan.md:1339`) rules four choices: Add writes the first field, the key, the required fields and status; `applied` sets the lead and opens Applications; the bookmark form goes; a finding for an empty or shared identity.
- **Brief line 3, "`ls docs` prints only `diagrams`". False.**
  - `ls docs` in tools/oculus prints apps.md, configuration.md, debugging.md, diagrams, files-and-search.md, source-control.md, terminals.md, views.md, window.md.
  - These guides came with Q125/Q126.
- **"after D20, D38, X3e and D28". Holds; all landed (git log).**

Premise 1 (the importers of EntryForm):
- **Moved.** Command: `grep -rn EntryForm src tests config HELP.md DESIGN.md README.md docs --exclude=local.yml`.
- Moved importers:
  - `Collection.svelte:76,292` (brief :75,283).
  - `EntryCard.svelte:36,405` (brief :35,398).
- Importers that hold:
  - `VenueCard.svelte:18,219`; `DatasetCard.svelte:25,167`.
  - `RegistryCard.svelte:12,68`; `RegistryHead.svelte:12,48`.
  - `Leads.svelte:36,217`, with `onadd={addLead}` at `:221`.
  - `Linkedin.svelte:33,169`, with its inline schema at `:75`.
  - `BookmarkForm.svelte:14,57`.
- DESIGN.md:
  - Now one hit: `DESIGN.md:507` ("it renders `shared/forms/EntryForm.svelte` with `surface={false}`").
  - The brief's `:394` and `:428` are gone.
  - The "form is answered about the entry" bullet is now `DESIGN.md:567`. It no longer carries a sentence about the shared-identity refusal (`sed -n 567p DESIGN.md`).
- No test imports EntryForm.

Premise 2 (the bookmarks file cannot be opened in the source editor):
- **Holds; lines moved.**
  - `BOOKMARK_COLLECTION` is at `fs.svelte.ts:152` (brief :155).
  - The `bookmarks` local.yml key is at `options.yml:1260-1262` (brief :1197-1199). It still says "Without it the file is ~/.oculus/bookmarks.yml".
  - `browserRoots` is at `roots.ts:23-35`, ending `return [...fixed, ...addedRoots(fixed, saved)];`.
  - `collectionFile` is now `server/files/fs/collections.ts:30` (D20).
- `ls ~/.oculus` shows bookmarks.yml, changes.jsonl and connect, as the brief says.

Premise 3 (feeds, `lead-add`, `linkedin-idea`):
- **Moved.**
  - `grep -n "export function addLinkedinIdea\|export function addLead\|export function addRadarEntry" src/lib/server/edit/feeds.ts` prints 227, 330, 448. The brief says 222 and 325.
  - addLead's date default is at `:369-370`; the status default `'open'` is at `:372`.
  - In writes.ts the lead-add branch is `:492-497` and linkedin-idea is `:514-524` (brief :446-452, :454-464).
  - `leads_file` is `config/sources.yml:69` (brief :65); `linkedin_dir` is `:79` (brief :75).
- **False now, with a consequence: "lead-add ... a write kind no page sends".** E4 made it an app write kind:
  - `src/lib/data/helpers/files/apps.ts:115` (`OPEN_WRITES`).
  - `src/lib/server/edit/writes/app-gate.ts:34,75`.
  - `src/lib/state/system/apps/words.ts:42`.
  - `config/text/views/apps/apps.yml:53` ("Add a lead.").
  - `docs/apps.md:427` (the open-kinds table) and `:508` ("the leads feed is not on this hub").
  - `tests/state/system/apps/methods.test.ts:279,290`, a G49 table row that uses `lead-add` as an undeclared kind.
  - `DESIGN.md:388` lists it among the open kinds next to `radar-add`.
  - `git cat-file -e 88431d114:tools/oculus/src/lib/data/helpers/files/apps.ts` fails: the file did not exist at the brief's base.
  - `git log -S"'lead-add'," -- .../apps.ts .../app-gate.ts` prints `10ac00c69 Land E4`.

Premise 4 (the save has no base hash):
- **False now; D28 built it.**
  - The store is `state/sessions/source/` (autosave.svelte.ts 173, disk.svelte.ts 199, draft.ts 343, source.svelte.ts 717; `wc -l`). The old `state/sessions/source.svelte.ts` is missing.
  - `performSave` (`source.svelte.ts:554-600`) sends `base`, refuses readonly, truncated and `notText`, and turns a tab with disk `changed` and no base into the conflict.
  - The draft API now:
    - `loadSourceDraft` `:254`; `editSourceDraft(id, text, edits?)` `:429`; `onEdit` `:437`.
    - `reloadSource` `:382`, with the `instanceState(id) === undefined` check at `:387`.
    - `saveSourceDraft` `:535`.
  - Autosave listens through `source.onEdit` (`autosave.svelte.ts:117`). Its head comment says a tab "marked changed ... wait[s] for the reader to save, overwrite or revert".
  - The source store's test is `tests/state/sessions/source.test.ts`, beside `source-disk.client.test.ts` and `autosave.client.test.ts` (`ls tests/state/sessions/`).

Premise 5 (`Source.svelte` is 528 lines):
- **False now.** `wc -l` prints 478; D28 split it, and the parts are under `views/sources/source/` (status/, save/, actions/, language/, latex/, SourceBody.svelte).

Premise 6 (no schema default):
- **Holds.** `grep -c 'default:'` prints 0 for each of the 13 files.
- `SchemaField` is at `model-collections.ts:29-40` with `optionsFrom`.
- M8 (ruling Z672) will rename `options_from` to `from` and add `required: { when }`.

Premise 7 (documents made false; D20's file):
- **Moved.**
  - `config/sources.yml` sentence: `grep -n "An entry is edited" config/sources.yml` prints 52 (brief 48). It is the last sentence of the collections comment line.
  - DATA-MAP lines: see the Paragraphs block below.
  - `REGISTRY_IDENTITY_FIELDS` is `writes/entries.ts:52`, used at `:234` and `:374` (brief :50, :379, :519).
  - `FIRST_LIST` is `:144`, used at `:451` (brief :233).
  - `collections.ts` exists: `collectionFile :30`, `identityField :49`, data `listOf :90` with `entryMapsShape :81` and `entryListShape :84`, `readCollection :115`. It still parses with the throwing `parse` (`:129`).

EntryForm and what it uses:
- **Moved: EntryForm and collection.ts.**
  - `wc -l` gives EntryForm.svelte 484 (brief 481); its imports are as listed.
  - `collection.ts` (806 lines), by `grep -n "export function ..."`: `identityField :395`, `identityValue :408`, `offeredStatuses :464`, `FormKind :592`, `FormField :596`, `kindShape :606`, `formFields :615`, `extraRawFields :634`, `clearedValue :655`, `refusedField :664`.
- **answer-words: holds, one more user.** It is imported by EntryForm, LeadCard, PostCard and, new, `views/feeds/literature/AddForm.svelte` (D38) (`grep -rln answer-words src`). It stays.
- **Moved: client writes.** `writes.svelte.ts` is 678 lines:
  - `writeEntry :295`, `reorderEntries :347`, `deleteEntry :352`, `writeFeedField :357`, `addLead :372`.
  - `addRadarEntry :377`, new from D38.
  - `addLinkedinIdea :382`, `newEntry :396`.
  - Types: `shapes.ts:244`, `:252`, `:253`, `:256`.
  - `newEntry` and `deleteEntry` callers outside writes.svelte.ts are EntryForm, entry-form.ts, lead-application.ts and Collection.svelte only (grep).
- **Moved: server kinds and undo.**
  - bodies.ts: `LeadAddWrite :90`, its zod shape `:276-278`, `leadAddWrite :459`.
  - undo.ts: the kind conditions `:151-156` and `:346-351`, which now include `radar-add` (D38). `feedUndo :358` (its doc says "The four feed writes"), with the `deleteFeedEntry` fallback as its last line. The import is `:29`. `collectionOf :87`, `collectionFor :110`, `valueNow :125`, `undoChange :221`, `'gone' :228`.
- **Moved: History.**
  - `kindOf` is `History.svelte:112-115`; it special-cases `deck`.
  - `t` throws at `text.ts:53`; `hasText :63` holds.
  - `history.kind_lead_add` is `history.yml:46`.
- **New since the brief: the tree has a way to retire a write kind.**
  - `tests/fixtures/kinds.ts` carries `RETIRED_KINDS = ['deck']`, which keeps the catalog word of a kind the log may hold.
  - `undo.ts:223` answers `{ error: 'deck-gone' }` for it.
  - The brief's `history.kind_other` plus `hasText` fallback would be a second way to do the same thing.
- **Holds: the change log.**
  - `grep -c 'lead-add' ~/.oculus/changes.jsonl` prints 0; `wc -l` prints 58 (brief 50).
  - One `radar-add` record is there.
- **Moved: the form state.**
  - `open-forms.ts` (28) is used by `collection.ts:29,83,100,124`, `venues.ts:7,21,157`, `lines.ts:14,25,26,32,33` and `datasets.ts:8,10,65`.
  - `leads.ts` adding is at `:33,66,187`; `linkedin.ts` at `:23,34,140`.
  - `CollectionState.lead` is at `collection.ts:92-95,108-110,127`.
  - In `context.ts`, formDrafts is at `:53`, `:195`, `:292`, `:307`, `:391-397` (fsForms), `:502` (registerUnsaved) and `:738`. The brief says 47-52, 150, 227, 241, 300-327, 342, 480.
  - `forms.ts` is 102 lines: `FilesForm :10`, `editShown :45`.
  - `files-view.ts`: `formShape :172`; the forms comment is at `:60`.
  - `fs.svelte.ts` is 879 lines, one under the 880 limit: `BookmarkForms :136`, `shiftForms :301` and `:873`, `closeGoneForms :662`.
- **Moved: the bookmark schema chain.**
  - `schemaFieldShape` and `bookmarksShape` are now in `state/sources/fs-transport.ts:231-246`, not in fs.svelte.ts.
  - `BookmarksState.schema` is `fs-transport.ts:61`; `NO_BOOKMARKS` is `:188`.
  - The schema is read at `fs.svelte.ts:643`.
  - `markSchemaFor` is `bookmark-rows.ts:100`; `markSchema` is `Files.svelte:252`, passed at `:323`.
  - The server side holds: `scaffoldSchema :75`, `BookmarksAnswer :88`, `readBookmarks :136-150`, SCAFFOLD's `schema:` at `bookmarks.ts:55`.
  - `grep -rln "markSchemaFor\|scaffoldSchema\|BookmarksAnswer" tests` prints nothing.
- **Moved: the lead-to-application flow.**
  - `lead-application.ts` (162): `applicationFromLead :65`, `holdsTyped :77`, `prefillFromLead :87`, `addFromLead :118`, `leadAddFor :135`, `closeAddForm :156`.
  - `Leads.svelte`: `toApplication :127`, `openBeside :128`, `to_application_replace :142`, the add toggle `:165-167`.
  - `leads.yml:6` and `:12` hold.
  - The applications `deadline` is a date (`applications.yml:16`).
  - Non-ISO lead deadlines: 9 (command as in the brief).
  - The leads now hold 50 entries (`grep -c "^  - title:"`), not 46.
- **Moved: the add and edit controls.**
  - `Collection.svelte`: AddButton `:244-247`; add EntryForm `:292-298`; `editing` and `onedit` `:328-331`; cards keyed by `entry.index` at `:315`; said line `:140`, `:302`.
  - `editAction` is `card.ts:127-135`, label `collection.form_edit_title` at `:130`.
  - Users of `editAction`: `RegistryCard:54`, `VenueCard:88`, `DatasetCard:68`.
  - EntryCard's own edit row is `:171-176` (`collection.edit_delete` at `:173`).
  - `AddButton.svelte` (28) holds as described.
- **Moved: the card.**
  - EntryCard.svelte is 509 lines: `addressable :122`, the actions `:152-191` with D20's `extra` at `:95`, `:112`, `:161`, `:191`, `setStatus :208`, the status Chip `:285-286`.
  - The `field` rows are around `:379-383`; the edit EntryForm is `:404-406`.
- **Moved: the shared-identity refusal.**
  - `duplicate(held)` is at `writes/entries.ts:208`, `:308`, `:338`, `:370` (grep).
  - `sharedIdentity :170`, `duplicate :182`, `typeRefusal :69`.
- **Holds: the catalog keys only EntryForm reads.**
  - A loop of `grep -rn "collection\.<key>\b" src` with EntryForm left out prints 0 for each of the 15 keys.
  - `form_cancel` is also read at `LeadCard.svelte:177`; `form_edit_title` at `card.ts:130`; `edit_delete` at `EntryCard.svelte:173`.
  - `settings.not_in_list` is now `workbench.yml:52` (brief :51); FieldControl reads it at `:126`, `:211`, `:222`, `:233`.
  - `files.menu_remove_bookmark` is now `files.yml:118` (brief :103), read at `tab-menu.ts:129` and `row-menu.ts:296`.
- **Holds: the tests that go.**
  - `tests/state/forms/form-drafts.test.ts`: G28's three titles at `:55`, `:63`, `:72`.
  - feeds.test.ts:
    - 'adds a lead in schema order...' is at `:134`.
    - The LinkedIn test is at `:82-87`, with its `toEqual` at `:87`. It is now tagged `{ tags: ['slow'] }`, so `npm test` leaves it out.
  - undo.test.ts: 'takes an added lead out again...' is at `:246-269`, its `lead-add` record at `:250`.
  - A new place reads `lead-add`: `tests/state/system/apps/methods.test.ts`.

The source editor:
- **Moved, and column already exists.**
  - `views/shared/links/source-file.ts` (67 lines) declares `SourceFile = ViewSource & { label?; line?; column? }`. Its comment: "The column means the word at it is selected".
  - `openSourceFile` calls `sourceTabState(root, path, line, column)` from `state/sessions/source/draft.ts:219`. `SourceTabState` holds `line` and `column` (`draft.ts:46-56`).
  - `openedAtShape` is in `views/sources/source/status/tab-state.ts:15`, not Source.svelte.
  - The go-to effect is `views/sources/source/Editor.svelte:176-192`. It runs once per `${line}:${column}` (`placed`). `column === 0` sends `goto`; otherwise it sends `{ kind: 'word', line, column }`.
  - `types.ts:78-79`: `goto` already takes `column?` and there is a `word` command.
  - `commands.ts:21-26`: goto with column. `:27-46`: `word` selects the word under the column, or places the caret when the column is on no word.
  - So "SourceFile and SourceTabState gain `column`" and "`goto` gains `column`" are done already. Only an `asked` nonce would be new. A column passed today selects a word; it does not place a bare caret.
  - `openOpened` holds at `opening.ts:134`, `:212`.
  - `keepPreview` is `layout/instances.ts:168`.
  - `stateId` is `instance.ts:132`.
  - `viewSourceFile` is `view-source.ts:59-69`.
- **Holds: the parent text replaced as one edit.** `ui/controls/editor/Editor.svelte` applies the parent's text "by the edits it was made by when the parent names them, and as one replacement otherwise" (`:352-365`), so `editSourceDraft(id, text, edits)` with the one insertion keeps the editor's undo exact.
- **Moved: yaml.** `package.json:110` `^2.9.0` (brief :90); `node -e "require('yaml/package.json').version"` prints 2.9.1.

YAML helpers and boundaries:
- **Holds.** `grep -rln "yaml-ranges" src tests utils` prints the same 5 files.
- **Holds.** `grep -rln renderScalar src tests` prints the 5 files.
- **Moved.** `lineAt :99`, `LIST :22`, `listOf :152` in lines.ts; entries.ts imports them at `:16`, `:20`, `:22`; subtasks.ts at `:22`, `:23`.
- **Holds.** `DEFAULT_INDENT` is `yaml-values.ts:32`, imported at `yaml-ranges.ts:10` and `yaml-edit.ts:45`.
- **Moved.** appendEntry is `entry-edit/entries.ts:179`, startEntries `:116`.
- **Moved and changed.** The views row of `ALLOWED` is now `boundaries.test.ts:204-211` and allows `data/prose/lsp-servers` and `data/prose/text-edits` beside `data/shapes/shapes`. The state row is `:212-241`. A view still may not import `data/helpers/files/*`.
- **False count.** `data/helpers/files/` holds 8 items (address, apps, languages, nesting, opens-in-program, paths, save-text, text-kind). D28 added only save-text.ts, and text-edits went to `data/prose/`. Two new files make 10, the limit.
- **Holds.** `views/shared/forms` holds 10 items and stays at 10. `sh utils/folder-check.sh` exits 0 on main.

The collection files:
- **Hold for 12 files.** Line counts, `schema:` line and list line from `wc -l` and `grep -n`: tasks 43/6/15, funding 157/5/20, events 109/5/19, applications 410/5/19, joint-work 109/8/19, venues 1060/14/36, data 1053/24/36 (`datasets:`), domains 55/3/8.
- **Moved for the leads.** `feeds/position-leads.yml` is now 564 lines, `schema:` :52, `entries:` :64, 50 entries. Its stub row becomes caret line 566, entries 50 to 51.
- **Holds: identities.** A node probe in the scratchpad (`ids.mjs`, read only, over the hub as it stands) prints `empty 0 dup []` for every file, venues' `id` included, leads 50.
- **Holds: the fourteen hub comment lines.** The comment grep prints the same fourteen lines in twelve files, plus `data.yml:572`.

How writes are guarded:
- **Holds: G1, G8, G9, G28 as quoted.**
  - G8's Code line now also names `server/files/source.ts` and `file-bytes.ts` (D28).
  - G28's Code names `src/lib/state/forms/` and the three form-drafts titles, and now carries the source drafts' table.
  - G49 covers `methods.test.ts`.
  - G56 (M8, unwritten) covers "a key that exists twice in the referenced file".
- **Moved: `writeAtomic`.** `typeRefusal` is `writes/entries.ts:69`; the date regex is at `:61`.

Paragraphs and head comments:
- **HELP.md lines: false.** HELP.md is 185 lines, an index (`wc -l`). The sentences the brief lists moved to the guides:
  - The unsaved-text paragraph (old `:97`) is `docs/window.md:66`.
  - The Bookmarks add control (old `:121`) is `docs/files-and-search.md:25`.
  - The leads' `applied` (old `:132`) is `docs/views.md:137`.
  - A view's own file control (old `:158`) is `docs/views.md:243`.
  - The change log list (old `:303`) is `docs/configuration.md:65`. It says "the feeds" and "the two LinkedIn writes", which is still true after M6.
  - The collection and registry view rows of the guide (`docs/views.md:27-109`) name no form.
- **DESIGN.md lines: moved.**
  - `:61`: `forms/` among the state folders.
  - `:388`: the open kinds, with `lead-add` and `radar-add`.
  - `:455`: "each given up with the form told so".
  - `:507`: EntryForm with `surface={false}`.
  - `:519`: "The `applied` control, the Applications add form it fills ... are in `docs/views.md`".
  - `:550`: unsaved form input, naming form-drafts, open-forms and form-values.
  - `:552`: the Files view's open form and the bookmark it edits.
  - `:567`: "A form is answered about the entry the write made".
  - The browser-storage sentence (old `:151`) is gone: `grep -n "browser's storage" DESIGN.md` prints only `:519`.
- **DATA-MAP.md (hub root, 490 lines, `LC_ALL=C grep -c '[^ -~]'` prints 0): one line up from the brief.**
  - `:191` holds.
  - `:413` "The form's kinds are `FormKind` and `kindShape`".
  - `:424` raw "edited in the form as one line of JSON text".
  - `:427` rawFieldText / parseRawField.
  - `:437` label; `:440` required; `:441` help.
  - New: `:194` says "Two entries of one collection with the same identity value are a finding of `checkEntryIdentity`".
- **Moved: vocab.yml.** The dropdown sentence is `config/catalogs/vocab.yml:255` (brief 249).
- **Moved: server head comments.**
  - writes.ts `:185`, `:307` (brief 162, 268).
  - entry-edit/entries.ts `:36`.
  - render.ts `:23` (holds).
  - writes/entries.ts `:12`, `:19`, `:65`.
  - feeds.ts `:597` (the `addLead` mention; brief 398).
  - fs.ts `:8` (holds) and `:452` (brief 449).
  - collections.ts `:26` (the `collectionFile` doc: "edited by the same form").
- **Moved: instances.ts.** The comment is now `:315`: "a source draft, manifest edits and entry form drafts".
- **The form-comment grep now finds more files than the brief listed:**
  - `grep -rn -i -E "entry form|the form\b|add form|..." src/lib/... | grep comment | cut -d: -f1 | sort | uniq -c` lists 70 files.
  - The brief's list is a subset. The builder rereads the hits; most of the new ones name other forms (manifest editor, accounts, literature).

# 2. What landed steps changed under M6

- **D28, the source store and save.**
  - Add and Edit open through `openSourceFile(client, { root, path, line?, column? })`. The tab loads through `loadSourceDraft`, which tracks the file on the disk channel (`disk.track`).
  - A stub inserted with `editSourceDraft(id, text, edits?)` goes through D28's draft and save path:
    - it marks the tab unsaved;
    - it reaches autosave through `onEdit`;
    - a save sends `base`.
  - When the file changes on disk under an unsaved stub, the tab keeps its text and draws a changed line; autosave then does not save it.
  - The next Save is refused with "Failed to save" and Compare, Overwrite and Revert (`docs/files-and-search.md:67`).
  - An in-place status write on another card of the same file is exactly such a change, so the reader's Overwrite would throw away that in-place write. The brief's case 8 accepts this. Choice 5 asks whether to accept it.
  - The draft now also has `notText` and `disk: 'gone'`, which Add must answer as it answers readonly and truncated.
- **D23c and D23, the opening position.**
  - `column` already exists on `SourceFile` and the tab state. A column selects the word at it.
  - The go-to runs once per line:column, so pressing Edit twice on the same entry does not move the caret back. Choices 6 and 7.
- **E4, apps.** `lead-add` is a public app write kind (section 1, premise 3). Choices 1 and 2.
- **D38, Lit Watch.**
  - `radar-add` sits next to `lead-add` in writes.ts, bodies.ts and undo.ts.
  - `addRadarEntry` (`feeds.ts:448`) is separate from `addLead`, so no helper is shared.
  - Its undo uses `removeRadarEntry`. It adds the Literature AddForm, which is not EntryForm. Choice 8.
- **D20.**
  - `server/files/fs/collections.ts` holds the data `listOf` and `readCollection`.
  - EntryCard has `extra`.
  - `writes/entries.ts` was restructured; its line numbers are above.
- **X3e, bookmarks.**
  - Bookmark rows drag to reorder; the order is written to the bookmarks file.
  - The bookmarks file is watched (`docs/files-and-search.md:25`).
  - The bookmark form, the head's `+ bookmark` (`files.yml:4-5`) and the row's edit control (`Bookmarks.svelte:157-164`, `files.bookmark_edit`) are unchanged.
  - `addBookmark` and `removeBookmark` are `fs.svelte.ts:865-868`.
  - Renaming a bookmark through `writeEntry('bookmarks', id, { label })` fits as the brief says: `label` is SCAFFOLD's first field (`bookmarks.ts:56`).
- **S5.**
  - S5 built the Settings view's controls only. `FieldControl.svelte` (360 lines) marks a stray value with `settings.not_in_list`.
  - No in-place status, deadline or date control exists on any card (`grep -rn not_in_list src` hits only FieldControl). The brief's reading, the same `ui/` primitives in a new `InPlace.svelte`, holds.
- **Every user of EntryForm now:** the nine components of premise 1. No test imports it.
- **writes.ts and EntryCard.svelte:** the lines are in section 1.
- **`config/sources.yml:52`:** "An entry is edited in the card's form."
- **docs/DATA-MAP.md:** as above. `:194` already names the shared-identity finding.
- **Q30 (earlier), the identity finding already exists.**
  - `checkEntryIdentity`, `validate.ts:584-604`, wired at `:856`, with the key `findings.validate.identity_shared` ("two entries share the {0} {1}", `findings.yml:182`) over the 12 collections.
  - `findings.registries.entry_no_id` (`registries.ts:115`, `findings.yml:15`) covers an empty `id` or `key` of venues, datasets, pillars and domains.
  - Not covered: an empty first field in a non-registry collection, venues' `name` empty, venues' `id` shared, and the leads feed.
  - The comment on `sharedIdentity` (`writes/entries.ts:167`) already says "validate reports the same file".
  - Two empty values are counted as "shared" by `checkEntryIdentity` (it skips only null), while `duplicate` ignores `''`.
  - Section 8's two new keys would duplicate an existing check (G21). Choice 3.
- **M8, in preparation now and ready in the same queue.** It shares:
  - the 12 hub files' `schema:` blocks, next to M6's comment lines (for example `venues.yml:13` sits directly above `schema:` at `:14`);
  - `docs/DATA-MAP.md:413-441`, the schema-field table both rewrite;
  - `config/text/findings.yml`, `validate.ts` (M8 replaces `REFERENCES` with ajv; its case 27 is "A registry with a duplicated key: a finding naming the file and the key") and `vocab.yml`;
  - `SchemaField.optionsFrom`, renamed to `from`, and `required: { when }` (Z672). M6's stub rule reads both;
  - events' `role` gains `co-present` (M8 brief line 184).
  - Choice 4.
- **Worktree.** `.agents/plan.yaml` `worktree_paths` does not include the hub `docs/`. M6 writes `docs/DATA-MAP.md`, so its worktree adds `docs` to the sparse paths, as M8's does (M8 brief line 140).

# 3. Cases and verify against the rules

- **Breakage testing (banned by `agents/spec.md:62` and the global rule):**
  - Brief lines 266-267: "For each case kept as a test, the report names one small change to the code under test that the case must catch. The report quotes the test's failing line with that change made."
  - Line 273: "with the `feed-delete` undo branch (`feedUndo`'s restore) removed on a scratch copy, its failing line quoted".
  - Verify 7: "and with the `feed-delete` undo branch taken out on a scratch copy, its failing line quoted".
  - All three go. Quoting an edited test's failing line on the unchanged tree (spec.md:63) is allowed and stays.
- **Tests and guarded entries:** the brief adds no test.
  - Edited tests sit under G8 (the LinkedIn test, now slow) and G9 (the lead undo test).
  - If `lead-add` leaves the apps API, a third edit falls under G49: the `methods.test.ts:279,290` row uses `lead-add` as an undeclared kind and needs another kind.
  - If `lead-add` is retired, `tests/fixtures/kinds.ts` `RETIRED_KINDS` is a fixture edit (choice 2).
  - Section 8's check has no test and no guarded entry (`grep -rn "identity_shared\|checkEntryIdentity" tests` prints nothing). G14 is the gate, as the brief says.
  - A test for the identity rule would need Axel's yes for a new entry, or would come under M8's G56 if M8 lands first.
- **Verify commands:**
  - Verify 1 holds: `checks.sh` exists at `~/.claude/skills/land/templates/`; node v24.21.0 exists; the state file's verify list is `npm run test:quick` (`orchestrator-state.md:6-7`).
  - Verify 2:
    - Every file exists.
    - The source store's test is `tests/state/sessions/source.test.ts`; add `source-disk.client.test.ts` and `autosave.client.test.ts` if the step touches the store.
    - `feeds.test.ts` holds slow-tagged tests; running the file alone runs them, which spec.md:56 allows.
    - Add `tests/state/system/apps/methods.test.ts` if choice 1 is (a).
  - Verify 3's counts are now 60 and 24, from the two greps with `| wc -l`:
    - 60: one more from `state/system/apps/words.ts`.
    - 24: plus `app-gate.ts` 2, `apps.yml` 1, `methods.test.ts` 2.
    - `data/helpers/files/apps.ts:115` and `docs/apps.md` are outside both greps.
  - Verify 4 asks for a node run over "the nine real files". `agents/spec.md:37` allows only four named tests to read the real hub. The run is pointed at the worktree's copies of those files.
  - Verify 5:
    - `validate.ts` is 863 lines (880 limit), so section 8's code cannot go there.
    - `fs.svelte.ts` is 879 lines, one under the limit; M6 only removes from it.
    - `npm run diagrams`, `utils/unused-exports.sh` and `utils/folder-check.sh` exist.
  - "The builder's first task is the first run of every case on the unchanged tree": allowed.

# 4. Choices

1. **`lead-add` now that apps may send it.** User-visible shape: the public apps API in `docs/apps.md:427`.
   - (a) Recommended: the Leads view stops sending it. EntryForm and the client `addLead` go. The server kind, body, undo, app gate, `OPEN_WRITES` and `history.kind_lead_add` stay as an app kind.
     - Pro: no app that declares `lead-add` breaks, since an unknown declared write refuses the app as `write_unknown` and it is not offered. `radar-add`, its twin, stays too.
     - Con: a server kind whose only callers are apps.
   - (b) Retire it whole, apps included. Pro: one fewer kind. Con: a breaking change to the published apps API, with `docs/apps.md`, `apps.yml`, `words.ts`, `apps.ts`, `app-gate.ts` and the G49 row edited.
   - The brief's decision 7 assumed no sender, which no longer holds. Cost is not the reason for (a).
   - The lazy option is keeping the brief's "removed whole" text unchanged over a premise that is now false.
   - Not checked: no app on this machine declares `lead-add`. `ls ~/.oculus` shows no `apps` folder; `apps_dir` may be set in local.yml, which was not read.
2. **Retiring a kind, only if 1 is (b).**
   - (a) Recommended: the existing pattern. Keep `history.kind_lead_add`, add `lead-add` to `RETIRED_KINDS` (`tests/fixtures/kinds.ts`), and answer its undo `gone`.
   - (b) The brief's `history.kind_other` with a `hasText` fallback in `kindOf`. Con: a second way to do one thing (G21).
   - The lazy option is (b) without a reason.
3. **The identity finding (Z550 (4)) against the existing checks.**
   - (a) Recommended: extend `checkEntryIdentity` and reuse `identity_shared`. Cover:
     - an empty first-field value in every collection, with one new key for "has no {0}";
     - venues' `id` shared, since `entry_no_id` already covers an empty `id`;
     - the leads feed;
     - and stop counting two empty values as "shared".
     - Pro: one rule, one place. DATA-MAP `:194` stays true.
   - (b) The brief's two new keys beside the existing ones. Con: two checks for one rule (G21).
   - (c) Leave it to M8's G56. Con: G56 covers duplicate keys of registries only, not empty identities. This is the lazy option.
4. **Order of M6 and M8**, which are both ready (`queue.md`) with 6 slots free.
   - (a) M6 first, as the queue lists. Con: M8 must then rework M6's `collection-text.ts` for `from:` and `required: { when }` and rewrite the same DATA-MAP rows, and its brief does not know that.
   - (b) Recommended: M8 first.
     - Pro: M6's stub rule is written once against the final schema format. A field whose `when:` does not hold is left out of the stub, and a conditionally required one decided once. Section 8 extends M8's validation instead of `REFERENCES`, which M8 replaces.
     - Con: M6 waits for the larger step.
   - (c) Both in flight, merged at landing. Con: adjacent hunks in 12 hub files, DATA-MAP, findings.yml, validate.ts and vocab.yml, so the merge is not simple (spec.md:93). This is the lazy option.
5. **An in-place write while a tab on this page holds unsaved text of the same file.** User-visible behaviour.
   - (a) Write it, and let D28's conflict meet the tab's next save (brief case 8). Con: Overwrite in the tab erases the in-place write. This is the lazy option.
   - (b) Recommended: the in-place controls of a file whose source tab is unsaved on this page are disabled, with a title saying the file has unsaved text in a tab. This is how VS Code's settings editor refuses to write a settings.json that has unsaved changes. Pro: no write is lost silently. Con: one more disabled reason.
   - (c) Apply the change to the tab's draft. Con: an in-place change is no longer saved at once, and History does not see it.
6. **Where the caret goes on Edit, now that a column selects a word.**
   - (a) The line alone, column 0, which goes to line start through `goto`.
   - (b) The first key's column, which selects the key name (`title`).
   - (c) Recommended: the column just after `<key>: ` of the entry's first line, through a `goto` with a column (`commands.ts:21-26` supports it). This needs a tab-state flag, for example `place: 'caret'` against the default word selection.
   - Mark (c)'s flag: it is an instance-state key that is saved with the layout, so a user-visible saved shape.
   - Add's stub caret inside `""` already works with the existing `word` command, because a quote is no word character (`commands.ts:31-36`).
   - The lazy option is (a).
7. **Going to the same place twice.** `Editor.svelte:181-186` goes once per line:column.
   - (a) An `asked` nonce for M6's callers only, as the brief has it.
   - (b) Recommended: `openSourceFile` stamps the nonce on every open. A search hit or reference pressed twice then goes there again, as VS Code does. Con: visible to every opener; it is the same instance-state shape as choice 6.
   - The lazy option is (a), which leaves the same defect in every other caller.
8. **The Literature search's AddForm (D38), a feed add form that is not EntryForm.**
   - (a) Recommended: keep it. It adds a search hit with derived fields (url, found date, bucket), as `applied` fills from a lead, and Z343 names the collection form.
   - (b) Open the radar file with a stub. Con: it loses the hit's prefill.
   - Cost is not the reason for (a). Neither option is the lazy one, given the step line's object.

# 5. Libraries

None replaces the code M6 writes: inserting an entry at a position built from the schema, with the caret placed. Checked with `npm view <name> version license time.modified`:
- **yaml 2.9.1** (ISC, 2026-09-11, already a dependency). `Document.addIn` with `toString()` re-renders layout; it is used to parse and locate.
- **yawn-yaml 3.0.0** (MIT, 2026-01-16, depends on `yaml ^2.8.2`). It preserves comments and styling when its JS value is replaced. It could render the appended entry, but its placement and quoting rules are its own. Section 1 would still have to place the entry, place the caret, handle the refusals and work in the unsaved draft. The in-tree `appendEntry` and `renderScalar` already do the rendering with verification. Named for the orchestrator's choice; my recommendation is not to take it.
- **yaml-diff-patch 2.0.0** (MIT, 2022) and **@atomist/yaml-updater 1.0.2** (Apache-2.0, 2023): stale, and the same limits apply.
- **yaml-language-server 1.24.0** (MIT, 2026-10-07; M8's, ruled by Z345). After M8, a JSON Schema `defaultSnippets` on the entry item would offer a new-entry completion in the editor. That adds to Add; it does not replace it.
- **json-schema-faker 0.6.3** (2026-08-01), from the brief: builds objects and places nothing in text.
- **Monaco snippets:** the brief's decision 2 (c), not taken.

# 6. Corrections to the brief

1. Line 3: replace "`ls docs` prints only `diagrams`" with "`ls docs` prints apps.md, configuration.md, debugging.md, diagrams, files-and-search.md, source-control.md, terminals.md, views.md, window.md; none is an ADR".
2. Line 7: plan lines `236`, Z340 `:1141`, Z343 `:1146`, Z436 `:1239`, Z550 `:1339`, `orchestrator-history.md:286`.
3. Line 9: "D20, D38, X3e and D28 have landed (722a287a7, 5b4e737a8, 1ae5e7c8d, 3bf3bf4c6)". Add the order with M8 from choice 4.
4. Line 17: re-read on main at 3bf3bf4c6. In the base copy's `git archive`, add `feeds/position-leads.yml` and `docs/` and say the worktree's sparse paths gain `docs`.
5. Premise 1: Collection `:76,292`, EntryCard `:36,405`, DESIGN.md `:507` only.
6. Premise 2: `fs.svelte.ts:152`; `options.yml:1260-1262`; `roots.ts:23-35`; `collectionFile` in `server/files/fs/collections.ts:30`.
7. Premise 3:
   - `feeds.ts:227`, `:330`, `:369-372`; writes.ts `:492-497`, `:514-524`; `sources.yml:69`, `:79`.
   - Add: "`lead-add` is an open app write kind (`data/helpers/files/apps.ts:115`, `app-gate.ts:34,75`, `state/system/apps/words.ts:42`, `apps.yml:53`, `docs/apps.md:427,508`, `methods.test.ts:279,290`)", with choice 1's ruling.
8. Premise 4: replace the whole paragraph with D28's present facts:
   - the store in `state/sessions/source/`;
   - `performSave` with `base`;
   - `editSourceDraft(id, text, edits?)`, `onEdit` and autosave;
   - the disk channel;
   - the "Failed to save" alert with Compare, Overwrite and Revert;
   - `notText` and `disk: 'gone'`.
   - Drop decision 1's comparison, since it is settled.
9. Premise 5: "`Source.svelte` is 478 lines (`wc -l`); no split is needed".
10. Premise 7:
    - `config/sources.yml:52`; `REGISTRY_IDENTITY_FIELDS :52` (uses `:234`, `:374`); `FIRST_LIST :144` (use `:451`).
    - D20's `collections.ts` is on main: `listOf :90`, `readCollection :115`, `parse` at `:129`.
11. "EntryForm and what it uses":
    - collection.ts lines `:395`, `:592-664`; writes.svelte.ts `:295-396`; shapes.ts `:244-256`.
    - bodies `:90`, `:276-278`, `:459`; undo `:151-156`, `:346-351`, `:358` (the "four feed writes"), import `:29`, `:223` deck-gone.
    - `History.svelte:112-115`; `text.ts:53`; `history.yml:46`.
    - Add the `RETIRED_KINDS` precedent and AddForm's use of answer-words.
    - `changes.jsonl` 0 of 58.
    - context.ts `:53`, `:195`, `:292`, `:307`, `:391-397`, `:502`, `:738`.
    - fs-transport.ts `:61`, `:188`, `:231-246` for the schema chain; `bookmark-rows.ts:100`; `Files.svelte:252`, `:323`.
    - The lead flow: `:65-156`; Leads `:127-142`, `:165-167`, `:216-222`.
    - The card: `:122`, `:152-191`, `:208`, `:285-286`, `:404-406`.
    - `duplicate(held)` `:208`, `:308`, `:338`, `:370`; `typeRefusal :69`.
    - `workbench.yml:52`; `files.yml:118`; tests `form-drafts :55/:63/:72`, `feeds.test.ts:134`, `:82-87` (slow), `undo.test.ts:246-269`.
12. "The source editor":
    - `source-file.ts` already carries `column`.
    - `openedAtShape` is in `views/sources/source/status/tab-state.ts:15`.
    - The go-to effect is `Editor.svelte:176-192`, once per line:column, with `word` for a column.
    - `goto` already takes a column (`types.ts:78`, `commands.ts:21-26`).
    - `keepPreview` is in `layout/instances.ts:168`.
    - Section 2's "Going to the same place twice" keeps only the `asked` nonce and choice 6's placement flag, as choices 6 and 7 rule.
13. Section 1:
    - `data/helpers/files` holds 8, so the folder reaches 10.
    - `appendEntry :179`, `startEntries :116`.
    - The stub table's leads row: caret line 566, entries 50 to 51.
    - The rule reads M8's `from:` and `required: { when }` if M8 lands first (choice 4).
14. Section 2:
    - `placeEntry` also refuses a `notText` draft (`source.not_text`) and a draft whose disk is `gone`.
    - It calls `editSourceDraft(id, text, [the one insertion edit])` so the editor applies one edit.
    - Add choice 5's ruling on in-place writes while a tab of the file is unsaved.
15. Section 6, decision 7 and case 33: rewrite to choice 1. Under (a): only the client `addLead`, the Leads EntryForm add and `adding` go; the kind, body, undo, `history.kind_lead_add` and the G9 lead test stay. Under (b): follow choice 2's `RETIRED_KINDS`, edit `methods.test.ts`'s row to another undeclared kind (a G49 edit), and rewrite `docs/apps.md:427,508` and `apps.yml:53`.
16. Section 8: replace with choice 3's extension of `checkEntryIdentity` (`validate.ts:584`) and the existing `identity_shared` and `entry_no_id` keys, plus one key for an empty identity. Name DATA-MAP `:194`.
17. "Paragraphs and head comments" and section 7: replace every HELP.md target.
    - `docs/window.md:66` (the unsaved-text paragraph: the entry-form, bookmark-form and add-form sentences).
    - `docs/files-and-search.md:25` ("The Notes and Bookmarks heads draw their add control at all times").
    - `docs/views.md:137` (`applied`).
    - `docs/views.md:243` (the one place for Add, Edit in File and the in-place controls).
    - `docs/configuration.md:65`: still true.
    - HELP.md is changed only where its index rows change; `HELP.md:111` (files) and `:129` (linkedin) are read.
    - DESIGN.md targets: `:61`, `:388` (and `:392` if choice 1 is (b)), `:455`, `:507`, `:519`, `:550`, `:552`, `:567`.
    - DATA-MAP: `:191`, `:413`, `:424`, `:427`, `:437`, `:440`, `:441`. `vocab.yml:255`.
    - Head comments: writes.ts `:185`, `:307`; entries.ts `:36`; writes/entries.ts `:12`, `:19`, `:65`; feeds.ts `:597`; fs.ts `:8`, `:452`; collections.ts `:26`; instances.ts `:315`.
18. Paths: drop `HELP.md lines 97, 114-118, 121, 124-129, 132, 134, 158, 303` and the old DESIGN.md and DATA-MAP lines. Add:
    - `docs/window.md`, `docs/files-and-search.md`, `docs/views.md`, and `docs/apps.md` under choice 1 (b);
    - `views/sources/source/status/tab-state.ts`, `state/sessions/source/draft.ts`, `state/sessions/source/source.svelte.ts`;
    - `state/sources/fs-transport.ts` (already listed);
    - `config/sources.yml` line 52; `config/catalogs/vocab.yml` line 255;
    - `src/lib/data/snapshot/validate.ts` (`checkEntryIdentity`), `src/lib/data/sources/registries.ts` if venues' `id` sharing is checked there;
    - under choice 1 (b): `src/lib/data/helpers/files/apps.ts`, `server/edit/writes/app-gate.ts`, `state/system/apps/words.ts`, `config/text/views/apps/apps.yml`, `tests/state/system/apps/methods.test.ts`, `tests/fixtures/kinds.ts`;
    - `utils/folder-check.sh` is read only.
19. "Shared with steps in flight or ahead": replace whole. D20, D38, X3e, D28, D23, D45 and D11 have landed. M8 shares the paths in section 2 of this report (choice 4); M7 waits for M6.
20. Cases:
    - Delete brief lines 266-267.
    - In "Tests" (line 273), delete "and with the `feed-delete` undo branch (`feedUndo`'s restore) removed on a scratch copy, its failing line quoted".
    - Case 2's leads values: 566, 50 to 51.
    - Case 8 follows choice 5.
    - Cases 6 and 33 follow choices 3 and 1.
    - Add a case: Add on a tab whose draft is `notText` or gone, and on a tab already marked changed on disk.
21. Verify:
    - 2 adds `tests/state/sessions/source-disk.client.test.ts` and `autosave.client.test.ts`, and `methods.test.ts` under choice 1 (b). It names `tests/state/sessions/source.test.ts`.
    - 3's counts become 60 and 24, with the file breakdown above, and a third grep over `src/lib/data/helpers/files/apps.ts` and `docs/apps.md` under choice 1 (b).
    - 4 runs over the worktree's copies of the hub files, not the main checkout's (spec.md:37).
    - 7 drops "with the `feed-delete` undo branch taken out on a scratch copy, its failing line quoted".
    - 5's size line names `validate.ts` 863 and `fs.svelte.ts` 879.
22. Decisions 1 and 9: decision 1 is settled (all landed). Decision 9 stands, with choice 3's note that an identity test needs a guarded entry or M8's G56.

Usage: agent ae36b6ca70a8c7a2e (the id the state file records at `orchestrator-state.md:217`), claude-opus-5-5. Tokens and minutes not measured. About 70 tool uses, counted by hand from this transcript.

Usage: ae36b6ca70a8c7a2e, claude-opus-5-5, 325,878 tokens, 121 tool uses, 14.1 min.
