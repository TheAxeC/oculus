# Step M6 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/M6, base 0e9bde803)

Summary for the orchestrator: every check the brief names passes when rerun, and every count the report quotes from them matches. The report's first line, "Everything in the brief is done", is wrong in two places. First, app-frame writes skip the unsaved-text refusal (3a). Second, the reorder grip is not drawn disabled (3). There is also one behaviour defect in the identity faults: when a file holds two different shared values, Edit in File on the second pair opens the wrong entry. Smaller findings follow under each heading.

## Verification (rerun by the reviewer)

```
Item 1, diagrams. `npm run diagrams` writes docs/diagrams, so it was replaced by the read-only staleFiles() of utils/diagrams/diagrams.mjs (the comparison that script's check makes), run from tools/oculus:
$ node scratchpad/m6r/stale.mjs "$PWD"
stale diagram files: 0

Item 1, from tools/oculus: npm run test:quick
test:quick: 146 changed file(s), from git since HEAD
test:quick: 69 test file(s), 10 essential
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      svelte-kit sync (2.0 s)
ok      eslint (1.8 s)
ok      svelte-check (6.1 s): 1791472254992 COMPLETED 433 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (20.1 s): Duration  16.15s (transform 26.67s, setup 0ms, import 40.06s, tests 21.52s, environment 304ms)
test:quick: 20.7 s (limit 45.0 s); every command passed
exit 0
(The report ran it with 131 given paths; this run took git's list, 146 files including the hub comment files and docs/diagrams. The selection is the same 69 test files.)

Item 2: npx vitest run <the 23 files of item 2> tests/routes/edit/undo/undo.test.ts tests/state/client/held-unsaved.test.ts --testTimeout=300000
 Test Files  25 passed (25)
      Tests  187 passed (187)
exit 0
npx vitest run tests/server/edit/feeds.test.ts --reporter=verbose
 ✓ ... adds a dated LinkedIn idea with a safe slug and numbered collision suffix 174ms
 ✓ ... promotes an idea past 01-A and moves its same-basename sidecar 5ms
 ✓ ... adds a lead in schema order with date and status defaults 15ms
 ✓ ... uses each feed identity and allows only its field 24ms
 ✓ ... deletes leads and refuses deletion from the other feeds 11ms
 ✓ ... adds a Lit Watch entry in the order given and refuses one whose title or address is in the file 84ms
 Test Files  1 passed (1)
      Tests  6 passed (6)
(The ✓ glyphs are vitest's own output, quoted as printed.)

Item 3: grep -rn "EntryForm\|entry-form\|BookmarkForm\|form-drafts\|form-values\|open-forms\|newEntry\|deleteEntry\|addLead" src/lib/state src/lib/views
grep exit 1 (nothing printed); the same grep over the base copy: 58 lines.
diff -q of base and worktree, exit status per file:
src/lib/server/edit/writes/bodies.ts diff-exit 0
src/lib/server/edit/writes/undo.ts diff-exit 0
src/lib/server/edit/writes/app-gate.ts diff-exit 0
src/lib/state/system/apps/words.ts diff-exit 0
src/lib/data/helpers/files/apps.ts diff-exit 0
config/text/views/system/history.yml diff-exit 0
config/text/views/apps/apps.yml diff-exit 0
docs/apps.md diff-exit 0
(The brief's paths state/system/apps/app-gate.ts and config/text/views/system/apps.yml exist in neither tree, as the report says.)
Re-export grep: grep -rn "export {[^}]*\(renderScalar\|lineAt\|listOf\|LIST\|pairOf\|rangeOf\|valueEnd\|DEFAULT_INDENT\|KEYED_FIELDS\)" src/lib/server
reexport exit 1 (nothing printed)
Removed-names grep over src tests config docs HELP.md DESIGN.md README.md ../../docs/DATA-MAP.md (--exclude=local.yml): hits only for names that are kept (files.menu_add_bookmark; VOCAB_PREFIX in state/forms/schema.ts:180 and data/snapshot/schema/lists.ts:28, both in the base copy too; lineOfItem in lists.ts:91, now a call of itemWith; yaml-ranges at its new path).

Item 4: npx tsx scratchpad/m6r/probe.ts "$PWD" (read only, the worktree's hub copies)
tasks/tasks.yml |   - title: "" /     status: todo | caret 45,13 | 3,4 | after line 42 | lead [""] | list entries | edits 1
network/events.yml |   - title: "" /     role: present /     status: upcoming /     link: "" | caret 111,13 | 7,8 | after line 108 | lead [""] | list entries | edits 1
network/joint-work.yml |   - key: "" /     title: "" /     person: /     status: exploring | caret 111,11 | 13,14 | after line 108 | lead [""] | list entries | edits 1
registries/venues.yml |   - name: "" /     id: "" | caret 1065,12 | 71,72 | after line 1062 | lead [""] | list entries | edits 1
registries/data.yml |   - key: "" /     name: "" | caret 1070,11 | 54,55 | after line 1067 | lead [""] | list datasets | edits 1
applications/applications.yml |   - title: "" /     status: not applied | caret 412,13 | 25,26 | after line 409 | lead [""] | list entries | edits 1
funding/funding.yml |   - title: "" /     status: in-prep | caret 160,13 | 11,12 | after line 157 | lead [""] | list entries | edits 1
registries/domains.yml |   - key: "" /     title: "" | caret 57,11 | 12,13 | after line 54 | lead [""] | list entries | edits 1
registries/pillars.yml |   - key: "" /     title: "" | caret 99,11 | 9,10 | after line 96 | lead [""] | list entries | edits 1
education/education.yml |   - title: "" /     status: planned | caret 245,13 | 21,22 | after line 242 | lead [""] | list entries | edits 1
registries/boilerplate.yml |   - title: "" /     status: draft | caret 29,13 | 2,3 | after line 26 | lead [""] | list entries | edits 1
registries/repos.yml |   - title: "" /     status: active | caret 206,13 | 20,21 | after line 203 | lead [""] | list entries | edits 1
feeds/position-leads.yml |   - title: "" /     status: open /     date: 2026-10-08 | caret 566,13 | 50,51 | after line 563 | lead [""] | list entries | edits 1
(after line is 0-based; +1 gives the table's 43, 109, ..., 564. A second entryStub over each result printed "second press untouched: edits 0" with the same caret.)
case3 stub {"text":"entries:\n  - title: A\n    status: open\n\n  - title: \"\"\n","line":5,"column":13}
case3 entryAt {"line":2,"column":12}
case4 {"text":"entries:\n  - title: A\n\n  - title: \"\"\n    kind: a\n    person:\n    due:\n    tags:\n","line":4,"column":13}
case5 role present,attend ["","  - title: \"\"","    role: present","    link: \"\"",""]
case5 role attend,present ["","  - title: \"\"","    role: attend",""]
case5 required+when not holding ["","  - title: \"\"",""]
case5 path ignored ["","  - title: \"\"","    role: present","    link: \"\"",""]
case5 category required {"text":"entries:\n  - title: A\n\n  - title: \"\"\n    category: journal\n","line":4,"column":13,"edits":1}
case6 stub {"code":"file_unparsed","line":4,"key":""}
case6 entryAt {"code":"file_unparsed","line":4,"key":""}
case10 empty key {"text":"entries:\n  - title: \"\"\n","line":2,"column":13}
case10 flow empty {"text":"entries:\n  - title: \"\"\n","line":2,"column":13}
case10 no list {"text":"other: 1\n\nentries:\n  - title: \"\"\n","line":4,"column":13}
case10 flow full {"code":"list_inline","line":1,"key":"entries"}
case10 scalar {"code":"list_not_a_list","line":1,"key":"entries"}
case27 {"text":"entries:\n- title: A\n  status: open\n\n- title: \"\"\n","line":5,"column":11,"edits":1}
case28 |+ {"code":"stub_unparsed","line":5,"key":""}
case28 | {"text":"entries:\n  - title: A\n    note: |\n      text\n\n  - title: \"\"\n","line":6,"column":13,"edits":1}
stub then typed title (case 8) {"text":"entries:\n  - title: A\n\n  - title: \"B\"\n\n  - title: \"\"\n","line":6,"column":13,"edits":1}
Section 8's rule (identityFindings) over case 7's fixtures:
pair+empty+two empty [{"file":"f","key":"entries[0].title","message":"shared title A"},{"file":"f","key":"entries[1].title","message":"shared title A"},{"file":"f","key":"entries[2].title","message":"has no title"},{"file":"f","key":"entries[3].title","message":"has no title"}]
leads closed+open [{"file":"leads","key":"entries[0].title","message":"shared title L"},{"file":"leads","key":"entries[1].title","message":"shared title L"}]
funding key no title [{"file":"fund","key":"entries[0].title","message":"has no title"}]
case7 entryAtIndex 1 {"line":3,"column":12}
Case 19 (npx tsx scratchpad/m6r/c19.ts, applicationFromLead over the hub leads):
Doctor-assistent vakgroep Data-analyse | deadline "2026-10-27" | caret 412 84 | - title,sub,status,url,deadline
Post-Doctoral Fellow in AI-based Multimodal | deadline "rolling (open)" | caret 412 67 | - title,sub,status,url
Case 30 (npx tsx scratchpad/m6r/c30.ts):
files {"form":"","typed":"","hidden":true}
collection {"search":"q","statuses":[],"hidden":[],"more":[]}

Item 5, from tools/oculus: the spec's ASCII perl line over $(find src tests config -type f ! -name local.yml); no bin folder exists ("ls: bin: No such file or directory")
gate exit 0 (nothing printed)
LC_ALL=C grep -n '[^ -~]' ../../docs/DATA-MAP.md docs/window.md docs/files-and-search.md docs/views.md DESIGN.md
guides grep exit 1 (nothing printed); the added lines of the twelve hub files: nothing printed
sh utils/folder-check.sh
folder-check exit 0
wc -l of every changed or new file under src and tests: no .svelte file over 520 and no other file over 880. Largest: yaml-edit.ts 867, fs.svelte.ts 826, context.ts 813, source.svelte.ts 738, collection.ts 730, feeds.ts 724, writes.svelte.ts 704, EntryCard.svelte 517, Collection.svelte 405, Files.svelte 366, Leads.svelte 342, app.ts 335, InPlace.svelte 112.

Item 6: sh utils/unused-exports.sh, diff against M6-base/unused-exports.txt
1c1  < Unused exports (248)  > Unused exports (246)
149c149  < ...lead-application.ts: LEADS_FEED, NOT_APPLIED, applicationFromLead, addFromLead  > ...lead-application.ts: NOT_APPLIED
152,153d151  (form-drafts.svelte.ts, form-values.ts gone)
250c248  < Unused exported types (120)  > (117)
307c305  < collection.ts: Collection, FieldKind, CrossMember, FormKind  > collection.ts: FieldKind, CrossMember
316,317d313, 327d322 (removed lines only)
No added line.

Item 7: the base copy has no node_modules, so the LinkedIn test cannot be rerun on the unchanged tree without writing into it; declined below. diff of the test against base:
91a92
>                 id: 'xx-easy-problems-2.md',
The after-run is the feeds.test.ts run above (6 passed).

Item 8: node scratchpad/m6r/guard/parent.mjs (child imports src/desktop/output.ts, calls guardOutput(), writes 1,000 lines to a stdout whose reading end the parent destroyed)
exit 0 null
dropped 1
stderr: ""

Item 9: node -e parse of base copy vs worktree, JSON compared:
same registries/data.yml 57588
same registries/venues.yml 32086
same registries/pillars.yml 6828
same registries/domains.yml 2142
same registries/boilerplate.yml 1640
same registries/repos.yml 7717
same funding/funding.yml 12424
same network/events.yml 5007
same network/joint-work.yml 6263
same education/education.yml 9636
same applications/applications.yml 34190
same tasks/tasks.yml 1456

Commands the report quotes, rerun:
npm run test:checks  ->  exit 0, Test Files  17 passed (17), Tests  248 passed (248)   (report: same)
npm run lint  ->  lint exit 0   (report: exits 0)
diff of the changed test files and allow-duplication.txt against base: identical to the report's block (feeds.test.ts 91a92, boundaries.test.ts 239a240, start.test.ts 120c120, allow-duplication.txt 21d20 and 25d23).
git status --short | wc -l: 152 before and after these runs (no file added or changed by the review).
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. The probe rows match section 1's table: lines, caret, counts and insertion line. The re-export grep prints nothing. `lineOfItem` (lists.ts:91-104) calls `itemWith`. G56's and G8's tests pass in item 2's run.
- 2: holds for the rule, but the Edit target has a defect, which falls under item 4 (Behaviour 1). draft-entry.ts and entry-file.ts are in place, and so is `unsavedFile` (source.svelte.ts:223-227). The state row of ALLOWED gained one line.
- 3: violated, Spec 2. The reorder grip is never drawn disabled and keeps its title.
- 3a: violated, Spec 1. App-frame writes (`sendFromApp`) are sent without the refusal.
- 4: violated, Behaviour 1. When a file holds a second shared value, Edit in File on that pair goes by value, when it should go by position.
- 5.1: holds. The probe gives the leads row, and the case 19 run gives both application stubs. A date defect is noted in Behaviour 3.
- 5.2: holds. Linkedin.svelte:120 opens line 9, which is where the server's scaffold puts the body (server/edit/feeds.ts:250-260). Behaviour 4 notes the coupling between the two.
- 5.3: holds. Rename and Remove are on the row, and the head control is gone. Case 30 prints form "".
- 6: holds. The item 3 grep and diffs are clean, and unused-exports has no added line.
- 7: violated, Standards 4. DESIGN.md:553, docs/window.md:66 and registries/data.yml:23 say things the tree does not do.
- 8: holds. The case 7 fixtures run through `identityFindings` gives the expected findings, and G14 passes in item 2's run.
- 9: holds. The plain-node guard run prints exit 0 and dropped 1. Reading app-harness.ts:32-33 and start.test.ts:120 gives the stdin pipe and `app.quit()` on its end. Section 9 and Z719 ask for both the guard and the harness change.

Cases of the brief's "Cases":

- 1: met at unit level (the tasks row). The page part (tab unsaved, autosave, Findings) is not verifiable here; the look on TEST settles it.
- 2: met, the twelve probe rows.
- 3: met. The probe gives caret 5,13 and entryAt line 2, column 12, and Collection.svelte:236 draws Add only for a schema.
- 4: met, the case 4 probe line.
- 5: met. The case 5 probe lines show the condition order, the required+when left out and `path` ignored, and the venues row writes no month fields.
- 6: met. The refusal is at line 4, which is the parser's first error line for a quote opened on line 2.
- 7: met at unit level for the case's own fixture (findings, and entryAtIndex at line 3, column 12). Behaviour 1 covers a file with two different shared values, which this fixture does not have. The disabled cards are a look.
- 8: met at unit level. The second press is untouched (0 edits), and with a typed title it adds a second stub.
- 9: partial. The grip is not disabled (Spec 2), and app-frame writes are not refused (Spec 1). The rest is a look.
- 10: met, the case 10 probe lines.
- 11, 12, 13, 14, 15, 16, 17, 18: not verifiable by a run here. These are page behaviour; the look on TEST settles them.
- 19: met for the stubs (caret 412,84 with a deadline line; 412,67 without). The History record and the lead marked applied are a look.
- 20, 21, 22, 23, 24, 25, 26: not verifiable by a run here; the look on TEST settles them. For 25 and 26 the reading of entry-file.ts agrees with the report.
- 27: met (caret 5,11, two entries).
- 28: met (`|+` gives stub_unparsed at line 5; `|` is placed).
- 29: not verifiable here; the look settles it.
- 30: met, the case 30 lines.
- 31: met for the guard run and the harness reading. G48's titles and `pgrep -f app-harness` are the orchestrator's at landing.

## 1. Spec

1. src/lib/state/client/writes.svelte.ts:578-581:
   ```
   async function sendFromApp(request: unknown, app: string, kind: string): Promise<WriteAnswer> {
       const headers = { [APP_HEADER]: appHeaderValue(app), [KIND_HEADER]: kind };
       return tell(await exchange(request, '/api/write', true, headers), { said: true });
   }
   ```
   - **What is wrong:** `send` calls `unsavedRefusal` (:570) and `sendFromApp` does not. `sendFromApp` is in createWrites' return (:701), and apps.svelte.ts:307 routes every app write through it. The kinds open to apps (data/helpers/files/apps.ts:104-120) include `manifest`, `entry`, `subtask`, `reorder`, `feed-field` and `lead-add`. Ruling Z731 (3) and section 3a ask for "every other write kind refused in the client's write path while its file has unsaved text in a tab". The report's list of write kinds (judgment 7) does not name this path. DESIGN.md:553 and docs/window.md:66 say "a write sent from any view over that file is refused before it is sent", which is false for an app.
   - **Failure scenario:** Add on Tasks leaves a stub unsaved. An installed app then sends `entry` over tasks.yml, the server writes it, and the tab meets D28's conflict on Save, where Overwrite drops the app's write or Revert drops the stub.
   - **Verdict:** 3a violated, case 9 partial.
2. src/lib/views/boards/collection/EntryCard.svelte:273-277:
   ```
   <span class="grip" title={t('collection.reorder_hint')} onmousedown={() => (armed = blocked === '')} role="presentation">
   ```
   - **What is wrong:** while the file has unsaved text, a press on the grip silently arms nothing. The grip keeps the title "drag to reorder" and the `cursor: grab` style (:443-446). Section 3 lists "the reorder grip" among the controls "disabled with the title `collection.file_unsaved`".
   - **Failure scenario:** a reader with a Tasks stub unsaved tries to drag a card. Nothing moves, nothing is said, and the hover still says drag to reorder.
   - **Verdict:** item 3 violated, case 9 partial.
3. src/lib/ui/display/table/ (Table.svelte, table-rows.ts) and its 11 importers (Summary, CommandCenterView, Projects, Problems, Gallery, Capacity, Jobs, Recent, ProcessTable, Usage, LineCounts):
   - **What is wrong:** the write list names `ui/display/` for "Ticker.svelte and ticker-rows.ts, the split of the component and of the folder". `ls` of the base ui/display prints 10 items. Moving Ticker.svelte and ticker-rows.ts into ticker/, with reveal.svelte.ts inside it, leaves 9, so the folder rule does not require the table/ move. The report's reason, "Table.svelte and table-rows.ts go with the folder's 10 items", rests on wrong arithmetic. The brief's "folders" (plural) can be read either way. The forms/registry/ folder does have a rule reason: without it views/shared/forms would hold 11 (`ls` now shows 9 with registry/), and the registry-file module ends a G21 clone.
   - **Failure scenario:** 11 view files outside the write list change one import line each, which widens the merge surface with D39, D43 and D36 for no rule.
   - **Verdict:** none on its own. The orchestrator decides at landing whether to keep the move.

## 2. Proof

1. Report, first line: "Everything in the brief is done".
   - **What is wrong:** Spec 1 and Spec 2 are items of the brief that are not done.
   - **Failure scenario:** a reader of the first line lands a step whose 3a refusal has a path around it.
   - **Verdict:** as Spec 1 and Spec 2.
2. Report, Files table: "new +103 -0 now 103 tools/oculus/src/lib/views/shared/forms/InPlace.svelte".
   - **What is wrong:** `wc -l` prints 112. The file's mtime (16:45:30) is earlier than the report's (16:56:43), so the row is stale. Both numbers are under the brief's 120, so no decision rests on it.
   - **Verdict:** none.
3. Report, "Outside the write list".
   - **What is wrong:** src/lib/data/snapshot/schema/record.ts (`withoutPath` moved out, imported from collection-text.ts) is outside the write list, and it is not marked or listed. The comparison of the changed-file list with the write list printed it as "NOT NAMED". Every other unnamed path is listed.
   - **Verdict:** none.
4. Report, judgment 4 and the outside list: the arithmetic for the table/ move is wrong, as Spec 3 shows.
   - **Verdict:** none.
5. Report, "Wrong or impossible in the brief".
   - **What is wrong:** brief 3a says "`state/client` imports nothing of `state/sessions`". The base copy's context.ts already imports sessions modules (`grep -rln "sessions/" base/src/lib/state/client` prints context.ts), and writes.svelte.ts:42 now imports `../sessions/source/write-files.ts`. G17's order allows this, and the predicate is handed in as the brief asks, but the false premise is not reported.
   - **Verdict:** none.

## 3. Standards

1. src/lib/state/sessions/source/write-files.ts:29 and :83:
   ```
   const CAREER_FILE = 'registries/career.yml';
   ... return inHub(text(merged.career_file) || CAREER_FILE);
   ```
   - **What is wrong:** spec.md, standards bullet "A value that has a config key ... is never hardcoded beside it as a fallback; the default lives in the config file". `career_file` is config/sources.yml:82. The constant also repeats data/sources/career.ts:15.
   - **Failure scenario:** a config without `career_file` makes the write path name a file the config never declared, and the two copies of the path can drift apart.
2. src/lib/views/feeds/leads/Leads.svelte:105-109:
   ```
   ? t('collection.file_unsaved', source.path.slice(source.path.lastIndexOf('/') + 1))
   ```
   - **What is wrong:** this repeats `blockedBy(file, unsaved, undefined)` and `fileNameOf` of entry-file.ts:146-160, and Leads already imports from that module. One rule ends up in two places.
   - **Failure scenario:** a later change to the words or the file name in blockedBy misses the lead cards.
   - On the two catalog words: neither key is dead. `collection.file_unsaved` is read by entry-file.ts:152 and Leads.svelte:107, and `app.file_unsaved` by writes.svelte.ts:556 and held-unsaved.test.ts:48. The duplicated text (app.yml:8, collection.yml:16) is what sections 3 and 3a dictate: a view-group key and the write chain's own group.
3. src/lib/views/sources/venues/VenueCard.svelte:237:
   ```
   <span class="label">{deadline?.label ?? 'deadline'}</span>
   ```
   - **What is wrong:** spec.md, "A literal string ... anywhere a reader sees it is a defect".
   - **Failure scenario:** a venues schema without a `deadline` label shows the English literal.
4. Documents and hub comment lines:
   - DESIGN.md:553 says "Add and Edit in File put an entry's text in a source tab". Edit in File puts no text: it opens the file at the entry. The same line also says "a write sent from any view over that file is refused before it is sent" (false for apps, Spec 1).
   - docs/window.md:66 repeats both: "an entry that Add or Edit in File put in the tab" and "a write sent from any view over that file is refused".
   - registries/data.yml:23 now says the schema "Drives ... the in-place controls". `grep -rln InPlace src/lib/views` prints only EntryCard.svelte and VenueCard.svelte, so Data cards draw none.
   - The report's G28 Doc text repeats "an entry that Add or Edit in File put in its text".
   - **What is wrong:** spec.md, "A sentence in a document or a head comment that the change makes false is a defect of the change".
   - **Failure scenario:** a reader trusts that an app's write over a held file is refused, or looks for in-place controls on a Data card.
   - **Verdict:** item 7 violated.
5. Comment paragraphs edited and left short. spec.md asks that a comment edited by the step be "rewrapped as a whole paragraph at 100 columns". These are the clear cases, measured by scratchpad/m6r/wrap.py over the diff:
   - src/lib/data/shapes/vocab-keys.ts:2-4: lines of 87 and 72 characters, then "entry that has one".
   - src/lib/server/edit/feeds.ts:601: "through, since addLead fills a missing status and today's date for a new entry", 81 characters, then "and an entry".
   - src/lib/views/sources/files/sections/Sections.svelte:23: 77 characters, then "callbacks,".
   - src/lib/state/workbench/layout/instances.ts:315: 89 characters, then "instance".
   - **Verdict:** none.
6. Report, "Wrong or impossible in the brief" item 5: the builder ran one read-only `git -C .../M6 status`.
   - **What is wrong:** spec.md says "a builder runs no git command at all". It was disclosed, it was read only, and the tree shows no effect of it.
   - **Verdict:** none.

## 4. Behaviour

1. src/lib/state/boards/collection.ts:422 and src/lib/views/shared/forms/entry-file.ts:119-121:
   ```
   const shared = values.find((one, at) => one !== '' && values.indexOf(one) !== at);
   ...
   return fault?.own === true ? { index: entry.index, label } : { field: identityField(schema), value: identityValue(entry, schema), label };
   ```
   - **What is wrong:** only the first shared value is recorded. `identityFaults` over titles A, A, B, B (npx tsx scratchpad/m6r/faults.ts) prints:
     `[[0,{"kind":"shared","field":"title","value":"A","own":true}],[1,{...,"value":"A","own":true}],[2,{"kind":"shared","field":"title","value":"A","own":false}],[3,{...,"value":"A","own":false}]]`
   - So the two B cards are treated as addressable by value. Edit in File on the second B asks `entryAt(text, 'title', 'B')` with nth 0 and opens at the first B. The disabled title on both B cards says `title "A" is empty or shared with another entry`. Item 4 asks for the position when "an entry whose identity can address it" does not hold. The report does not state this state.
   - **Failure scenario:** a file with two duplicated titles. The reader presses Edit in File on the second copy of the second title and edits the wrong entry's lines.
   - **Verdict:** item 4 violated.
2. src/lib/state/sessions/source/source.svelte.ts:223-227 compares a tab's `{root, path}` literally. data/helpers/hub-names.ts:12-19 serves the engine's config folder under `engine`, and the same files are reachable under `hub` as `tools/oculus/config/...`. write-files.ts:104-114 names rail and config writes under `engine` and an undo under `hub`.
   - **What is wrong:** a tab holding unsaved text of tools/oculus/config/layout.yml opened from the hub tree is not seen by a rail write. An undo of a config write, whose change-log path is hub-relative, is not seen by an `engine` tab. The brief defines `unsavedFile` this way, but the report does not state the alias limit.
   - **Failure scenario:** the Settings source tab of a config file is unsaved, and History's Undo of a config-key write goes out and meets the conflict on Save.
   - **Verdict:** none on its own (reach of 3a).
3. src/lib/views/feeds/leads/Leads.svelte:79 and :119:
   ```
   const today = localDate(Date.now());
   ...
   addInFile(client, source, data.schema, LEADS_FEED, { date: today });
   ```
   - **What is wrong:** `today` is fixed when the view mounts. Before this step the server dated a lead at write time.
   - **Failure scenario:** the Leads view open since yesterday dates a new lead yesterday.
   - **Verdict:** none (5.1 minor).
4. src/lib/views/feeds/linkedin/Linkedin.svelte:120 (`line: 9`) and src/lib/server/edit/feeds.ts:250-260 (seven front-matter lines, a blank line, the body):
   - **What is wrong:** both are correct today, and the brief's 5.2 names line 9. Nothing ties the view's number to the server's template, so a front-matter key added to the scaffold moves the body and the caret silently.
   - **Verdict:** none.
5. desktop: the `output.ts` EPIPE guard and the app-harness stdin change.
   - Both are asked for by section 9 (Z719). The guard installs at startApp's top (app.ts:63) and covers print (:55-59) through `dropClosed`. app.ts:73 and window-state.ts:40 are covered through the streams' `error` listener, which is where an EPIPE on a pipe arrives (the plain-node run dropped 1 and exited 0). The harness's `process.stdin.on('end', () => app.quit())` uses the quit path that stops the server.
   - **Verdict:** no defect found by reading. G48 is not run here.

## Declined to judge

- `npm run diagrams` was not run, because it writes docs/diagrams in the worktree. The read-only staleFiles() comparison stands in for it and prints 0 stale files.
- The LinkedIn test on the unchanged tree (verify item 7) was not rerun. The base copy has no node_modules, and running vitest there would write into it. The report quotes that run.
- G48's `npx vitest run tests/server/desktop/start.test.ts` and `pgrep -f app-harness` after a killed run were not run, because they start Electron. They are the orchestrator's at landing.
- Every page-only behaviour was not run: cases 9, 11 to 18 and 20 to 26, 29, the in-place, disabled and caret parts of the others, the Focus and Ticker disabled buttons, and the Findings view over the real hub. These belong to the look on TEST.
- The server's refusal of a bookmark rename to a held label (case 22) was not run here.

Reviewer usage: agent a89f8c70199b6a617, claude-opus-5-5, about 590,000 tokens (from the session's token counter), 156 tool uses (counted in the transcript file), 24 minutes (the transcript's first and last timestamps, 15:00:38 to 15:24:42 UTC).
