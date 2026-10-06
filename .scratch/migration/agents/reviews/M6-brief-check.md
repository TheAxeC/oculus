# Step M6 brief check (on main at 273196959)

This is the report of the fresh agent run as the `spec` skill's "Steps / The brief check", on `agents/briefs/M6.md`. Main's head is 273196959. `git diff e6d00fb0f 273196959 --stat -- tools/oculus/src tools/oculus/tests tools/oculus/config tools/oculus/HELP.md tools/oculus/DESIGN.md docs` prints nothing, so the code is X3f's tree at e6d00fb0f. 273196959 added M6.md and four lines to `plan.md`, which moved every Rulings line by 2: Z340 is now `plan.md:1067`, not `:1065`; Z343 is `:1072`, not `:1070`; Z436 is `:1165`, not `:1163`. The Z343 context is `orchestrator-history.md:175`, not `:173`. Nothing was changed anywhere. My probes ran only in my scratchpad and only read hub files.

Premises that depend on steps landing first are marked **(D20)**, **(D38)**, **(D28)** or **(X3e)**. X3e is listed because the brief leaves it out: D28 waits for X3e (`queue.md:13-14`), so M6's base contains X3e too.

## 1. Names

- **`EntryForm`**: `grep -rn "EntryForm" src tests config HELP.md DESIGN.md README.md --exclude=local.yml` prints the brief's nine importers and `DESIGN.md:394` and `:428`. All are in the paths. None is outside them.
- **`lead-add` / `addLead`**: `grep -rn "lead-add\|lead_add\|leadAdd" src tests config HELP.md DESIGN.md README.md ../../docs utils`. Hits outside the paths:
  - `DESIGN.md:324`, "Open kinds: ... `feed-delete`, `lead-add`, `linkedin-idea` ...". **Made false**: the kind goes, and the line is not in the write list.
  - `config/text/views/system/history.yml:45` `kind_lead_add: lead added`. Still true while the undo branches stay, but the brief does not say the key stays.
- **`renderScalar` (moved)**: `grep -rln renderScalar src tests` prints `lines.ts`, `writes/manifest.ts`, `entry-edit/render.ts`, `yaml/yaml-edit.ts` and `yaml-values.ts`. The brief says "its one other importer, `server/edit/writes/manifest.ts:32`". That is **false**: `render.ts:9` and `yaml-edit.ts:53` import it too, and neither file is in the paths. They break unless `yaml-values.ts` re-exports `renderScalar`, and the brief does not say it does.
- **`lineAt`, `listOf` (moved)**: `entry-edit/subtasks.ts:22-23` imports both from `lines.ts`, and it is not in the paths. It holds only if `lines.ts` re-exports them.
- **`listOf` needs `pairOf`**: `lines.ts:152-166` calls `pairOf`, which lives in `server/edit/yaml/yaml-ranges.ts`. `entryPlace` needs `rangeOf` and `valueEnd`, from the same file. The new `data/helpers/files/collection-text.ts` is said to import "`yaml` and `data/helpers/guards.ts` only". It cannot import `yaml-ranges.ts`: that file is server code, and it imports `DEFAULT_INDENT` from `yaml-values.ts`. The brief does not name how these three get to the data layer, and copying them breaks G21 (duplication).
- **Layer boundaries for the new module.** `tests/checks/tree/boundaries.test.ts:145` reads `views: ['ui/**', 'state/**', 'views/shared/**', 'data/shapes/shapes']`. The `state` row (`:146-177`) lists the `data/` modules state may import, and `data/helpers/files/collection-text` is not among them.
  - So `views/shared/forms/entry-file.ts`, the brief's section 2, cannot import `collection-text.ts`, and a state module cannot either until the table gains a row.
  - The brief names neither the boundary-table edit (an allow-list edit, G16) nor a state module to carry the import.
- **`markSchemaFor`, the bookmarks `schema` answer, and `BookmarkForms` comments**: `grep -rn markSchemaFor src` prints `state/sources/explorer/view/bookmark-rows.ts:91` and `views/sources/files/Files.svelte:181`, and the second is the form's only reader.
  - Once the bookmark form goes, `markSchemaFor`, `tree.marks.schema` (`fs.svelte.ts:615`) and the server's `scaffoldSchema` / `BookmarksAnswer.schema` (`server/files/fs/bookmarks.ts:71-88`) lose their reader.
  - `bookmark-rows.ts` and `server/files/fs/bookmarks.ts` are not in the paths.
- **Head comments made false that the brief's list leaves out.** Found with `grep -rn -i "entry form\|the form\b\|add form\|edit form\|bookmark form\|a form\b\|card's form" <the server/edit, server/files, state, views and data folders>`:
  - `server/files/fs.ts:8` ("the entry form edits it")
  - `server/files/fs/bookmarks.ts:5, :45, :71, :87`
  - `server/root/watch/bookmarks.ts:7` ("the Files view's close of a form over a bookmark")
  - `server/edit/entry-edit/render.ts:23` ("what an empty control on the add form means")
  - `state/sources/fs-transport.ts:57` ("what the entry form draws its controls from")
  - `state/sources/explorer/view/bookmark-rows.ts:4, :86`
  - `state/workbench/layout/instances.ts:291` ("entry form drafts all live under the instance id")

  None of these files is in the paths. Some files that are in the paths also carry comments that are not on the brief's list: `server/edit/writes.ts:162, :268`, `entry-edit/entries.ts:35`, `writes/entries.ts:15, :94`, `writes/undo.ts:260`, `state/sources/fs.ts:7`, `state/sources/datasets.ts:3`, `state/feeds/leads.ts:32`, `state/feeds/linkedin.ts:22`, `Domains.svelte:15`, `Data.svelte:15`, `DatasetCard.svelte:17, :61`, `VenueCard.svelte:2, :71`, `Files.svelte:30-43, :171-181`, and `state/boards/collection.ts:75, :91-92`.
- **`DESIGN.md:400`**: "The card's `applied` control opens the Applications add form beside the leads ... `addFromLead` ... writes the lead's status `applied` ... a cancel or a refused add writes nothing to the lead." **Made false** by section 5.1 and Z550 (2). It is not in the paths and not in the brief's DESIGN.md list.
- **`config/text/views/feeds/leads.yml`**: two keys go wrong, and the file is not in the paths.
  - `applied_tip` reads "open the Applications add form beside the leads ...; saving it marks the lead applied". **Made false**.
  - `to_application_replace` reads "The Applications add form holds text you have not saved. Replace it with this lead?". **Made false**, and once `holdsTyped` and the replace question go (`Leads.svelte:142`) it has no reader, so the orphan check (G24) fails.
