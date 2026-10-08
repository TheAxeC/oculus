# M6 premise recheck on main at 7c5514850

Read-only. Nothing was changed anywhere. My only scratch files are two read-only node probes in my session scratchpad (`m6/stub.cjs` and `m6/ids.cjs`), which parse the hub files with the `yaml` package and print results. Nothing of mine is still running.

These findings change what M6 builds, beyond line numbers that moved:
- **D33 builds Z722 (7).** D33 is in flight (`queue.md`: "D33 (the Problems view): repair round 1"; "M6 ...: after D33"). Its brief, item 5 (`agents/briefs/D33.md:66`), adds `endLine?`, `endColumn?`, `asked?`, `wentTo?` and `focus?` to `SourceTabState`. `openSourceFile` and `openLibraryFile` stamp a fresh `asked` on every open, and the brief says "M6 is prepared after this step lands and uses this value". So M6 builds no nonce. Z722 (6)'s placement flag may also be unnecessary: an empty range through D33's range selection would place the caret (new choice 2).
- **The data folder is full.** M8 added `private-folders.ts` to `data/helpers/files/`, which now holds 9 items. The brief's two new files there would make 11.
- **M8 narrowed `checkEntryIdentity`.** It now skips every registry file (`validate.ts:243-279`). That leaves shared venue `name`s and shared funding `title`s, which are write identities, unreported. A shared venue `id` is now M8's `findings.schema.duplicate_key`.
- **M8's generated schema rejects some stub values.** For a `select` with `from:` (joint-work `person`) or a `date` field, it refuses `""`, so the stub's `person: ""` is marked in the editor and becomes a finding once saved (new choice 3).
- **Events now get a `link` line in the stub.** `required: { when: { role: present } }` on events' `link`, read with the stub's own `role: present`, adds `link: ""`.
- **Z722 (1) keeps the `lead-add` kind.** So most of the brief's section 6 (bodies, undo, `history.kind_other`, case 33, the G9 and G8 lead tests) no longer applies.
- **The brief still asks for breakage testing** (lines 266-267, 273, verify 7), which spec.md bans.

## 0. Main's head and what landed since 3bf3bf4c6

`git rev-parse HEAD` prints 7c5514850e3f557efce08b626cbbfd6bbd1b70f3. `git log --oneline 3bf3bf4c6..HEAD` prints 18 commits:
- 7c5514850 Land M8, the hub's YAML checked and completed in the editor (the only commit touching product code or hub data: `git log --oneline 3bf3bf4c6..HEAD -- tools/oculus/src tools/oculus/tests tools/oculus/config tools/oculus/docs tools/oculus/DESIGN.md tools/oculus/HELP.md docs registries feeds funding network education applications tasks` prints only this one)
- 2dcb0febf Send D33's repair round 1
- cb2ec6bb8 Rule that an agent hands back with nothing running (changes spec.md)
- 7b07bcdbb, 8072176a4 Correct M8's round 1 usage
- d6b1c94c8 Save M8's report over repair round 1
- 3a7e975fb Save D33's refuter report
- 7a9489790 Rule on open item 8
- 448bb5366 Pause the loop for an account switch
- 65c5371e1 Rule that builders run no page (changes spec.md)
- f8761990d Send M8's repair round 1
- 6e040e5d2 Fold the desktop app's EPIPE crash into M6
- 5ede62e33 Rule on open items 5, 6 and 7 (changes guarded.md)
- 496f76f7d Launch D33's builder
- 1439a44ec Prepare D33 on main at ede542861
- ede542861 Rule on M8's handed-back case
- 9b28520de Launch M8's builder
- d8f32d576 Prepare M8 on main at 3bf3bf4c6

M8's booking is `plan.md:257` ("Booked 2026-10-08: the hub's YAML checked and completed in the editor ...", 178 files). `git show --stat 7c5514850` reports 183 files changed, 7846 insertions and 3722 deletions.

## 1. What M8 changed under M6, file by file

`git diff --stat 3bf3bf4c6 HEAD` over M6's folders lists the files below. M8 did **not** touch `EntryForm.svelte`, `entry-form.ts`, `RegistryCard/Head`, `EntryCard.svelte`, `Collection.svelte`, any registry or feed view, `writes.svelte.ts`, `shapes.ts`, `writes.ts`, `bodies.ts`, `undo.ts`, `feeds.ts`, `fs.svelte.ts`, `lines.ts`, `yaml-ranges.ts` or `collections.ts`. The prompt's "touched EntryForm.svelte" does not reproduce: the file is absent from the stat.