- **`config/catalogs/vocab.yml:249`**: "The venues edit form's tier dropdown pulls its options from the ASSIGNABLE keys here". **Made false**; not in the paths.
- **`linkedin.form_category_help`**: its only reader is the inline schema of `Linkedin.svelte:86`, which goes. The brief keeps `form_title` and `form_category` but does not say whether `form_category_help` becomes the prompt field's `placeholder` (`ui/forms/prompt.ts` `PromptField.placeholder`) or is removed. Without a reader it is an orphan.
- **Hub data files**: `grep -n -i "form\b\|add/edit\|card's form" <the 13 collection files>` prints one comment in each of 13 hub files that this step makes false:
  - `registries/venues.yml:13`, `registries/data.yml:23`, `registries/pillars.yml:24`
  - `network/events.yml:4`, `network/joint-work.yml:7`
  - `funding/funding.yml:1` ("An entry is edited in its card's form.") and `:4`
  - `tasks/tasks.yml:5`, `education/education.yml:4`, `applications/applications.yml:4`
  - `registries/repos.yml:4`, `registries/boilerplate.yml:9`

  Each says the schema "drives the add/edit modal" or "form". The brief says "this step writes no hub data file", and `agents/spec.md` "Where you work" forbids writing a hub data folder the brief does not name.
- **`tests/server/edit/writes.test.ts:7`**: the brief lists it as false ("what the form offers"). It is **still true**: the sentence is about `config/catalogs/manifest-schema.yml`, the manifest editor's form, which stays. Having it in the write list invites a rewrite of a true sentence.
- **(D20) `server/files/fs/collections.ts`**: D20's landing patch (`agents/reviews/D20-landing.patch:2757-2930`) adds this file. It moves `collectionFile`, `identityField` and `readCollection` there, adds a third `listOf`, and adds the comment "a collection edited by the same form and the same writers". After D20 lands, the brief's pointers move:
  - `writes/entries.ts:58-64` and `:83-86` (premise 7)
  - `REGISTRY_IDENTITY_FIELDS` (`entries.ts:50`)
  - "`readCollection` returns null" (case 5)

Findings:
1. `renderScalar`'s other importers (`render.ts`, `yaml-edit.ts`) and `subtasks.ts` (`lineAt`, `listOf`) are left out of the move and of the paths.
2. `pairOf`, `rangeOf` and `valueEnd` cannot reach the data layer under the brief's import rule.
3. The boundary table forbids `views/shared/forms/entry-file.ts` importing `data/helpers/files/collection-text.ts`, and forbids state importing it without a new row. The brief names neither.
4. `DESIGN.md:324` and `:400`, `leads.yml` `applied_tip` and `to_application_replace`, `vocab.yml:249` and the head comments listed above are made false and are outside the paths.
5. The 13 hub collection files' "add/edit form" comments are made false, and the brief forbids writing them.
6. The bookmarks schema chain (`markSchemaFor`, `marks.schema`, `scaffoldSchema`, `BookmarksAnswer.schema`) is left without a reader, in files outside the paths.
7. `writes.test.ts:7` is still true.
8. `form_category_help` and `kind_lead_add` are not dispositioned.
9. **(D20)** D20 moves `collectionFile`, `identityField` and `readCollection` and adds another `listOf` with a form comment; section 1's moves and the "rule exists once" claim must take it in.

## 2. The step line

The plan's step line is `plan.md:228`, widened by `:229` (Z436), with Z550 at `plan.md:1265`.

- **"the add and edit form every collection shares (EntryForm.svelte) goes"**: sections 4, 5 and 6.
- **"a card's status, deadline and date are changed in place on the card"**: section 3.
- **"with S5's controls"**: section 3 uses the `ui/` primitives S5's `FieldControl` uses, because `views/system/` cannot be imported by a card view (`boundaries.test.ts` views row). This is a reading of the line, stated in the brief.
- **"Add opens the collection's YAML file in the source editor with a new entry built from the file's `schema:` and the caret in it"**: sections 1 and 2.
- **"Edit opens the file at the entry"**: section 2, `editInFile`.
- **Z436, `docs/DATA-MAP.md` rewritten**: section 7.
- **Z550 (1)-(4)**: the brief still carries them as open. Its "For Axel" heading stays; section 5.1 says the lead's status "is 'For Axel' item 2"; section 8 is "built only under (a)"; cases 6 and 17 depend on "For Axel"; Paths says "section 8 only". `grep -n "Z550" agents/briefs/M6.md` prints nothing.

Findings:
1. The brief is not closed to Z550: every "For Axel" conditional still stands, and section 5.1 and case 17 leave the lead's status unbuilt in words. It should state (1) (b), (2) (a), (3) (a) and (4) (a) as ruled.

Every other part of the line has a requirement.

## 3. Premises

- **Premise 1**, the EntryForm grep: rerun as quoted above, it prints the same nine importers and `DESIGN.md:394, :428`. Matches. `wc -l EntryForm.svelte` prints 481. Matches.
- **Premise 2**, bookmarks under no served root:
  - `BOOKMARK_COLLECTION` is `fs.svelte.ts:155`; `collectionFile` with `own` is `writes/entries.ts:65-79`; `options.yml:1197-1199` matches. Matches.
  - `config/sources.yml:88-94` holds the six roots. Matches.
  - `browserRoots` (`server/files/roots.ts:24-36`) also adds the workspace's saved roots (`addedRoots`), so "the hub, the engine and the configured roots" is incomplete. The conclusion stands for the default workspace.
- **Premise 3**:
  - `lead-add` is at `writes.ts:446-452` and `linkedin-idea` at `:454-464`. Match.
  - `addLinkedinIdea` opens at `feeds.ts:222`; the brief says 221.
  - `ls theaxec.github.io/_linkedin | grep -c "\.md$"` prints **19**, and `ls | wc -l` prints 20, because one entry is `xx-easy-problems.jpeg`. The brief says "20 `.md` files".
  - `sources.yml:65` (`leads_file`) and `:75` (`linkedin_dir`). Match.
- **Premise 4**:
  - `grep -n "base\|hash\|mtime" src/lib/state/sessions/source.svelte.ts src/lib/server/files/source.ts` prints `source.ts:26` and `:169` (the `writeTextAtomic` import and its call). Nothing about a base. Matches in substance.
  - `saveSourceDraft` is at `:419`. Matches.
  - **(D28)** D28's brief, section 6.1, moves `state/sessions/source.svelte.ts` to `state/sessions/source/source.svelte.ts`, so M6's paths entry, its Read item 8 and verify item 2's `tests/state/sessions/source.test.ts` must be renamed after D28.
- **Premise 5**: `wc -l Source.svelte` prints 528. Matches. `size.test.ts:28-29` reads `LINES = 900`, `COMPONENT = 540`. Matches. **(D28)** D28's section 6.2 splits it.
- **Premise 6**: `model-collections.ts:29-40` holds `SchemaField` as stated. `grep -c "default:"` over the 13 collection files prints 0 for each. Matches.
- **Premise 7**: `grep -n "An entry is edited" config/sources.yml` prints **`48:`**. The brief says `config/sources.yml:47` in premise 7, in sections 6 and 7, in Paths ("line 47") and under "Paragraphs". `plan.md:230` already says `:48`.
- **EntryForm and what it uses**: rerunning the catalog-key loop (`grep -rln "collection\.<key>\b" src` per key) prints EntryForm alone for the 15 keys. `form_cancel` is also read by `LeadCard`, `form_edit_title` also by `card.ts`, `edit_delete` only by `EntryCard`, `add` and `add_tip` only by `AddButton`. Matches.
- **Client writes**: `grep -n` prints `writeEntry:245`, `reorderEntries:297`, `deleteEntry:302`, `writeFeedField:307`, `addLead:322`, `addLinkedinIdea:327`, `newEntry:341`. Matches.
- **Undo branches**: `undo.ts:156` and `:329` hold `lead-add`. Matches.
- **Decision 7's reason**: the brief says the undo branches stay "since the change log already holds records of that kind". `grep -c 'lead-add' ~/.oculus/changes.jsonl` prints **0** of 50 records. On this machine the log holds none, so the reason is unverified.
- **Tests**: `grep -rln "adding\|editing:\|OpenForms\|newEntry\|deleteEntry\|addLead\|FilesForms\|EntryForm" tests` prints `duplication.test.ts`, `augments.test.ts`, `writes.test.ts` and `feeds.test.ts`. Matches.
  - `feeds.test.ts:82` asserts `addLinkedinIdea(...)` `toEqual({ found, changed, refused, records })`. Section 5.2 gives the outcome an `id`, so this G8 test ('adds a dated LinkedIn idea with a safe slug and numbered collision suffix') fails unless its expectation is edited. The brief names only the G9 test edit and the `addLead` test deletion.
- **The source editor**:
  - `source-file.ts` is 28 lines. Matches.
  - `Source.svelte:7` holds `openedAtShape` and `:168` reads `line`. Match.
  - `views/sources/source/Editor.svelte:162-172` holds the goto effect. Matches. The effect is already in `Editor.svelte`, so "when the goto effect moves into `Editor.svelte`" describes nothing that has to move.
  - `commands.ts:18-22` sets column 1. Matches.
  - `types.ts:50` holds `goto`. Matches.
  - `opening.ts:140-155` is the `openInto` branch. `source` is registered with `group: ''` (`Source.svelte:16`), so it is a view "opened for something" and goes through `openOpened` (`opening.ts:~203-236`), which finds the tab anywhere on the page and restates it. The behaviour holds; the line reference is the wrong branch.
  - The nine other callers of `openSourceFile`: `grep -rln openSourceFile src` lists exactly those nine plus `source-file.ts`. Matches.
- **`yaml` client-side**: `rows.ts:29-35` and `flow.ts:8` import it; installed version 2.9.1. Matches.
- **The collection-file table**: I reran section 1's rule as my own probe (`probe.mjs` in my scratchpad: parse, place after the last value line plus a blank line, the entry lines by the stated rule, reparse). Output:
  - The nine rows of the brief's table reproduce exactly, line, column and entry counts included. For example `registries/venues.yml | "  - name: """ / "    id: """ | 1062,12 | 71,72 | earlier unchanged true`.
  - Four files outside the table also place correctly: `registries/pillars.yml` (`key ""` / `title ""`, 99,11, 9 to 10), `education/education.yml` (`status: planned`, 245,13, 21 to 22), `registries/boilerplate.yml` (`status: draft`, 29,13, 2 to 3) and `registries/repos.yml` (`status: active`, 206,13, 20 to 21).
  - The identity count (`ids.mjs`, mine) prints `empty 0 dup []` for every file, venues' `id` included. Matches.
- **Folders**: `ls` shows `data/helpers/files` holding 5 items, `views/shared/forms` 10, `data/snapshot` 8 and `state/forms` 5. Match. **(D28)** D28 adds `save-text.ts` and `text-edits.ts` to `data/helpers/files`, so M6's new file makes 8.
- **ADRs**: `ls tools/oculus/docs` prints `diagrams` only; `ls docs/adr` at the hub prints "No such file or directory"; neither `.agents/plan.yaml` nor the state file names `adr`. Matches.
- **(D20)** The base's `EntryCard.svelte`: D20 adds `extra` to the props and appends it to both branches of `actions` (`D20-landing.patch:6784-6851`), and it moves the collection-file lookup (section 1 above).
- **(D38)** In D38's worktree, `feeds.ts` is 720 lines and keeps `addLead` (`:330`) apart from `addRadarEntry` (`:448`). `undo.ts:157-158` and `:331-332` join `lead-add` and `radar-add`. So M6 removes `addLead` alone, and the shared helper the brief foresees does not exist in D38's tree as it stands.
- **(X3e)** X3e is not named under "Shared with steps in flight or ahead". It reorders the bookmarks by drag (`agents/briefs/X3e.md` A3, A5, cases 17-18) and changes `Files.svelte` (BookmarkForm at `:245-262` is in its premise), `fs.svelte.ts`, `writes.svelte.ts`, `server/edit/writes.ts`, `Source.svelte` and `state/sessions/source.svelte.ts`. Every line number of section 5.3 and of the Files and Bookmarks head comments moves under it.
- **Further steps not named**: D23 (`ui/controls/editor/types.ts`, `ui/controls/editor/Editor.svelte`, `views/sources/source/Editor.svelte`, `Source.svelte`, `context.ts`), D45 (`Source.svelte`, `fs.svelte.ts`, `context.ts`) and D11 (`types.ts`, both `Editor.svelte` files, `source.svelte.ts`) share files with section 2. Found with `grep -o` over each brief.