- **`state/boards/collection.ts`** (829 lines; `wc -l`)
  - `kindShape` (:614-619) now maps `records` to `raw`.
  - `formFields` (:626) reads `vocabOptions(config, field.from)`. `vocabOptions` (:710), `vocabWords` (:701), `optionShape` / `optionsShape` (:690-698), `VOCAB_PREFIX` (:139) and the `vocabKeys` import (:16) are new or renamed.
  - `kindOf(field, type, from)` (:161) reads `from` (a list).
  - What it means for M6: every one of those helpers has no reader once `formFields` goes (`grep -n "vocabOptions\|vocabWords\|optionsShape\|VOCAB_PREFIX" collection.ts` hits only inside the form block). M6 removes them with `formFields`, `extraRawFields`, `clearedValue`, `refusedField`, `FormKind`, `FormField` and `kindShape`.
  - A second `formFields` and `FormField` live in `state/forms/schema.ts` (the manifest editor's, used by `selectors.svelte.ts:42`, `:346`) and stay. The brief's rename grep for `formFields` / `FormField` must exclude them.
- **`server/edit/writes/entries.ts`** (471): `ISO_DATE` moved to `data/helpers/dates.ts`. The `typeRefusal` comment now says `from`. New lines:
  - `REGISTRY_IDENTITY_FIELDS` :53, uses :232 and :372
  - `FIRST_LIST` :142, use :449
  - `typeRefusal` :67
  - `sharedIdentity` :168, `duplicate` :180, `duplicate(held)` :206, :306, :336, :368
  - comments :12, :19, :63
  - What it means for M6: section 5.1's ISO test for a lead deadline uses `ISO_DATE` from `data/helpers/dates.ts`, not a new regex (G21).
- **`data/helpers/dates.ts`**: exports `ISO_DATE`.
- **`state/sources/fs-transport.ts`** (482): `schemaFieldShape` (:235-255) became a lazy recursive shape with `whenShape` (:232) and `unchangedAs`, for `from`, `required: { when }`, `when`, `open` and `fields`. What it means for M6: section 5.3 removes `schemaFieldShape`, `whenShape`, `bookmarksShape.schema` and the `SchemaField` import (:7). `unchangedAs` stays imported only if something else in the file uses it; it has other users elsewhere (`grep -rn unchangedAs src`).
- **`data/model/model-collections.ts`**: `SchemaField` is now `{ field, type, label?, options?, from?: string[] | FromPicked, required?: boolean | { when: When }, help?, when?, open?, fields? }` (:29-52). `from:` written as one scalar is read as a one-item list (`data/snapshot/schema/field.ts:26-33`). What it means for M6: the stub rule reads `required` as true or `{ when }`, and a field's `when`. `optionsFrom` is gone everywhere.
- **`data/snapshot/validate.ts`** (424 lines, was 863)
  - `checkEntryIdentity` :243-279, wired :419. It now skips every file of a registry: `registryFiles` from `REGISTRY_SHAPES` covers data, venues, pillars, domains and funding (`hub-names.ts:40-50`).
  - `checkFundingIdentity` :312-322 is "neither a key nor a title".
  - Shared registry keys are `duplicateKeys` in `data/snapshot/schema/lists.ts:117-145` (`findings.schema.duplicate_key`, `findings.yml:174`).
  - `validate-kinds.ts` is now 25 lines.
  - What it means for M6: section 8's code fits in `validate.ts` (424 lines). See item 3 of section 3 for the gaps.
- **`data/snapshot/schema/`** (new, 10 items)
  - `lists.ts:90-111` holds a private `lineOfItem(text, list, field, key, nth)`: the line of the n-th item of a list whose `field` holds `key`.
  - What it means for M6: M6's `entryAt` is the same walk, so under G21 one is built on the other.
  - `record.ts:144-158` turns `when` into JSON Schema and drops a condition's `path` key (`withoutPath`). No JS evaluator of a `when` over a record exists (`grep -n "function.*[wW]hen" src/lib/data/snapshot/schema/*.ts` prints only `condition` and `withoutPath`), so the stub rule's evaluation of `required.when` is new code.
- **`state/forms/schema.ts`, `state/client/selectors.svelte.ts`**: the manifest form's `choicesFor` now merges `options` and `from` sources, and `fieldChoices(field, project)` filters by `movable`. Both stay; no change for M6.
- **`views/shared/card/card.ts`**: `editAction` is now :128-136 (label `collection.form_edit_title` :131). It uses `HUB_ROOT`.
- **`config/catalogs/vocab.yml`**: the sentence "The venues edit form's tier dropdown pulls its options from the ASSIGNABLE keys here" is still on :255.
- **`config/text/findings.yml`**: `entry_no_id` :15, `duplicate_key` :174, the `validate:` group from :185, `identity_shared` :194.
- **`config/text/views/system/workbench.yml`**: `settings.not_in_list` is now :55. `FieldControl.svelte` reads it at :127, :212, :223, :234.
- **The hub files** (`schema:` blocks rewritten with `from:`, `when:` and help lines). The fourteen comment lines M6 rewrites are on the same lines (`grep -n -i -E "^\s*#.*(\bform\b|add/edit|\bmodal\b|card's form)"` over the 13 files and the radar):
  - data :23, venues :13, pillars :24, domains :1, boilerplate :9, repos :4
  - funding :1 and :4, events :1 and :4, joint-work :7
  - education :4, applications :4, tasks :5
  - The dataset's registration-form line is now `data.yml:587` (was :572).
  - M8 added `feeds/literature-radar.yml:12` ("Form schema: the fields of an entry. The editor completes them and marks a key no entry may hold."), which is true after M6 and is a model for the fourteen rewrites.
  - `data.yml`'s `retrieval` is now `type: records` (:34-50). `grep -rn "type: raw"` over the hub collection files prints nothing.
  - Line counts and list lines (`wc -l`, `grep -n`): data 1068 (`schema:` :24, `datasets:` :51), venues 1063 (:14, :36), pillars 97 (:26, :35), funding 158 (:5, :21), events 109, applications 410, joint-work 109, tasks 43, repos 204, education 243, boilerplate 27, domains 55, leads 564 (`schema:` :52, `entries:` :64).
- **`docs/DATA-MAP.md`** (517 lines; `LC_ALL=C grep -c '[^ -~]'` prints 0). The lines M6 rewrites are now:
  - :191 ("which edit the same records through the collection schemas")
  - :194 (the identity findings: duplicate keys of registries, and `checkEntryIdentity` for "any other collection")
  - :436 ("The form's kinds are `FormKind` and `kindShape`")
  - :447 (`raw` "edited in the form as one line of JSON text")
  - :451. Its first sentence, "`raw` is the field type of `retrieval`", has been false since M8 made `retrieval` a `records` field. M6 rewrites the line, so this goes with it.
  - :461 `label`, :464 `required`, :465 `help`
- **`DESIGN.md`** (577): M8 changed :24, the config folders and the language servers. The sentences M6 rewrites are now:
  - :62 (`forms/` among the state folders, which stays true)
  - :389 (open kinds with `lead-add`, still true under Z722 (1))
  - :456 ("each given up with the form told so")
  - :508 (`EntryForm` with `surface={false}`)
  - :520 ("The `applied` control, the Applications add form it fills ...")
  - :551 (unsaved form input, naming `form-drafts`, `open-forms` and `form-values`)
  - :553 (the Files view's open form and the bookmark it edits)
  - :568 ("A form is answered about the entry the write made")
- **`docs/views.md`, `docs/files-and-search.md`, `docs/configuration.md`, `docs/apps.md`**: M8's edits are the language-server and config sentences. M6's targets are unchanged:
  - `docs/window.md:66` (the entry-form, bookmark-form and add-form sentences)
  - `docs/files-and-search.md:25` ("The Notes and Bookmarks heads draw their add control at all times")
  - `docs/views.md:137` (leads `applied`), `:145` (LinkedIn), `:243` (a view's own file control)
  - `docs/configuration.md:68` ("the feeds", still true)
- **`tests/checks/tree/boundaries.test.ts`**: `ALLOWED` is :173. The views row is :211-218 (`data/shapes/shapes`, `data/prose/lsp-servers`, `data/prose/text-edits`), the state row :219-264, and the data and server rows :265-266.
- **`agents/guarded.md`**: G56 now exists (`:149`), Code "`src/lib/data/snapshot/validate.ts` and the generator folder", test `tests/data/snapshot/schema-rules.test.ts` 'gives the finding of $name, with its file and line' (:118). G63 and G64 were added. G28's Code line now carries the source store's files (`:53-55`).
- **`spec.md`** (from 65c5371e1 and cb2ec6bb8): "A builder runs no page ... a case that only a page shows is checked by reading ... and its row names the look on landing", and "An agent hands back with nothing of its own still running".

## 2. Every premise of the brief

Authority and plan:
- **Plan lines moved.** `grep -n "^- M6 the collection forms" plan.md` prints 236 (brief 228). The rulings are Z340 :1146, Z343 :1151, Z436 :1244, Z550 :1344, Z719 :1526, Z722 :1533 (brief 1067, 1072, 1165, 1265). `grep -n "^- Z343" orchestrator-history.md` prints 296 (brief 175). The plan line now ends `(ruling Z719) (ruling Z722)` and carries the Z719 and recheck sub-bullets.
- **Line 3 is false.** `ls docs` in tools/oculus prints apps.md, configuration.md, debugging.md, diagrams, files-and-search.md, source-control.md, terminals.md, views.md and window.md. `ls docs/adr` prints "No such file or directory", and `.agents/plan.yaml` names no `adr`.
- **Line 9 needs D33.** D20, D38, X3e, D28 and M8 have landed. D33 is in flight and M6 waits for it (`queue.md`). D33 writes `state/sessions/source/draft.ts`, `views/sources/source/status/tab-state.ts`, `Source.svelte`, `SourceBody.svelte`, `views/sources/source/Editor.svelte`, `ui/controls/editor/types.ts`, `commands.ts`, `views/shared/links/source-file.ts` and `state/client/context.ts` (D33 brief, Paths). Every line of those files in M6's brief is re-read after D33 lands.
- **Sparse paths.** `.agents/plan.yaml:12` `worktree_paths` now includes `docs` and `deck`, and so does `orchestrator-state.md`'s block. Recheck 2's correction 4 ("add docs") is done.

Premise 1, the EntryForm importers (`grep -rn "EntryForm" src tests config HELP.md DESIGN.md README.md docs --exclude=local.yml`). Nine components:
- `Collection.svelte:76,292`, `EntryCard.svelte:36,405`
- `VenueCard.svelte:18,219`, `DatasetCard.svelte:25,167`
- `RegistryCard.svelte:12,68`, `RegistryHead.svelte:12,48`
- `Leads.svelte:36,217` (`onadd={addLead}` :221), `Linkedin.svelte:33,169` (inline schema :75-88)
- `BookmarkForm.svelte:14,57`

The one document hit is `DESIGN.md:508`. No test imports it. `EntryForm.svelte` is 484 lines.

Premise 2 (the bookmarks file): holds. `BOOKMARK_COLLECTION` is `fs.svelte.ts:152`; `collectionFile` is `server/files/fs/collections.ts:30`, with its "same form" doc at :26.

Premise 3 (feeds):
- `feeds.ts`: `addLinkedinIdea` :227, `addLead` :330, `addRadarEntry` :448, the comment naming `addLead` :597.
- `writes.ts`: the `lead-add` branch :492-497, `linkedin-idea` :514-524.
- `lead-add` is an open app kind:
  - `data/helpers/files/apps.ts:115`, `app-gate.ts:34,75`, `state/system/apps/words.ts:42`
  - `apps.yml:53`, `docs/apps.md:427,508`, `methods.test.ts:279,290`
  - these come from `grep -rn "lead-add\|lead_add\|addLead\|leadAddWrite\|LeadAddWrite" src tests config docs DESIGN.md`
- The LinkedIn front matter is still lines 1-7, line 8 blank and line 9 the body (`feeds.ts:247-257`).
- `linkedinSourcePath` exists in `views/feeds/linkedin/post-card.ts:8`; section 5.2's open reuses it.

Premise 4: superseded by D28, as recheck 2 says. Store `state/sessions/source/`, of which `source.svelte.ts` is 717 lines and `draft.ts` 343. The store's API:
- `sourceDirty` :183
- `openDrafts` :204
- `loadSourceDraft` :254
- `reloadSource` :382
- `editSourceDraft(id, text, edits?)` :429
- `saveSourceDraft` :535, `performSave` :554

Premise 5: `Source.svelte` is 478 lines. `views/sources/source/Editor.svelte` is 300, `SourceBody.svelte` 208.

Premise 6 is false after M8. Holds: no `default:` in any hub schema. Changed:
- `SchemaField` carries `from` (a list) and `required: true | { when }`.
- events' `link` is `required: { when: { role: present } }` (`events.yml:15`).
- venues' `deadline_month` and `held_month` carry `when: { category: conference }` (`venues.yml:31-32`).
- `grep -rn "when:"` over the 13 files prints only those three.

Premise 7:
- `config/sources.yml:52` "An entry is edited in the card's form."
- `REGISTRY_IDENTITY_FIELDS` :53, `FIRST_LIST` :142.
- `collections.ts`: data `listOf` :90, `entryMapsShape` :81, `entryListShape` :84, `readCollection` :115, the throwing `parse` :131.

"EntryForm and what it uses":
- The 15 keys only EntryForm reads hold (`grep -rln "collection\.<key>\b" src` per key prints only EntryForm). `form_cancel` is also read by `LeadCard.svelte`, `form_edit_title` by `card.ts:131`, `edit_delete` by `EntryCard.svelte`.
- Client writes in `writes.svelte.ts`: `writeEntry` :295, `reorderEntries` :347, `deleteEntry` :352, `writeFeedField` :357, `addLead` :372, `addRadarEntry` :377, `addLinkedinIdea` :382, `newEntry` :396, the returned object :655-662. Their types are `shapes.ts:244`, :252, :256, and `WriteAnswer.id` is `shapes.ts:143`.
- Callers of `newEntry`: `lead-application.ts:35,124`, `entry-form.ts:13`, `Collection.svelte:114,168`. Callers of `deleteEntry`: EntryForm only.
- Form state:
  - `open-forms.ts` users: `collection.ts`, `lines.ts`, `datasets.ts`, `venues.ts` (`grep -rln open-forms src`)
  - `leads.ts` `adding` :33, :66, :187; `linkedin.ts` :23, :34, :140
  - `CollectionState.lead` `collection.ts:93-96`, :109-111, :128
  - `context.ts` formDrafts :48-53, :195, :292, :307, `fsForms` :380-397, `registerUnsaved(formDrafts.formsDirty)` :502, :738
  - `forms.ts` (102) `FilesForm` :10, `FilesForms` :20
  - `files-view.ts` (280) comment :59-61, `formShape` :172, :188
  - `fs.svelte.ts` (879) `BookmarkForms` :136, `shiftForms` :301 and :873, `closeGoneForms` :662, `bookmarkWrite` :814, `addBookmark` and `removeBookmark` :865-868, the schema read :643
- The bookmarks schema chain:
  - `markSchemaFor` `bookmark-rows.ts:100`, `markSchema` `Files.svelte:252`, passed at :323
  - `BookmarksState.schema` `fs-transport.ts:61-62`, `NO_BOOKMARKS` :189
  - server `scaffoldSchema` `bookmarks.ts:75`, `BookmarksAnswer` :87-88, comments :5, :10, :15, :45, :71
  - `fs.ts` comments :8, :452
- The lead flow, `lead-application.ts` (162): `applicationFromLead` :65, `holdsTyped` :77, `prefillFromLead` :87, `addFromLead` :118, `leadAddFor` :135, `closeAddForm` :156. `Leads.svelte` `toApplication` :127-146 (which also calls `formFields` of collection.ts, imported :54), the add `ToolButton` :160-168, the add EntryForm :216-222.
- Leads: 50 entries (`grep -c "^  - title:"`); 9 hold a non-ISO deadline (the brief's command).
- `answer-words.ts` stays (EntryForm, LeadCard, PostCard and the Literature AddForm read it).
- The controls:
  - `Collection.svelte` (430): AddButton :244-248 inside `{#if schema !== undefined}`, the add form :292-298, cards keyed by `entry.index` :315, `editing` and `onedit` :328-331, the said line :140 and :302
  - `Venues.svelte` (257): 95-97, 126-137, 167-173, 214-220
  - `Data.svelte` (181): 92-94, 119-134, 152-158
  - `Pillars.svelte` (245): 83-85, 93-104, 117-120, 149-155, 188-194
  - `Domains.svelte` (133): 66-68, 76-86, 103-109
  - `Linkedin.svelte` (310): the add `ToolButton` :102-110, the form :168-174
  - `editAction` users: `RegistryCard:54`, `VenueCard:88`, `DatasetCard:68`
- The card: `EntryCard.svelte` is **509** lines (limit 520).
  - `addressable` :122, the actions :147-191, `setStatus` :208
  - the status Chip :285-287, the `field` rows :381-385, the edit form :404-406
- The deleted test is still `tests/state/forms/form-drafts.test.ts` (G28: :55, :63, :72). `grep -rln` over `tests` for every removed name prints no other test that uses them; `augments`, `duplication` and `writes.test` match only in prose.
- The change log: `grep -c 'lead-add' ~/.oculus/changes.jsonl` was not rerun. It no longer matters under Z722 (1).

"The source editor":
- `source-file.ts` (67) already carries `column`.
- `openSourceFile` :17-29 calls `sourceTabState(root, path, line, column)`. `sourceTabState` is `draft.ts:219-231`, `placed` :247-250, `SourceTabState` :46-66.
- `openedAtShape` is `views/sources/source/status/tab-state.ts:15-18`; `TabState` and `tabFacts` are :43-70.
- `Source.svelte` reads them at :142-143 and passes them at :444-445; `SourceBody.svelte` at :49-52, :95-96, :147-148.
- The go-to effect is `views/sources/source/Editor.svelte:176-193`, once per `line:column` (`placed` :141). It sends `goto` for column 0 and `word` otherwise.
- `goto { line, column? }` and `word` are in `types.ts:78-79`; `commands.ts:21-26` and :27-46 run them.
- `keepPreview` is `layout/instances.ts:168`. `openOpened` is `opening.ts:212`, and it already keeps a preview tab it finds at :242.
- The brief's list of the other callers of `openSourceFile` is stale. `grep -rln "openSourceFile\|sourceTabState" src` prints 27 files. Eleven call `sourceTabState` directly, among them `SymbolRows.svelte:69`, `latex/actions.ts:279,293`, `EditLink.svelte:23`, `Item.svelte:144`, `present/acts/run.ts:55` and `post-card.ts:13`.

YAML helpers (unchanged by M8):
- `grep -rln yaml-ranges src tests utils` prints the same 5 files, and `grep -rln renderScalar src tests` the same 5.
- `lines.ts`: `LIST` :22, `lineAt` :99, `listOf` :152, `locate` :179.
- `entry-edit/entries.ts`: `startEntries` :116, `appendEntry` :179.
- `yaml-values.ts`: `ScalarFieldValue` :17, `DEFAULT_INDENT` :32, `renderScalar` :65.

Folders:
- `ls src/lib/data/helpers/files` prints 9 items, so the brief's 2 new files make 11, over the limit.
- `src/lib/data/helpers` holds 10 (full), `src/lib/data/prose` 9, `src/lib/data/snapshot` 8, `views/shared/forms` 10, `views/sources/files/sections` 10 (BookmarkForm leaving makes 9) and `state/sessions/source` 4.

The table of section 1, rerun with M8's schemas (`stub.cjs`: first field, `KEYED_FIELDS`, `required: true` or a `required.when` holding over the stub's own values, `status`, a `when` that does not hold left out). Each row gives lines, caret (line, column) and entries before and after:
- tasks: `title: ""` / `status: todo`; 45,13; 3 to 4. Holds.
- events: `title: ""` / `role: present` / `status: upcoming` / **`link: ""`**; 111,13; 7 to 8.
- joint-work: `key: ""` / `title: ""` / `person: ""` / `status: exploring`; 111,11; 13 to 14.
- venues: `name: ""` / `id: ""`; **1065**,12; 71 to 72.
- data: `key: ""` / `name: ""`; **1070**,11; 54 to 55.
- applications: `title: ""` / `status: not applied`; 412,13; 25 to 26.
- funding: `title: ""` / `status: in-prep`; **160**,13; 11 to 12.
- domains: `key: ""` / `title: ""`; 57,11; 12 to 13.
- pillars: 99,11; 9 to 10.
- education: `status: planned`; 245,13.
- statements: `status: draft`; 29,13.
- code: `status: active`; 206,13.
- leads: `title: ""` / `status: open` / `date: <today>`; **566**,13; **50 to 51**.

Identities (`ids.cjs`): every file prints `empty 0 dup []`, venues' `id` included and leads 50.

How writes are guarded:
- G1, G8 and G9 hold.
- G8's Code now names `server/files/source.ts` and `file-bytes.ts`.
- G28 (`guarded.md:53-55`) still names `src/lib/state/forms/` and the three form-drafts titles.
- `validate.ts` is now G56's Code (`guarded.md:149-151`) and G14's (via `data/index.ts`), and `data/snapshot/` is G15's and G32's.

Head comments: `grep -rn -i -E "entry form|add form|edit form|bookmark form|card's form|add/edit|form drafts|form-drafts|open-forms|form-values|EntryForm" src` over comment lines finds these hits beyond the brief's list, each made false by M6:
- `data/shapes/vocab-keys.ts:2-3` ("the entry forms of the page (state/boards/collection.ts, ...)")
- `state/client/instance-context.ts:5` ("the entry form a card opens")
- `views/sources/files/MessageLine.svelte:3`
- `views/shared/explorer/control/tab-actions.ts:39` ("the bookmark form's outcome")
- `fs.svelte.ts:47`, :132-149, :289, :298, :655
- `bookmark-actions.ts:54`, :72, :78
- `Bookmarks.svelte:13`, :47
- `context.ts:294-297`, :374-377
- `collection.ts:77`, :93, :595-622
- `EntryCard.svelte:80`, :83, :147
- `Collection.svelte:44`, :58, :165
- `RegistryCard.svelte:4`, :19, :52; `RegistryHead.svelte:3-4`, :16-29; `AddButton.svelte:11`, :13
- `card.ts:127`
- `Leads.svelte:19-24`, :124; `LeadCard.svelte:7`, :46
- `leads.ts:32`
- `writes.ts:182-185`, :307
- `entry-edit/entries.ts:36`, `render.ts:23`, `writes/entries.ts:12`, :19, :63
- `instances.ts:315`
- `Files.svelte:32`, :43-45, :197, :242-245

Hits that name the manifest editor, the Calendar, Inbox or account Add forms, `Subtasks.svelte`'s add form, or the Literature radar's Add form stay.

## 3. Z722 and Z719 against the tree

- **(1)** The client sender is `writes.svelte.ts:372-374`, returned at :658, with its type in `shapes.ts:252`. Its one caller is `Leads.svelte:75`, :221. Those go, with `Leads.svelte`'s add EntryForm (:216-222), `adding` (`leads.ts:33,66,187`) and the add `ToolButton`'s `active`/`pressed`.
  - Unchanged: server `addLead` (`feeds.ts:330`), the `writes.ts:492-497` branch, `bodies.ts:90,276-278,459`, `undo.ts:154,349`, `app-gate.ts:34,75`, `apps.ts:115`, `words.ts:42`, `history.yml:46`, `apps.yml:53`, `docs/apps.md:427,508`, `DESIGN.md:389`, and the tests `feeds.test.ts:11,137` (G8 'adds a lead ...') and `undo.test.ts:250` (G9).
  - `feeds.ts:597` ("since addLead fills a missing status and today's date for an entry the reader is adding") becomes partly false: the reader no longer adds through it, an app does. Reworded.
- **(3)** `checkEntryIdentity` is `validate.ts:243-279`, wired :419. Against the tree after M8:
  - **Venues' `id` shared is now covered.** `duplicateKeys` (`schema/lists.ts:117-145`, `findings.schema.duplicate_key`) reports it, and an empty `id` is `findings.registries.entry_no_id` (`registries.ts:95-101`). Adding venues' `id` to the extension would report each such entry twice, so it drops.
  - **Two registries lost their write-identity check.** M8 skips every registry file (:251-258). Two registries have a first field (the write identity, `identityField`, `collections.ts:49`) that is not the registry id: venues `name` and funding `title` (`hub-names.ts:42-50` against the schemas). A shared venue `name` or funding `title` makes the server refuse every write to that file (`duplicate`, `writes/entries.ts:180`), and no finding reports it. Under Z722 (3)'s "every collection", the extension skips a registry only where the schema's first field is that registry's `idField` (data, pillars and domains `key`). It checks venues' `name` and funding's `title` for empty and shared.
  - **An empty funding `title`.** `checkFundingIdentity` (:312-322) reports only an entry with neither key nor title, so an entry with a key and an empty title still needs the empty-identity finding. One finding per entry.
  - **The leads feed** is `raw.feeds` (`model-collections.ts:129`), first field `title`.
  - **Two empty values.** `textOrNumberOnlyShape` (`shapes.ts:62`) reads `''` as a value, so two empty values are counted as shared today (:262-264). After the change they are not.
  - Keys: one new key beside `identity_shared` (`findings.yml:194`), and `DATA-MAP.md:194` rewritten to say all of this.
- **(4)** Holds: M8 is 7c5514850.
- **(5)** How a page knows: `source.openDrafts()` (`source.svelte.ts:204-209`) gives the instance ids of every loaded draft over a file on disk. It reads `ui.instanceKeys('')` (`ui.svelte.ts:688-690`), the ui store of this browser page, which spans every workbench page. Then `sourceDirty(id)` (:183-186) and `diskFileOf(sourceDraft(id).file)` (`draft.ts:337-343`) give root and path.
  - The ruled change: a new store function in `source.svelte.ts`, for example "the files this page holds unsaved text of", or "whether root/path is unsaved". It is under G28's Code, so G28's source tests run.
  - That function is read by `InPlace.svelte` and the card; the disabled title is a new catalog key.
  - Scope questions are new choice 1.
- **(6)** The tab state is `SourceTabState` (`draft.ts:46-66`), `openedAtShape` (`tab-state.ts:15-18`), the effect (`Editor.svelte:176-193`) and `goto`/`word` (`types.ts:78-79`, `commands.ts:21-46`). D33 is changing all of them now, and adds a range. An empty range (line = endLine, column = endColumn) places a caret with no new saved key, if D33's range command treats it so. That is checked at D33's landing; new choice 2.
- **(7)** D33 builds it (`agents/briefs/D33.md:66`: `openSourceFile` and `openLibraryFile` stamp `asked` from a page counter, and `wentTo` records what was gone to; decision 5 at :222). M6 builds nothing for (7) and drops `asked: Date.now()` from section 2.
  - Callers that build `sourceTabState` themselves (`SymbolRows`, `latex/actions.ts`, `EditLink`, `Item`, `run.ts`) do not pass through `openSourceFile`. Whether they get the stamp is D33's to settle, not M6's.
- **(8)** Holds: the Literature AddForm is not EntryForm.
- **Z719.**
  - `print` is `src/desktop/app.ts:53-56` (`console.error` / `console.log`), called at :124, :225 and :292.
  - The same EPIPE reaches two more writes of the app process: `app.ts:68` (`process.stdout.write(..., () => app.exit(0))`) and `src/desktop/windows/window-state.ts:40` (`console.error`, in the main process). Z719's rule "a write to a closed output is dropped and the app goes on" covers all three. A guard on `process.stdout` and `process.stderr` covers every write, not `print` alone.
  - The harness is `tests/server/desktop/app-harness.ts` (29 lines). `start.test.ts` spawns it with `stdio: ['ignore', 'pipe', 'pipe']` (:112-121). The harness can learn that its starter ended from a stdin pipe's `end`, a signal rather than a timer, which needs `start.test.ts` to pass a stdin pipe.
  - The harness should end through the app's own quit path, so `STOP_WAIT_MS` stops the server child. `app.exit()` skips it and would orphan the server.
  - G48 (`guarded.md:164-166`): Code `src/desktop/`; its test is "written by O30". The file is `tests/server/desktop/start.test.ts` (342 lines, `// @module-tag slow` :13), with titles at :240, :262, :274, :306 and :331.
  - `src/desktop/` is also G47's Code (`guarded.md:31-33`) and G53's (`window-file.ts`, `windows.ts`). `window-state.ts` is the store, so G53's test is not touched by a print guard.

## 4. Cases and Verify against spec.md

- **Breakage testing goes** (spec "Code is never deliberately broken ..."). Brief lines 266-267 (a small change the case must catch, its failing line), line 273 ("with the `feed-delete` undo branch ... removed on a scratch copy") and verify 7's same clause. The failing line of an edited test on the unchanged tree stays (spec "The report quotes, for each test ... its failing line on the unchanged tree").
- **Z722 (1) removes these:**
  - case 33 and `history.kind_other`, with `History.svelte` and `history.yml` from Paths
  - the G9 lead-test edit and the G8 `addLead` test deletion
  - decision 7, the `lead-add` bullets of section 6
  - verify 3's second grep
  - the only edited test left is `feeds.test.ts:88` (G8 LinkedIn, `{ tags: ['slow'] }` :84, run alone with `npx vitest run`, which spec allows)
- **Cases only a page shows** (1, 7, 10-12, 14, 17, 19-23, 27-32 and the in-place parts) are first-run by reading, and their rows name the look (spec "A builder runs no page"; "A behaviour that needs a DOM ... is seen at the look"). The "first run of every case on the unchanged tree" sentence says so.
- **Verify 4** reads the worktree's copies of the hub files. spec's "Four things read the real hub and nothing else" leaves no room for a node run over main's checkout.
- **Z719's G48 run is the orchestrator's at landing.** `start.test.ts` starts Electron, which builds and runs a scratch oculus. spec's "A builder runs no page" and O30's brief line 18 ("The builder never starts the Electron app, by any route") make it not the builder's. The EPIPE guard has no guarded entry (G48's text is one server and Quit), so no test is added. It is checked by reading and by a quoted plain-node run of the exported guard writing to a closed pipe, which is a run of the code, not a breakage test.
- **Tests that now must run** (spec "A step whose change touches an entry's code runs that entry's test"):
  - G56 `tests/data/snapshot/schema-rules.test.ts` and G14 `tests/checks/config/integrity.test.ts` (validate.ts)
  - G28 `tests/state/sessions/source.test.ts`, `source-disk.client.test.ts`, `autosave.client.test.ts` and `tests/state/forms/manifest-draft.test.ts` (the source store and `state/forms/`)
  - G15 and G32's snapshot tests if `data/snapshot/schema/lists.ts` changes for `lineOfItem`
  - G16, G21 and G24
- **No new test** stays consistent with spec (no guarded entry for the stub rule, InPlace or the identity finding; a new entry needs Axel). Section 8's proof stays a quoted node run over fixtures, since G14 passes with the check unwired.
- **Verify 5 sizes** (`wc -l`): `validate.ts` 424, `fs.svelte.ts` 879 (M6 only removes from it, or adds less than it removes), `EntryCard.svelte` 509 of 520, `source.svelte.ts` 717, `collection.ts` 829, `feeds.ts` 720, `writes.svelte.ts` 678, `context.ts` 771, `Editor.svelte` 300, `Collection.svelte` 430.

## 5. New choices the tree raises

1. **Which controls Z722 (5) disables, and over which tabs.** The ruling's reason, a write lost through Overwrite, applies to every write the page sends to a file whose tab holds unsaved text. On a collection card that is the in-place controls, the pin, the reorder grip, the subtask add and tick, and the snooze (`EntryCard.svelte:204-209`, Subtasks). On the leads, it is LeadCard's `applied`, `decline` and reopen (`feed-field`), which reach the same loss after Add on Position Leads.
   - (a) Recommended: disable every control that writes that file, counting every source tab this browser page holds (`openDrafts`, all workbench pages). Pro: no write is lost by any path the ruling names. Con: more disabled controls while a stub is unsaved, though Add itself ends that at its save.
   - (b) The status, deadline and date controls alone, as the ruling's words read. Pro: fewer disabled controls. Con: a pin or a decline is still lost on Overwrite.
   - (c) Only tabs on the current workbench page. Con: a tab on another workbench page loses the write the same way.
   - (b) and (c) are the lazy options.
2. **How Edit places a bare caret, now that D33 adds a range.**
   - (a) Z722 (6)'s placement flag, a new saved key of the tab state. Pro: as ruled. Con: a second way to say a place beside D33's range.
   - (b) Recommended, if D33's range command places a caret for an empty range: Edit opens at `line = endLine`, `column = endColumn` just after `<key>: `, and Add at the inside of the first `""`. Pro: one mechanism for a place and no new saved key. Con: it depends on D33's code, checked at its landing. If the range command does not do this, (a).
   - The lazy option is the line alone, already rejected.
3. **How the stub writes an empty value, now that M8's schema checks the file.** `record.ts:105-110` holds a `select` to `enum: [...options, ...from keys, null]`, and a `date` to the ISO pattern (:90-91). So `person: ""` (joint-work) is marked by yaml-language-server and, once saved by autosave, is a schema finding beside the identity finding. `title: ""` (text) is not marked. No other stub field in the hub is a `select` with `from` or a `date`.
   - (a) `""` everywhere, as the brief has it. Con: a wrong mark and finding on a select whose choices come from `from`.
   - (b) Recommended: `""` for a text field, the caret inside the quotes, and an empty value (`person:`, null, which the schema allows) for a `select` with `from` or a `date`. Pro: no false mark; yaml-language-server completes the empty value from its source. Con: two renderings of an empty value.
   - (c) Every empty value as null, the caret after `key: `. Con: a title holding `: ` must then be quoted by the reader.
   - Neither (a) nor (b) is cheaper; (a) leaves a defect visible on the first Add on Joint work.

## 6. Corrections to the brief

1. Line 3: replace "`ls docs` prints only `diagrams`" with the nine entries listed in section 2; none is an ADR.
2. Line 7: plan line 236; Z340 :1146, Z343 :1151, Z436 :1244, Z550 :1344; add Z719 :1526 and Z722 :1533; `orchestrator-history.md:296`.
3. Line 9 and "Shared with steps": D20, D38, X3e, D28 and M8 (7c5514850) have landed; M6 is prepared after D33 lands. Replace the whole "Shared" section with D33 (in flight; its write list overlaps M6 at `draft.ts`, `tab-state.ts`, `Source.svelte`, `SourceBody.svelte`, `Editor.svelte`, `types.ts`, `commands.ts`, `source-file.ts` and `context.ts`) and M7 (after M6).
4. Line 17 / base copy: re-read at the base after D33. The `git archive` gains `feeds/position-leads.yml`, `tools/oculus/docs` and the twelve hub files. The verify-6 baseline is taken at that base.
5. Premise 1: the importer lines of section 2; `DESIGN.md:508` only; EntryForm 484 lines.
6. Premise 2: `fs.svelte.ts:152`; `collections.ts:30` and its doc :26.
7. Premise 3:
   - `feeds.ts:227`, :330, :448, :597; `writes.ts:492-497`, :514-524; `sources.yml:69` and :79
   - add the open-app-kind evidence and Z722 (1)
   - section 5.2's open uses `linkedinSourcePath` (`post-card.ts:8`)
8. Premise 4: replace with D28's facts (recheck 2, correction 8), with `editSourceDraft(id, text, edits?)` at :429. `placeEntry` passes the one insertion as `edits` (`data/prose/text-edits`) and refuses `notText` and disk `gone` as it refuses `readonly` and `truncated`. Drop decision 1's comparison.
9. Premise 5: `Source.svelte` 478; no split.
10. Premise 6: the schema now carries `from` (a list, or `{ field, sources }`), `required: true | { when }`, `when`, `open` and `fields` (`model-collections.ts:29-52`). The stub rule:
    - writes a field whose `required.when` holds over the stub's own values
    - leaves out a field whose `when` does not hold
    - reads a condition without its `path` key, as `withoutPath` (`record.ts:156-158`) does
    - writes the evaluator once in `collection-text.ts`, since no JS evaluator exists
    - takes a `select`'s first option only from `options`
    - case 4's "`options_from` select" becomes "a `select` with `from`"
11. Premise 7: `sources.yml:52`; `REGISTRY_IDENTITY_FIELDS` :53 (uses :232, :372); `FIRST_LIST` :142 (use :449); `collections.ts` `listOf` :90, `readCollection` :115, `parse` :131; DATA-MAP lines as in section 1.
12. "EntryForm and what it uses":
    - all lines as in section 2
    - remove `vocabOptions`, `vocabWords`, `optionShape`, `optionsShape`, `VOCAB_PREFIX` and the `vocabKeys` import from `collection.ts` with `formFields`
    - name `state/forms/schema.ts`'s `formFields` and `FormField` as different exports that stay, and narrow the Conventions grep to `state/boards/collection.ts`
    - `Leads.svelte:54`, :135 import `formFields`
    - `fs-transport.ts` loses `schemaFieldShape` (:235-255), `whenShape` (:232) and the `SchemaField` import
    - the leads count is 50
13. "The source editor": as recheck 2 correction 12, plus D33 as in section 3. Section 2's "Going to the same place twice" is replaced by "D33's `asked`; M6 passes none". Choice 2 rules the caret. The list of other callers is dropped, since every `openSourceFile` caller gets D33's behaviour.
14. Section 1:
    - Place `collection-text.ts` and `yaml-ranges.ts` in a new folder, so no folder passes ten (`data/helpers/files` holds 9). Recommended: `data/prose/yaml/`, beside the text formats of `data/prose` (9 items, so 10 with the folder). `data/helpers/files/yaml/` also fits.
    - The state row of `ALLOWED` gains that module's path.
    - The table is section 2's rerun (events `link: ""`; venues 1065; data 1070; funding 160; leads 566 and 50 to 51; add pillars 99,11).
    - `entryAt` and `lineOfItem` (`schema/lists.ts:90-111`) share one walk under G21: `lineOfItem` moves to the new module with its `nth`, or `entryAt` takes it. `lists.ts` joins Paths if it moves.
15. Section 2: drop `asked: Date.now()`, the `column`/`asked` additions to `SourceFile` and `SourceTabState`, the `goto` column, and the effect change; D33 has them. Add Z722 (5)'s store function in `source.svelte.ts` (choice 1). Add's second `openSourceFile` passes the place of choice 2.
16. Section 3: the controls of a file with an unsaved source tab are disabled with a new key's title (Z722 (5); scope by choice 1). Empty values follow choice 3. `EntryCard.svelte` is 509 of 520 lines, so a part moves out if the change would pass 520.
17. Section 5.1: the non-ISO deadline test uses `ISO_DATE` of `data/helpers/dates.ts`. Under Z722 (1) only the client `addLead`, the add EntryForm, `adding` and the add `ToolButton`'s toggle go.
18. Section 5.3: lines as in section 2. Add the comment hits of section 2 (`fs.svelte.ts:47`, :132-149, :289, :298, :655; `MessageLine.svelte:3`; `tab-actions.ts:39`; `bookmark-actions.ts:54-78`; `Bookmarks.svelte:13`, :47; `context.ts:374-377`).
19. Section 6: replace the `lead-add` bullet and decision 7 with Z722 (1). The kind, body, branch, undo, app gate, `history.kind_lead_add` and both lead tests stay; `History.svelte`, `history.yml`, `bodies.ts`, `undo.ts` and `undo.test.ts` leave Paths, and case 33 goes. The tests deleted: `form-drafts.test.ts` alone. The test edited: `feeds.test.ts:88` alone.
20. Section 7, the documents:
    - Drop every `HELP.md` target; no HELP.md row names a form (`grep -n -i "form" HELP.md`).
    - Targets: `docs/window.md:66`, `docs/files-and-search.md:25`, `docs/views.md:137`, :145, :243; `docs/configuration.md:68` still true.
    - DESIGN.md: :456, :508, :520, :551, :553, :568 rewritten; :62 and :389 still true.
    - DATA-MAP: :191, :194 (Z722 (3)), :436, :447, :451 (including the false "`raw` is the field type of `retrieval`"), :461, :464, :465.
    - `vocab.yml:255`.
    - Head comments: the full list of section 2, including `vocab-keys.ts:2-3`, `instance-context.ts:5`, `writes.ts:182-185`, :307, `writes/entries.ts:12`, :19, :63, `feeds.ts:597`, `collections.ts:26` and `instances.ts:315`.
21. Section 8: replace with Z722 (3) as section 3 says:
    - in `validate.ts` (424 lines), extending `checkEntryIdentity`, with one new key beside `identity_shared`
    - a registry is skipped only where its first field is its `idField`
    - venues' `id` dropped (M8's `duplicate_key` and `entry_no_id`)
    - funding's `title` checked beside `checkFundingIdentity` with one finding per entry
    - the leads feed added; two empty values not shared
    - case 6's venues fixture expects `entry_no_id` and `duplicate_key` from the existing checks, and the new finding for an empty or shared `name`
22. Z719 joins the brief as its own section:
    - an output guard covering `app.ts:53-56`, :68 and `window-state.ts:40`, a dropped EPIPE and nothing else
    - `app-harness.ts` ends through the app's quit when its starter ends, on a stdin pipe's `end`, with `start.test.ts:120` passing a stdin pipe
    - the G48 run is the orchestrator's at landing
    - Paths gain `src/desktop/app.ts`, `src/desktop/windows/window-state.ts`, `tests/server/desktop/app-harness.ts` and `tests/server/desktop/start.test.ts`, with a possible new module under `src/desktop/` for the guard (8 items there? not counted; the builder checks `folder-check.sh`)
23. Cases:
    - delete lines 266-267 and line 273's scratch-copy clause
    - case 2's rows from section 2's table
    - case 4 per correction 10
    - case 8 per Z722 (5) and choice 1
    - case 14 is D33's behaviour, seen at the look
    - case 33 goes
    - add: Add on a tab whose draft is `notText`, gone, or marked changed on disk; Add on Events (`link: ""` because `role: present`); a venues stub never writing `deadline_month`
    - the first-run sentence says page-only cases are read and named for the look
24. Verify:
    - 2 adds `schema-rules.test.ts`, `integrity.test.ts`, `source.test.ts`, `source-disk.client.test.ts` and `autosave.client.test.ts`, and drops `undo.test.ts` unless `writes.ts` beyond comments changes
    - 3: the first grep is narrowed to `"EntryForm\|entry-form\|BookmarkForm\|form-drafts\|form-values\|open-forms\|newEntry\|deleteEntry\|addLead"` over `src/lib/state src/lib/views` (58 lines on main, `| wc -l`; nothing after). The second grep is replaced by `diff` against the base copy of `bodies.ts`, `undo.ts`, `app-gate.ts`, `apps.ts`, `words.ts`, `history.yml`, `apps.yml` and `docs/apps.md`, printing nothing.
    - 4 runs over the worktree's copies
    - 5 names the sizes of section 4
    - 7 drops the scratch-copy clause and the undo test, and keeps the LinkedIn test's failing line on the unchanged tree
25. Decisions:
    - 1 is settled (all landed; D33 next)
    - 7 is replaced by Z722 (1)
    - 9 stands
    - 3's "`goto` gains a column" goes (choice 2)
    - add Z722 (5), (6) and (7) and Z719 as decisions with their rulings, and the three choices of section 5 once ruled

Usage: agent id not visible to me, claude-opus-5-5, about 85 tool uses, minutes not measured.
Usage (from the completion notice): addf5c4b95029cf06, claude-opus-5-5, 381,566 tokens, 116 tool uses, 14.6 min.