Findings:
1. `config/sources.yml:47` is `:48`, in four places.
2. `renderScalar` has three other importers, not one.
3. `_linkedin` holds 19 `.md` files, not 20.
4. `browserRoots` also serves the saved workspace roots.
5. The `opening.ts:140-155` reference names the wrong branch; source tabs go through `openOpened`.
6. The goto effect is already in `Editor.svelte`.
7. The change log holds 0 `lead-add` records here, so decision 7's stated reason is not verified.
8. The G8 LinkedIn test's `toEqual` must change with section 5.2's `id`, and the brief does not list that assertion edit.
9. **(D28)** the paths and verify item 2 name the pre-move `source.svelte.ts` and its test path.
10. **(X3e)** X3e is missing from the shared list and from "after which steps".
11. D23, D45 and D11 share files with section 2 and are not named.
12. The plan line numbers in the authority paragraph drifted by 2.

## 4. Cases and checks

- **Case 1**, "nothing is written before Cmd+S". This holds only with `editor.autosave` `off`. **(D28)** D28's section 2.2 saves a tab after each edit under `after_delay` and when the editor loses focus under `on_focus_change`. With either on, the stub `title: ""` reaches disk, the entry gets an empty identity, the in-place controls go disabled, and the step's own finding fires. The case is inconsistent with the tree it is written for.
- **Case 3**, a file with no `schema:`. Add is drawn only `{#if schema !== undefined}` (`Collection.svelte:235`), and a card whose file has no schema is not `addressable` (`EntryCard.svelte:116`), so it carries status buttons and no edit control (`:146-155`). Neither Add nor Edit is reachable in the view for such a file. Either the case is a unit case of `entryLines` and `entryAt` alone, or section 4 must draw Add and Edit in File for a file with no schema; the brief says neither.
- **Case 6**, an empty identity. On main such an entry is not `addressable` (`value !== ''` at `EntryCard.svelte:116`), so it takes the no-schema branch: status buttons that write by `entry.id`, and no Edit. Section 3 draws disabled in-place controls, and the case has "Edit on the shared one opens at the first". The brief does not say what replaces the not-`addressable` branch for an entry with an empty identity in a file that has a schema. It also does not say whether section 8 checks `KEYED_FIELDS` (venues' `id`). An empty venue `id` hides the entry from Venues (`byId`, `normalise.ts:128-135`), which is exactly the cost Z550 (4) was ruled to answer.
- **Case 17**, a lead's `applied`. It defers the lead's status to "For Axel" item 2, which Z550 has ruled (a).
- **The test paragraph** ("No new test and no new guarded entry") holds against `agents/spec.md` "What every package obeys": a test only under a `guarded.md` entry, a new entry needs Axel's yes. It also fits the test rule, a test only where failure costs something. Three points:
  1. The `appendEntry` move stays under G8 and its test 'appends a new entry rendered from the file schema' (`writes.test.ts:110-136`, which asserts the exact text). Sound.
  2. The G8 LinkedIn test changes with the new `id` and is not listed (section 3 above).
  3. Section 8 adds a finding rule to `data/snapshot/`, which G15 and G32 name as their code. Neither entry's text covers a collection identity finding, and G14 (the real hub builds with no findings) passes whether or not the check is wired. That no test is kept is consistent with the rules. The case 6 run must show the two findings on fixtures, or nothing proves the check runs.
- **Verify item 3** expects the grep to print "only the `lead-add` undo branches and the rewritten undo test's record". `grep -rn "newEntry\|deleteEntry" src` also hits server code that stays under decision 8: `writes.ts:59, :68, :191, :200, :365, :393`; `bodies.ts:200, :212, :337-352`; `entry-edit/entries.ts:284`; `entry-edit/index.ts:7`; `writes/entries.ts:31, :488`; `feeds.ts:22, :513`. The check as written cannot pass, and a builder would have to loosen it or report it.

Findings:
1. Case 1 is inconsistent with D28's autosave.
2. Case 3 is unreachable through the view.
3. Case 6 conflicts with the existing not-`addressable` branch and does not say whether venues' `id` is checked.
4. Case 17 is not closed to Z550.
5. Verify item 3's expected output is impossible while `new-entry` and `delete-entry` stay.

## 5. The question

The goal is the part of the plan's goal this step delivers: the collection forms removed, with in-place status, deadline and date, and Add and Edit through the file.

- **Verify 1** (checks.sh, the quick list): yes, it could pass without the goal. It proves the tree is consistent, not that Add places a stub. That is acceptable only together with the look.
- **Verify 3** (the name grep): yes. It proves names are gone, not that replacements work. As written it also cannot pass (section 4).
- **Verify 4** (`entryStub` over the real files): yes, it could pass with the views never calling `addInFile`. The look covers that for Tasks, Venues and Leads only. Add on Data, Pillars, Domains and the other collections, and Edit on a registry card other than a venue, are not in the look list.
- **Verify 7** (the G9 undo test with the branch removed): no. Its failing line proves the kept branch.
- **The look list**: Remove Bookmark, a `date` field set in place (only `deadline` is listed), and the Findings view under item 4 (a) are not in it. Section 8 can pass G14 with the check never called.
- **Cases 1, 2, 7, 9 and 13-15**, checked by "a quoted `node` run over the fixtures": these exercise `collection-text.ts` alone. They pass without `addInFile` keeping the tab, focusing it or going to the caret. Only the look closes them.
- **Case 8**: no, provided D28 has landed.
- **Case 20**: no.
- **Section 3's in-place items**: they are DOM behaviour and rest on the look (`agents/spec.md` "A behaviour that needs a DOM"). Fine as written for Tasks and Venues. Events' `date` and an applications `deadline` are not looked at.

Findings:
1. Verify 4 and the node-run cases prove the helper and not the step. The look list should add Add on one registry (Data or Pillars), a `date` set in place, Remove Bookmark, and the Findings view under 4 (a).
2. Section 8 needs a run that shows its two findings on fixtures. Otherwise G14 passes with the check unwired.

## 6. Implied inputs

This is a code step. Each input below is implied by the step and missing from "Cases", with the result it should have.

- **The file open in a preview tab.** `openOpened` finds and restates the preview tab. `addInFile` writes through `editSourceDraft`, which does not call `keepPreview`; typing does (`Source.svelte:385-388`). The next single click in Files retargets that tab and `clearInstanceState`s it (`opening.ts`, the `retarget` path), dropping an unsaved stub without the close question. G28's "closing ... asks first" covers this. Expected: Add keeps the tab (`keepPreview(id)`) and the stub survives a single click elsewhere.
- **`editor.autosave` `after_delay` or `on_focus_change` (D28).** Expected: say whether an inserted stub is saved by autosave. If it is not, the insertion must not count as a reader edit for the timer.
- **The tab closed while Add's draft read is in flight, and `openSourceFile` answering `''` (no page).** `addInFile` would then `editSourceDraft` an instance that no longer exists. `reloadSource` guards with `ui.instanceState(id) === undefined`; the brief does not. Expected: nothing is written into a closed or absent instance.
- **Add pressed twice before the first read returns.** Expected: one stub and the caret on it. Case 7 covers only sequential presses.
- **A list whose items are not indented by two spaces.** Probe `zero.mjs`: `entries:\n- title: A\n` with the two-space stub parses with errors `BLOCK_AS_IMPLICIT_KEY, MULTILINE_IMPLICIT_KEY, MISSING_CHAR`. Every hub file is two-space today (`grep -c '^- '` prints 0 for all 13), but after M6 every edit is by hand. Expected: `entryStub` takes the list's own indentation, or reparses its result as the brief's own probe did and refuses with a sentence. It must never put a draft that does not parse in front of the reader. `agents/spec.md` "A write that edits a file's text re-parses its own result" is the rule nearest to this.
- **The list key holding a scalar** (`entries: foo`). Section 1 lists a refusal ("the key holds no list"), but no case or sentence names it. Expected: nothing inserted, the tab opened at the key, a sentence said.
- **A lead whose `deadline` is not an ISO date.** `grep -h "^    deadline:" feeds/position-leads.yml` prints `"rolling (open)"` for 4 of 46 leads. `applicationFromLead` copies it into the applications schema's `date` field. The source save checks no type, so it lands where the form's `typeRefusal` used to refuse it. Expected: a non-date deadline is left out of the stub, or kept and named.
- **The lead's `applied` when the Applications Add is refused** (an unparsed, read-only or inline list in `applications.yml`), and when the lead's `feed-field` write is refused, under Z550 (2) (a). Expected: say which runs first, and whether the lead stays `open` when the stub cannot be placed.
- **An in-place write superseded by a second pick, or answered after the card unmounted** (a filter change). `agents/spec.md` asks every asynchronous path in flight, after close and superseded to be stated. Expected: the last pick wins, and an answer for an unmounted card says nothing.
- **A saved Files instance with `form: 'bookmark'` and `editing` set** (G29). `formShape` has `.catch('')` (`files-view.ts:144`), so it reads as no form. Expected: stated, with the other Files keys kept.
- **The file open in a tab on another page.** `openOpened` searches only the current page, so a second tab with its own draft opens. Expected: say which draft takes the stub.
- **The `lead` key of `CollectionState`** (`state/boards/collection.ts:91-94, :107-110, :126`). It is written only by the lead-to-form flow that goes, and the brief keeps "their other keys". Expected: the key and its parse go with the flow, or the brief says why they stay.
- **Leads' Add no longer fills `date`.** `addLead` filled today's date (G8 'adds a lead in schema order with date and status defaults'). The new rule gives only `title` and `status`. This changes what the reader gets and is not among the brief's decisions.

Findings: every item above is missing from "Cases".

## 7. ADRs

- No record. `ls tools/oculus/docs` prints `diagrams`; `ls docs/adr` at the hub prints "No such file or directory"; the configuration names no `adr`.

Findings: none.

## 8. Dictated text

Each line below is located with `grep -n -F '<words>' agents/briefs/M6.md`.

- `collection.add_tip`: `Add an entry in the file` (`:138`). Holds.
- `collection.edit_in_file`: `Edit in File`; `edit_in_file_title`: `Open {0} at this entry` (`:139`). Holds.
- `collection.file_unparsed`: `{0} does not parse: {1}` (`:181`). Holds.
- `collection.list_inline`: `{0} lists its entries inline; add the entry in the file` (`:185`). Holds.
- `collection.entry_gone`: `{0} is no longer in {1}` (`:189`). Holds.
- `files.bookmark_rename`: `Rename Bookmark...` (`:150`, `:286`). Holds: three ASCII dots, VS Code's label form.
- `files.bookmark_remove`: `Remove Bookmark` (`:150`). Holds as prose. `config/text/views/sources/files.yml:103` already has `menu_remove_bookmark: Remove Bookmark`, the same words under a second key. `agents/spec.md`'s reuse rule ("reuse what exists") points at the existing key.
- `files.bookmarks_empty`: `No bookmark yet. The star on a file adds one.` (`:150`). Holds.
- `linkedin.add_ask`: `A new idea`; `linkedin.add_verb`: `Add Idea` (`:148`). Hold.
- `findings.validate.entry_identity_empty`: `{0}: entry {1} has no {2}`; `entry_identity_shared`: `{0}: {1} is the {2} of {3} entries` (`:171`). Hold.
- `a LinkedIn idea needs a title` (`:148`, `:194`). This is the existing server text, `feeds.ts:229`. Holds.
- Not dictated, since no words are given, so the builder words them: `collection.stray_status`, `identity_unusable`, `files.bookmark_rename_title`, `bookmark_rename_ask`, `bookmark_remove_title`.
  - `config/text/views/system/workbench.yml:51` already holds S5's stray words, `not_in_list: not in the list`.
- `LC_ALL=C grep -n '[^ -~]' agents/briefs/M6.md` prints nothing.

Findings:
1. `files.bookmark_remove` repeats `files.menu_remove_bookmark` under a new key.
2. `collection.stray_status` would repeat `workbench.not_in_list`.

No dictated line breaks a page's prose rule.

## Declined to judge

- Whether the brief's reading of "with S5's controls" as S5's `ui/` primitives, rather than `FieldControl` itself, is what Axel meant. Only he can say. The boundary table makes the literal reading impossible without moving `FieldControl` into `views/shared/`.
- Where the false "add/edit form" comments of the 13 hub data files belong: widening M6's write list to them (an exception to the write ban), or M8, which edits the `schema:` blocks. This is a scope choice for the orchestrator.
- Whether the `lead-add` undo branches should stay with no record on this machine. The rule (YAGNI) and the brief's reason (records "the log holds") point different ways once the log is known to hold none. Another machine's log was not read.
- D28's own design. Read only for what M6 rests on.

Agent usage: my agent id and served model are not visible to me. About 85 tool uses; tokens and minutes are not known to me.

Usage of the brief check: ordo-high on claude-opus-5-5 (a0ebc241025bf8a8f), 338,515 tokens, 132 tool uses, 16.3 min (completion notice).

## Closed

Each finding is closed in `agents/briefs/M6.md`, by the section named; each check was run on main at 88431d114, whose code is e6d00fb0f's.

**1. Names**

1. `renderScalar`, `lineAt`, `listOf` importers. Section 1 moves `renderScalar` with its type `ScalarFieldValue`, `lineAt`, `listOf` and `LIST` to `data/helpers/files/collection-text.ts`, and every importer imports from there: `entry-edit/lines.ts`, `entry-edit/entries.ts`, `entry-edit/render.ts`, `entry-edit/subtasks.ts`, `yaml/yaml-edit.ts`, `yaml/yaml-values.ts`, `writes/manifest.ts`. No re-export is left; the section states a grep that must print nothing. Each importer is in Paths. Checked: `grep -rln renderScalar src tests` (5 files), `grep -rn "\blineAt\b\|\blistOf\b\|\bLIST\b" src` (lines.ts, entries.ts:16, :20, :22, subtasks.ts:22-23).
2. `pairOf`, `rangeOf`, `valueEnd` at the data layer. Section 1 moves the whole of `server/edit/yaml/yaml-ranges.ts` to `data/helpers/files/yaml-ranges.ts` with `DEFAULT_INDENT`, and deletes the server file, so each function exists once. My choice over moving three functions alone: the module's one concern is node positions, and a split would put that concern in two layers. Its importers (`grep -rln "yaml-ranges" src tests utils`: entries.ts, lines.ts, host-status.ts, subtasks.ts, yaml-edit.ts) and `DEFAULT_INDENT`'s (`yaml-values.ts`, `yaml-edit.ts:45`) import from there and are in Paths. The new module's import rule is restated: `yaml`, `guards.ts` and `./yaml-ranges.ts`. `data/helpers/files` reaches 9 items with D28's two files.
3. The boundary table. Premise list "The YAML helpers the rule needs" quotes the views row (`sed -n 145p` of `boundaries.test.ts`) and the data and server rows (`:179-180`). Section 2 adds the state module `state/sessions/source/draft-entry.ts` (`placeEntry`, `findEntry`), which carries the `collection-text` import; `views/shared/forms/entry-file.ts` keeps the tab opening and imports no data helper. The state row of `ALLOWED` gains `'data/helpers/files/collection-text'`, an allow-list edit the report lists with its before and after (section 2 and the Report part). `boundaries.test.ts` is in Paths.
4. Documents and head comments made false. Paths gain `DESIGN.md` `:151`, `:324`, `:362`, `:400`, `:405` (beside `:394`, `:421`, `:428`), `config/text/views/feeds/leads.yml` (`applied_tip` rewritten to Z550 (2); `to_application_replace` removed with its reader `Leads.svelte:142`), `config/catalogs/vocab.yml` line 249, and the files of every head comment listed. Section 7 gives each sentence its new sense in one line. Checked: `grep -n "lead-add" DESIGN.md` (`:324`), `grep -n -i -E "add form|edit form|entry form|bookmark form|the form\b|addFromLead|..." DESIGN.md`, `grep -n "applied_tip\|to_application_replace" config/text/views/feeds/leads.yml` (`:6`, `:12`), `grep -rn "to_application_replace" src` (`Leads.svelte:142`), `sed -n 249p config/catalogs/vocab.yml`, and the comment-line grep over `src/lib/server`, `state`, `views`, `data`, `ui` (each hit read). Beyond the report's list I added `server/files/fs/bookmarks.ts:15-16` and `:71-72`, `server/files/fs.ts:449`, `state/sources/explorer/view/files-view.ts:59` and `feeds.ts:398` (names `addLead`); `writes/undo.ts:260` is listed as still true (the manifest editor's form).
5. Hub collection-file comments. "this step writes no hub data file" is replaced by the fourteen comment lines, one per line in Paths and in "Paragraphs and head comments": `registries/data.yml:23`, `venues.yml:13`, `pillars.yml:24`, `domains.yml:1`, `boilerplate.yml:9`, `repos.yml:4`, `funding/funding.yml:1` and `:4`, `network/events.yml:1` and `:4`, `network/joint-work.yml:7`, `education/education.yml:4`, `applications/applications.yml:4`, `tasks/tasks.yml:5`. The report counted 13 files; `grep -n -i -E "^\s*#.*(\bform\b|add/edit|\bmodal\b|card's form)"` over the 13 collection files and the leads feed prints 15 lines in 12 files, of which `registries/data.yml:572` is a dataset's own registration form and stays, so twelve files and fourteen lines (`registries/domains.yml:1` and `network/events.yml:1` were not in the report's list). Section 7 says how each is rewritten (comment lines only, the `Form schema:` label included) and verify 8 compares each file's parsed YAML before and after; the base copy's `git archive` gains the twelve files and `docs/DATA-MAP.md`.
6. The bookmarks schema chain. Section 5.3 removes `markSchemaFor` and `markSchema` (`bookmark-rows.ts:86-97`, `Files.svelte:181`), `BookmarksState.schema` and `NO_BOOKMARKS.schema` (`fs-transport.ts:57-58`, `:185`), `schemaFieldShape` and `bookmarksShape.schema` (`fs.svelte.ts:202-218`, `:615`), `scaffoldSchema` and `BookmarksAnswer.schema` (`server/files/fs/bookmarks.ts:75-77`, `:88`, `readBookmarks` answering entries alone); `SCAFFOLD` keeps its `schema:`, which the server's writers read. Files added to Paths: `server/files/fs/bookmarks.ts`, `server/files/fs.ts`, `state/sources/fs-transport.ts`, `bookmark-rows.ts`. No test reads the chain: `grep -rln "markSchemaFor\|scaffoldSchema\|BookmarksAnswer" tests` prints nothing.
7. `writes.test.ts:7` leaves the paths and the list of false sentences (`sed -n 7p tests/server/edit/writes.test.ts` names the manifest schema's form).
8. `form_category_help` becomes the placeholder of the prompt's category field (section 5.2, `PromptField.placeholder`, `ui/forms/prompt.ts:12`); case 18 checks it shows. `kind_lead_add`: the undo of a record of an unknown kind was read: `valueNow` falls to `collectionFor` (`undo.ts:166`), `collectionOf` (`:86-91`) finds no collection for the leads file (`config/sources.yml:49-62` against `:65`), the record reads `found: false`, `undoChange` answers `{ error: 'gone' }` (`:232`), said as `history.gone` (`history.yml:26`), and nothing is written. So the `lead-add` undo branches (`undo.ts:153-164`, `:327-333`, `feedUndo`'s last line `:347` with the `deleteFeedEntry` import at `:27`), `history.kind_lead_add` (`history.yml:45`) and the lead-add half of the G9 test go (decision 7, section 6). One more thing the read found: History's `kindOf` (`History.svelte:99-101`) calls `t()` on `history.kind_<kind>`, and `t` throws on a missing key (`text.ts:52-54`); section 6 makes it answer an unknown kind through `hasText` (`text.ts:63`) with the new key `history.kind_other` (`write`), so a `lead-add` record in another machine's log draws a row. `History.svelte` and `history.yml` join Paths, case 33 covers it, and the keys check that makes `kind_lead_add` an orphan once the body kind goes is named (`tests/fixtures/kinds.ts:17-24`, `keys.test.ts:170-176`).
9. D20's `collections.ts`. Premise 7 points `collectionFile`, `identityField`, `readCollection` and the data `listOf` at `server/files/fs/collections.ts` (`D20-landing.patch:2757-2930`) and says `REGISTRY_IDENTITY_FIELDS` and `FIRST_LIST` stay in `writes/entries.ts`. Section 1 makes the shared `listOf` the one copy: D20's data `listOf` and its shapes go, `readCollection` parses with `parseDocument` and takes its list from the shared rule; `FIRST_LIST` is replaced by `LIST`; `REGISTRY_IDENTITY_FIELDS` moves as `KEYED_FIELDS`. The `collectionFile` doc comment is rewritten (section 7). The file is in Paths and in D20's shared entry. Case 5 names `readCollection` of that file. I dropped the brief's earlier move of `listKey` (`data/sources/collections.ts:22-24`): Add finds its list through the shared `listOf`, so `data/sources/collections.ts` is no longer written.

**2. The step line**

1. Closed to Z550. The "For Axel" heading and its four items are gone; they are decisions 10 to 13 with Z550's choices and the lazy options it named. Section 5.1 builds the lead's status write, section 8 is built unconditionally with `KEYED_FIELDS`, cases 6 and 17 have one result each, and Paths names section 8's files without a condition. The authority paragraph cites Z550 at `plan.md:1265` and the plan line quotes `:231`. Checked: `grep -n "For Axel" agents/briefs/M6.md` prints nothing; `grep -n "^- Z550 " plan.md` prints `1265:`.

**3. Premises**

1. `config/sources.yml:48` in every place (premise 7, section 7, Paths, "Paragraphs"). `grep -n "An entry is edited" config/sources.yml` prints `48:`; `grep -n "sources.yml:47\|line 47" agents/briefs/M6.md` prints nothing.
2. Three importers of `renderScalar` outside `yaml-values.ts` and `lines.ts` (`render.ts:9`, `yaml-edit.ts:53`, `writes/manifest.ts:32`), with the premise corrected and the grep quoted.
3. Premise 3 says 19 `.md` files and names the `.jpeg` (`ls ../../theaxec.github.io/_linkedin | grep -c "\.md$"` prints 19, `ls | wc -l` 20), and `addLinkedinIdea` at `feeds.ts:222`.
4. Premise 2 names the saved workspace roots (`addedRoots`, `roots.ts:24-36`) and says the step does not rely on a saved root naming `~/.oculus`.
5. The source editor bullet says `opening.ts:134` takes a `group: ''` view into `openOpened` (`:212-270`), which finds the tab on the current page by root and path and retargets a preview tab. `grep -n "openOpened\|isPage(held)" opening.ts` prints `134:` and `212:`.
6. The goto effect is described as being in `views/sources/source/Editor.svelte:162-172` already; section 2 changes its key (line, column, asked) in place.
7. Decision 7 per ruling 8, with the evidence (0 of 50 records, the `gone` path, the `kindOf` fallback). See Names 8.
8. The G8 LinkedIn test's `toEqual` (`feeds.test.ts:82`) gains `id: 'xx-easy-problems-2.md'`; it is named in the premises, in the Tests paragraph, in verify 7 and in the Report's list of assertion edits.
9. Premise 4 says D28 6.1 moves the source store to `state/sessions/source/source.svelte.ts` and that the store's test is named at the base by `ls tests/state/sessions tests/state/sessions/source`; Paths, Read 8 and verify 2 use D28's path.
10. X3e is in "When this step's builder starts" ("after D20, D38, X3e and D28"), in premise 4 (`queue.md`: D28 once X3e has landed, X3e once D20 has landed) and in the shared list with its files (`Files.svelte`, `Sections.svelte`, `Bookmarks.svelte`, `fs.svelte.ts`, `files-view.ts`, the source store, `Source.svelte`, `writes.ts`, `files.yml`, `undo.test.ts`, `HELP.md:120-121`).
11. D23, D45 and D11 are in the shared list with their files, read from each brief's Paths: D23 `ui/controls/editor/types.ts`, both `Editor.svelte`, `Source.svelte`, `context.ts`, `files.yml`, `HELP.md`, `DESIGN.md`; D45 `Source.svelte`, `context.ts:320-335`, `files.yml:92`, `boundaries.test.ts`, `HELP.md`, `DESIGN.md`; D11 `Source.svelte`, both `Editor.svelte`, `context.ts`, `shapes.ts`, `HELP.md`, `DESIGN.md`. M8 is named as well.
12. Plan line numbers: Z340 `:1067`, Z343 `:1072`, Z436 `:1165`, Z550 `:1265`, `orchestrator-history.md:175`, with the command and its output in the authority paragraph.

**4. Cases and checks**

1. Case 1 says both: with `editor.autosave` `off` nothing is written before Cmd+S; under `after_delay` or `on_focus_change` the stub is saved by autosave as a typed edit is, and the saved entry shows its empty-identity finding (and disabled in-place controls) until its title is filled. Section 2 states the same rule.
2. Case 3 is a unit case of the placement rule, a `node` run of `entryStub` and `entryAt` over a fixture with no schema, with its expected lines, caret and `entryAt` answer; Add stays undrawn for a file with no schema (`Collection.svelte:235`), and its cards keep the status buttons, as on main.
3. Case 6 and sections 3 and 4: for a file with a schema the not-addressable branch of `EntryCard.svelte:116` no longer applies; an entry with an empty or shared identity draws its in-place controls disabled with `collection.identity_unusable`, and Edit in File opens it by its position (`entryAtIndex`, the snapshot's `Entry.index`). Section 8 checks `KEYED_FIELDS` (venues' `id`), with case 6's venues fixture. One addition beyond the ruling: the server refuses every write to a file holding two entries of one identity, not only to the pair (`grep -n "duplicate(held)" src/lib/server/edit/writes/entries.ts` prints `:353`, `:453`, `:483`, `:515`, the four writers), so every card of such a file draws its writing controls (in-place, pin, reorder grip) disabled, and `identity_unusable`'s words cover both reasons. A card for an entry with no schema keeps the status buttons.
4. Case 17 has the one result of Z550 (2): Applications opens beside the leads with the stub, and the lead's status is then written `applied` as a `feed-field` record.
5. Verify 3 is narrowed to the client names under `src/lib/state` and `src/lib/views`, plus a second grep over the server, routes, tests, config and `DESIGN.md` for the `lead-add` names alone; each expects nothing after the step, and the brief quotes each count on main: 59 lines and 19 lines (`writes.ts` 6, `feeds.ts` 2, `bodies.ts` 4, `undo.ts` 2, `feeds.test.ts` 2, `undo.test.ts` 1, `history.yml` 1, `DESIGN.md` 1), from `| wc -l` and `| cut -d: -f1 | sort | uniq -c` reruns. Every file the first grep hits on main is a file this step deletes or changes. The server's `new-entry` and `delete-entry` writers are outside both.

**5. The question**

1. The look list gains Add on Data and Pillars, Edit on a dataset (a registry card other than a venue), a `date` set in place on Events, a deadline on Applications, Rename Bookmark... and Remove Bookmark with History's undo, and the Findings view. The ruling's item "(5)" maps to this finding and to case 6's content (Cases finding 3).
2. Case 6 quotes the two findings from a `node` run of section 8's check over both fixtures (the collection fixture and the venues fixture), and the Tests paragraph and verify 4 say this run is the proof the check runs, since G14 passes with it unwired.

**6. Implied inputs**

Each item is a case:
- A preview tab: case 21; section 2 calls `keepPreview(id)`.
- Autosave: case 1 and section 2.
- Tab closed or no page while the read is in flight: case 22; section 2 checks `openSourceFile`'s `''` and `ui.instanceState(id) === undefined` after the await.
- Two presses in flight: case 23; `placeEntry` runs synchronously after the await and `isUntouchedStub` finds the first stub.
- A list not indented by two spaces: case 24; `entryLines` takes the list's own indentation and `entryStub` reparses, refusing with `collection.stub_unparsed`.
- A list key holding a scalar: case 25, `collection.list_not_a_list`.
- A non-ISO lead deadline: case 26, left out of the stub. The report counted 4; `grep -h "^    deadline:" feeds/position-leads.yml | grep -v -E 'deadline: "?[0-9]{4}-[0-9]{2}-[0-9]{2}"?$' | wc -l` prints 9 of 46, written in the brief.
- `applied` order and refusals: case 27 and section 5.1 (the stub placed first, the lead written after; a refused Add leaves the lead `open`; a refused lead write keeps the stub).
- Superseded in-place picks and unmounted cards: case 28 and section 3.
- A saved Files instance with `form: 'bookmark'`: case 29 and section 5.3.
- The file open on another page: case 30 and section 2.
- `CollectionState.lead`: case 31; section 4 removes the key and its parse (`collection.ts:91-94`, `:107-110`, `:126`).
- Leads' Add date: case 32; section 5.1 passes `values: { date: localDate(Date.now()) }` (`feeds.ts:364-366` is `addLead`'s default), and section 1's table row for the leads file shows `date: <today>`.

**8. Dictated text**

1. `files.bookmark_remove` is dropped; the row control reads `files.menu_remove_bookmark` (`files.yml:103`, `grep -n "menu_remove_bookmark" config/text/views/sources/files.yml`).
2. `collection.stray_status` is dropped; the stray Tag reads `settings.not_in_list`. The report named it `workbench.not_in_list`; the key's group is `settings` (`config/text/views/system/workbench.yml:10` opens the `settings:` group that holds `not_in_list` at `:51`, and `grep -rn "not_in_list" src` prints `FieldControl.svelte:126`, `:211`, `:222`, `:233` reading `settings.not_in_list`). A view reads another group's keys already (`EntryCard.svelte` reads `project.action.*` and `editor.saved`), so no layer rule stops the reuse.

New dictated lines, each read against the prose rules and ASCII: `collection.list_not_a_list` `{1} in {0} is not a list; add the entry in the file`, `collection.stub_unparsed` `{0} would not parse with the new entry in it; add the entry in the file`, `history.kind_other` `write`.

`LC_ALL=C grep -n '[^ -~]' agents/briefs/M6.md` prints nothing.

Usage of the closing: ordo-high on claude-opus-5-5 (ad9ce45922c35f90e), 150,543 tokens, 121 tool uses, 23.1 min (completion notice).
