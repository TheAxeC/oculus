# Step O137 brief check (on main at 1e740da4d)

Brief check of O137, `.scratch/migration/agents/briefs/O137.md`, on oculus main at 1e740da4d. I changed nothing. My only runs were read-only programs under /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o137check/ (probe1.ts, schemas.mjs, order.mjs, fields.mjs, hub/.oculus/config.yml), plus verify check 1 and `utils/folder-check.sh` on main.

## 1. Names

1. `Present.svelte` names J and K as card cursor keys. Brief place: item 5 and "Paths this step writes". Evidence: `grep -rn "'J'\|'K'" src` gives `src/lib/views/academic/present/Present.svelte:123: const GRID_KEYS = new Set(['j', 'k', 'i', 'J', 'K', 'ArrowUp', 'ArrowDown']);` under the doc "The card cursor's keys, which act on the overview grid's tiles". What is wrong: once the `J`/`K` branch of `resolve.ts:364-369` is gone, J and K are no longer card cursor keys, so that line and its comment become false. The file is outside the write list. Change: add `src/lib/views/academic/present/Present.svelte` line 123 to the paths, with 'J' and 'K' taken out of `GRID_KEYS`. This widens the step.
2. The demo hub's comment becomes false. Brief place: "Paths this step writes". Evidence: `tests/fixtures/hubs/demo/.oculus/config.yml:7` says "Each entry carries the fields oculus's own list gives it (config/defaults/sources.yml)". After item 3, oculus's entries carry `sort:` and the demo hub's own entries do not, so the comment is false and the demo hub's cards go by title. Change: either give the demo hub's card-list entries the same `sort:` lists, or reword the comment. Name the file and the choice. This widens the step.
3. There are two functions named `movedOrder`. Brief place: item 5, last sentence ("prints nothing but what stays"). Evidence: `grep -rn movedOrder src` also gives `src/lib/views/sessions/terminal/terminal-list.ts:196` and `TerminalList.svelte:75,235`, a different function with its own signature `(order, moved: string, index)`. Change: name these three lines as staying and untouched, so the builder does not move or rename them.
4. Two imports become unused. Brief place: item 5. Evidence: `Collection.svelte:72` `blockedBy` and `:125` `unsavedFile` are used only at :344-345, inside `writeOrder`. The `t('editor.saved')` and `t('editor.failed')` keys stay, since other files use them. Change: list both imports among what item 5 removes.
5. One comment becomes false and the brief does not name it. Brief place: item 5's EntryCard part. Evidence: `src/lib/views/shared/forms/entry/card/EntryCard.svelte:279` reads "Float the card to the top of its list, or let it fall back into file order." After the step an unpinned card falls back into the sort order. Change: name this line among the EntryCard comments to rewrite.
6. Every other removed or changed name (`requestCardMove`, `cardMoveRequested`, `CardMove`, `cardMove`, `moveCard`, `fileOrder`, `pinnedFirst`, `reorder_hint`, `grip_glyph`, `move_left`, `move_right`, `ondragfrom`, `ondropon`, `Grip.svelte`, the `move` kind) has hits only inside the write list. Evidence: `grep -rln '...' src tests docs config --exclude=local.yml` lists 9 files, all in the write list. The same grep over `utils .scratch/migration/agents/guarded.md README.md` exits 1. `grep -rn "'move'" src tests` hits only `resolve.ts:69,366` and `workbench-keys.svelte.ts:230` for this kind. `cursorActive` stays: it is still read at `resolve.ts:337` and `:382`. The new key `findings.schema.sort_unknown` does not collide with the existing `findings.deck.sort_unknown` (`config/text/findings.yml:120`), because it sits in another group. Holds.

## 2. The step line

Each part of `plan.md:1655` is mapped to the item that serves it:
- "each entry of `collections:` ... carries `sort:`": item 3. The six `REGISTRY_VIEWS` entries are left out under Decision 1, which departs from "each entry" and says so.
- "a list of fields of its file's own `schema:`": item 2.
- "events / applications / people and one for every other collection": item 3.
- "which a hub's `collections:` entry may replace": item 1, C11 and C13.
- "pinned first, then by those fields, then in the file's order", and the status, date and other-field rules: item 4.
- "an entry ... with no `sort:` by the file's title field": the last bullet of item 4 (see Premises 2).
- "The reorder by hand goes ... with their HELP lines": items 5 and 6.
- "the server's `reorderEntries` stays": Decision 7 and C16. It needs no item.

No part is left without a requirement.

## 3. Premises

1. Some line numbers are off. Brief place: "What is on the tree", second paragraph (the card order) and the next one. Evidence from reading `Collection.svelte`: `shown` is :214-220 (the brief says :211-218); `parts` is :146-156 with its doc at :142 (the brief says :140-155); `collectionBar` is :197-211 (the brief says :196-209). `Collection`'s doc in model-collections.ts starts at :381 and the type at :391 (the brief says "from :380"). Change: correct the numbers.
2. One fallback is credited to the wrong function. Brief place: "What is on the tree", "An entry's card heading is `entry.title` (`entryTitleOf` ...: ... else the primary key, else the first filled text)", and item 4's last bullet. Evidence: `entryTitleOf` (`model-collections.ts:190-200`) returns the display field, else `entryIdOf`, and has no first-filled-text fallback. The card heads by `entryWords(entry) || entry.id` (`EntryCard.svelte:339`). `entryWords` (`src/lib/state/shared/page/idents.ts:78-80`) is `entry.title ||` the first filled nested text. So for a file with no schema and no named primary key, `entry.title` is '' for every entry and the no-sort order would be file order, while the card shows other words. Change: say that the card heads by `entryWords`, and have item 4 order by `entryWords(entry)`. The other option is to keep `entry.title`, the file's title field as the step line says, and state that difference.
3. A cited sort control is the wrong one. Brief place: Decision 1, "its own sort control at `config/text/views/sources/venues.yml:69`". Evidence: `sed -n 67,70p` shows "Searching the journal browser", "Page size", "sort: Sort", "sort_none: The browser's order". That is the journal browser's sort, not the Venues view's card order. Change: cite what orders the Venues view's cards, or drop the citation.
4. Every other claim reran and holds:
   - `grep -rn movedOrder src`, `fileOrder` (only `index.ts:726` and Collection.svelte), `pinnedFirst` (Collection.svelte:157, :216).
   - `index.ts:65` re-export of `optionKeys`, `STATUS_FIELD` at :81, `isPinned` and `pinnedFirst` at :730-739.
   - model-collections.ts:304-309, `normalise.ts:586-601`, `traitsOf` (doc :110, function :114-123), `entryOf` :307-363, `dissemination_skip` :329-338, `findings.yml:20` and `:337`, `hubFiles` :78-106, `keyFindings` :305-346.
   - `KEY_ROWS` at :539 and the describe at :679; the describe 'the fields of a collections entry' at :218.
   - `config/options/sources.yml:50-131`; `grep -rhn 'control: ' config/options | grep -c 'control: list'` gives 24.
   - EntryCard is 366 lines, with :191, :289-301, :305-307 and :329-333 as stated; Grip has one importer.
   - `DebugToolbar.svelte:92` draws the glyph `grip`.
   - resolve.ts :69 and :362-369; workbench-keys :230-231 and :425-440; ui.svelte.ts :58, :180-181, :231, :430-440, :576-577; rows.ts :101-102; help.yml :36-37; HELP:148.
   - `grep -rn "requestCardMove\|cardMoveRequested\|move_left" tests` exits 1.
   - The `reorderEntries` places exist; apps.md:444 exists.
   - `grep -n '^collections:' ~/workspace/research-hub/.oculus/config.yml` exits 1, and the demo hub names its own list.
   - `ls docs/adr` fails. O135's write list in its brief is disjoint apart from HELP 394-411 and `docs/diagrams/*`.
   - The field and type claims over the research hub hold (run of fields.mjs): funding, events, education and applications have `title:text status:select date:text deadline:date`; tasks has `status`, `deadline:date`; literature has `title`, `year:text`, `added:date`.

## 4. Cases and checks

1. Existing schema-rules rows go red, and the brief does not foresee it. Brief place: C4, C5 and verify check 1. Evidence: `tests/data/snapshot/schema-rules.test.ts:34-36` builds `CONFIG` from `loadConfig(engineDir())`, which is oculus's list, so after item 3 its `tasks` entry carries `sort: [status, deadline]`. `grep -c "\[TASKS_FILE\]"` gives 13 plantings. `grep -n "field: status\|field: deadline"` over the file prints nothing, so no planted tasks schema names those fields. The KEY_ROWS runner (:680-692) asserts `toEqual(row.found)` over every finding on the tasks file. By reading (not run), each such row gains two `sort_unknown` findings. Change: say how these rows stay true. Option one: the `tasks()` helper's schema gains `status` and `deadline` fields, a fixture change and not an assertion edit. Option two: rows not about the sort use a `CONFIG` whose tasks entry has `sort` taken off. Each changed line is then listed as the rules file asks.
2. A board-rules case goes red. It is outside the paths and outside verify check 1. Evidence: `tests/state/boards/board/board-rules.test.ts:816-818`, 'case 21a: an entry naming no one is no finding...', asserts `expect(found).toBe(0)` over `.oculus/data/academic/tasks.yml`. Its schema is `title, status, lead` (:753-760) with no `deadline`, and its config is oculus's list (`board-fixture.ts:11`). By reading, it gains one `sort_unknown` for `deadline`. G124 names this describe. Change: add the file to the paths and verify list 1, and say how it is fixed (its tasks schema gains `deadline`). This widens the step.
3. The Make Folder a Hub test goes red. Evidence: `tests/routes/hubs/make.test.ts:242-262` expects the written `collections` entries `toEqual` a list without `sort`. Make writes "each entry as its template line" from `docs/templates.md` (`src/lib/server/files/project/make.ts:17-22`), and item 3 makes those lines carry `sort:`. G9 names this test. `test:quick` will not pick it up, because it does not import a changed module. Change: add the file to the paths and verify list 1, with the two expected entries gaining `sort`. This widens the step.
4. Verify check 1's "every other test file that imports a file the step changes" misses tests that read the changed YAML (sources.yml, templates.md) through `loadConfig(engineDir())`. Evidence: the scan over tests that plant files at default collection paths, use oculus's list and read findings returns board-rules, schema-rules, resources, relation-shapes, collections and manifests. By reading, resources.test.ts (its schema holds `name` and `kind`), relation-shapes and manifests (people and literature schemas hold `name` and `title`) are unaffected. The real hub's ten schemas hold every sort field (run of schemas.mjs). Change: add "every test that builds a snapshot over oculus's list" to check 1, naming the files above.
5. C16 checks a place the step does not change. Evidence: `Sections.svelte`, `writes.svelte.ts` and the server's `reorderEntries` are not in the write list. Change: drop C16, or replace it with the grep that `reorderEntries` still stands at `writes.svelte.ts:429` and `Sections.svelte:111`.
6. Verify check 6 is worded wrong. Evidence: it "prints only what item 4 keeps", but item 4 keeps none of those names; every one of them goes. On main it prints 37 lines in 9 files, all in the write list. Change: "prints nothing".
7. Verify check 8 points at rules that do not exist. Evidence: `grep -n -i "sentence\|list item\|bullet" .scratch/migration/agents/spec.md` finds no rule on sentence length or list items; the configuration's one standards page is spec.md (`.agents/plan.yaml:6`). Change: drop the check or name the rules it means.
8. Verify check 1 runs on main as written: "Test Files 9 passed (9) | Tests 242 passed | 2 skipped (244)". `sh utils/folder-check.sh` exits 0. Check 4 cannot run until /spec writes the base copy. Checks 2 and 3 name commands that exist (`package.json:17`, `:23`).
9. The real-file cases hold under the brief's rule (runs of order.mjs, read only):
   - C6 events: planned 2027-03-01, planned with no date, completed 2016, 2017, 2017, 2019 ... 2026-10-29, cancelled, not-attending.
   - C7 applications: nine not-applied with no deadline in file order, active 2026-11-04 to 2027-01-21, accepted, rejected, declined, withdrawn, applied.
   - C10 people: Anh Phuong DO, Ashkan Pirmani, Aur<e acute>lie de Borman, Axel Faes, Brecht Heeren, Brent Berghmans. Organisations put Region <O diaeresis>sterg<o diaeresis>tland after MST.
   - Decision 2's funding and education orders match too.
   - C1 to C3, C8, C9 and C11 to C15 agree with items 1, 4 and 5.
10. C10 depends on a locale the brief does not name. Brief place: item 4 ("`localeCompare` ... `sensitivity: 'base'` and `numeric: true`"). Evidence: `node -e` with locale undefined or 'en' gives "Oslo <O diaeresis>sterg<o diaeresis>tland Ozone Zeta"; with 'sv' it gives "Oslo Ozone Zeta <O diaeresis>sterg<o diaeresis>tland". The page runs in the reader's locale. Change: name the locale ('en') or an `Intl.Collator('en', ...)`.

## 5. The question

Can each check pass without the goal (a collection always sorted by its `sort:`, the reorder by hand gone)?
- C1 to C3 (reader rows): yes. They prove the read, not the drawn order.
- C4 and C5: yes. They prove the finding.
- C6 to C12 (case-run of the pure function): yes, if `Collection.svelte` calls the function without the part's `collection.sort` and `schema`. Verify check 6 only forces `pinnedFirst` to go. Only the look and the `file:line` code path the report must give (`shown` and `entries` handing `part.collection.sort` and `part.schema`) reach the goal. Change: make that code path a DONE row quoting the two lines.
- C6, C7 and C10 also read the hub files directly rather than the snapshot's `Entry` values. This holds today, because every date value is a string (node run: events 26 strings and 1 undefined, education 23 strings).
- C13, C14 and C15: no. They are looks over the real view.
- C16: says nothing about the goal (Cases and checks 5).
- The plan's step line names no check of its own.
- Items 1 to 6 alone could pass while a hub's own list without `sort:` draws in file order. Item 4's last bullet prevents that, so the goal ("always", title when none) is reachable.

## 6. Implied inputs

1. `sort:` written as one text clashes with `control: list`. Brief place: item 1 ("a text is a list of one field"), C2 (`sort: deadline` with no problem), Decision 5, and item 3 (`control: list`). Evidence: `control: list` makes the editor's schema `{ type: 'array', items }` (`src/lib/data/sources/config/catalog/schemas/options.ts:150-158`). `valueProblem`'s `listProblem` refuses a text (`value-rule.ts:231`, kind `strings`), and the Settings editor (`state/system/config/editors/fields.ts`) and the Settings write (`config-value.ts:246`) both use that rule. The family schema reaches a hub's `collections` entry fields (`schemas/options.ts:330-355`). So `sort: deadline` is read with no problem and also squiggled and refused in Settings. `control: multi`, which takes both forms, needs `options` or `from` (`catalog/options.ts:456-461`, `no_values`), and the schema's field names are no such list. Expected result, one of two, decided in the brief: (a) only a list of texts is read, a text being `sort_unread`, which matches the step line's "a list of fields" and `control: list`; or (b) the text form stays, with a control that takes a text or a list. I recommend (a); (b) is the costlier one and nothing asks for it.
2. Writes and pins now move a card. A status change from the card menu, a pin and an Add now move the card to its sorted place. The cursor is kept by identity (`cardCursor`), so it should stay on the moved card. Expected: the card moves and the cursor stays on it. This is not in the report's "before and after" list. Change: add it as a look item.
3. The status slices change order. They are taken over `entries` in first-occurrence order (`bar.ts:466`), and so is the Status submenu of a file with no schema (`offeredStatuses(schema, statusFacets(entries))`, Collection.svelte:161). With `entries` sorted, a collection whose sort starts with `status` lists its slices in the options' order. Expected: events slices read planned, completed, cancelled, not-attending. Change: add it to "before and after". HELP:279's "in the order the entries first carry them" stays true.
4. List mode needs no change. `Table`'s `sort` starts null (`src/lib/ui/display/table/Table.svelte:35-37`), so the rows come in the sorted order until a column is pressed. Expected as the brief says; nothing missing.
5. Other views that read entries in file order stay as they are, and the brief does not say so: Focus's Tasks section, the awaiting box, the positions band, the Person page (`Person.svelte:242`, one card) and the Entry page (`Entry.svelte:319`, one card). Expected: unchanged, being outside "a collection's cards". Change: one line saying so, so the builder neither widens nor reports them as gaps.
6. A field value that is a number, such as `year: 2025` or `date: 2016` unquoted, is not covered. Item 4 speaks only of "its text", so a builder reading "text" as a string would put a number among the missing values. Expected: a number compares by its text (`keyText` of model-collections, a text or a number).
7. A hub whose own list names no registry entry reads oculus's entry of it (HELP:584), and with it oculus's `sort`. Expected: such a hub's people, funding and literature use oculus's sort lists. Covered by C11 and C13 only for entries the hub names. Change: one line in C13.
8. The multi-hub parts are covered (C13, parts in hub order, each part with its own schema).

## 7. ADRs

None. `ls docs/adr` gives "No such file or directory", and `find . -path ./node_modules -prune -o -type d \( -iname '*adr*' -o -iname decisions \) -print` prints nothing.

## 8. Dictated text

1. The two finding sentences, `grep -n "sort_unread: '\|sort_unknown: '"` at brief line 114: both hold under the prose and character rules (ASCII, no dash, no not-X-but-Y). `sort_unread` holds only under option (a) of Implied inputs 1, where every unread value gives no sort. Under option (b) it holds too.
2. The HELP line, `grep -n "j / k, i / o"` at brief line 41: the words hold. The dictated text leaves out the table's outer pipes; the line on main is `| j / k, J / K, i / o | move the card cursor left / right, move the card, cursor up / down a row |`. Change: dictate the whole row, `| j / k, i / o | move the card cursor left / right, cursor up / down a row |`.
3. The sort lists of item 3, `grep -n "statements \`\[status, title\]\`"` at brief line 30: they hold as YAML flow lists, and every field exists in both the template schemas and the hub schemas (run of schemas.mjs).

## Paths

Missing:
- `tests/state/boards/board/board-rules.test.ts` (Cases 2).
- `tests/routes/hubs/make.test.ts` (Cases 3).
- `src/lib/views/academic/present/Present.svelte` line 123 (Names 1).
- `tests/fixtures/hubs/demo/.oculus/config.yml` (Names 2).

Each of these widens the step.

Listed but not needed: none.

One clash: `.scratch/migration/agents/reviews/O137-report.md` is in the write list, while the rules file, `spec.md:36`, says "You never edit anything under `.scratch/`". `grep -n "reviews/O13[0-6]-report.md"` shows every brief from O130 to O136 does the same, so this is a standing clash between the brief template and the rules file. It is not new to O137.

## Decisions

1. Decision 5 (one text is one field) clashes with item 3's `control: list` (Implied inputs 1). The brief should not take it as written.
2. Seven of the default sort lists are the brief's own choice and appear only in item 3, not under "Decisions": statements, organisations, resources, funding, education, tasks and literature. The step line fixes only events, applications and people. My judgment is that they are sound. `literature [title]` is the better of the choices item 4 allows, since `added` could only go oldest first. Change: list them under Decisions with one reason each.
3. The applications order is left to the hub's option order. Decision 2 accepts that applications follow their options, `not-applied` first and `applied` last after rejected and withdrawn, "until its options are reordered". No step reorders them: O138 only adds `interview` and `offered`. The result is that the applications waiting on an answer are drawn at the bottom. This is a user-visible result of the hub's data, which is Axel's. Change: raise it as an open item. (a) The hub's `applications.yml` status options are reordered at O137's or O138's landing, for example active, applied, interview, offered, accepted, not-applied, declined, rejected, withdrawn. (b) They stay as they are. (b) is the lazy option.
4. Decision 8 names no guarded entry. The rows belong to G32 (`collections.test.ts`, describe 'the fields of a collections entry', every row) and G56 (`schema-rules.test.ts`, every row). The step also touches the code of G108 (`resolve.ts` and `act` of `workbench-keys.svelte.ts`; tests `tests/server/desktop/menu-template.test.ts` and `tests/shell/window/menu-answer.test.ts`, neither in verify check 1), G124 (board-rules) and G9 (make.test.ts). Change: name these entries and add their tests to check 1.
5. The finding words hold (Dictated text 1). Decisions 1, 3, 4 and 7 hold.

## Libraries

None would replace the code the step writes. `lodash-es` is already a dependency (`slides.ts:23`). Its `orderBy` sorts stably by values, but the comparisons (the options' order, a missing value last, the collation) stay custom. `Intl.Collator` is a platform feature, not a library; it is the fixed-locale form of the `localeCompare` the brief names (Cases and checks 10).

## Declined to judge

- I did not run the whole suite or check every test that builds a snapshot over oculus's list. The red rows in Cases and checks 1 to 3 are by reading, not by a run, since a run would need the change in place.
- I did not render any view, so the drawn order, the slices and the cursor are judged from the code.
- I did not read `config/local.yml` or any hub's `.oculus/local.yml`.

Usage: a361b40d4a9410a68, claude-opus-5-5, 287169 tokens, 157 tool uses, 18 min 5 s.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)
- Names 1: `Present.svelte` line 123 added to the paths; item 5 takes `'J'` and `'K'` out of `GRID_KEYS`; "What is on the tree" quotes the line.
- Names 2: the demo hub added to the paths; new item 6 gives its ten card-list entries the `sort:` lists of item 3, each word one the demo's schema names, so its comment at :7 stays true.
- Names 3: "What is on the tree" names the terminal list's `movedOrder` (`terminal-list.ts:196`, `TerminalList.svelte:75`, `:235`) as staying untouched; item 5's grep excepts it.
- Names 4: item 5 removes the imports `blockedBy` (:72) and `unsavedFile` (:125).
- Names 5: item 5 names the doc of `pin` (`EntryCard.svelte:279`) among the comments rewritten.
- Names 6: holds; no change.
- Premises 1: the line numbers corrected (`shown` :214-220, `parts` :146-156 with its doc at :142, `collectionBar` :197-211, `Collection` doc :381 and type :391).
- Premises 2: "What is on the tree" says the card heads by `entryWords(entry) || entry.id`; item 4's no-sort order is by `entryWords(entry)`, which is the title field for a file whose entries carry it.
- Premises 3: Decision 1's citation of the journal browser's sort dropped.
- Cases and checks 1: new item 6: the `tasks()` helper's planted schema in `schema-rules.test.ts` gains `status` and `deadline`, a fixture change; a row whose findings would change otherwise is handed back.
- Cases and checks 2: `board-rules.test.ts` added to the paths and check 1; item 6 gives case 21a's tasks schema `deadline`.
- Cases and checks 3: `make.test.ts` added to the paths and check 1; item 6 gives its two expected entries their `sort`.
- Cases and checks 4: check 1 names `tests/data/snapshot/resources.test.ts`, `tests/data/snapshot/relation-shapes.test.ts`, `tests/data/sources/manifests/manifests.test.ts`, `board-rules.test.ts` and `make.test.ts` (the paths as they are on the tree).
- Cases and checks 5: C16 is now the grep that `reorderEntries` stands at `writes.svelte.ts:429` and `Sections.svelte:111`.
- Cases and checks 6: check 6 now "prints nothing".
- Cases and checks 7: the check on sentence and list rules dropped.
- Cases and checks 8 and 9: hold; no change.
- Cases and checks 10: item 4 names one `Intl.Collator('en', { sensitivity: 'base', numeric: true })`.
- The question: new check 7, a DONE row quoting the two lines of `Collection.svelte` that hand `part.collection.sort` and `part.schema` to the order function.
- Implied inputs 1: option (a): item 1 reads only a list of texts, a text being `sort_unread`; C2 and Decision 5 rewritten; the `sort_unread` words now read "is not a list of fields".
- Implied inputs 2 and 3: C17 and C18 added, and both are in the report's before and after.
- Implied inputs 4: holds; no change.
- Implied inputs 5: item 4 says the views outside a collection's cards keep the file's order and are not changed.
- Implied inputs 6: item 4 says a number compares by its text.
- Implied inputs 7: C13 gains the line on a hub whose list names no registry entry.
- Implied inputs 8: holds; no change.
- ADRs: none.
- Dictated text 1: holds, `sort_unread` reworded under Implied inputs 1; the rewritten line `sort_unread: 'the sort {0} of the entry {1} is not a list of fields; its cards go by their title'` read again: ASCII, no dash, no contrast frame; holds.
- Dictated text 2: item 7 dictates the whole row `| j / k, i / o | move the card cursor left / right, cursor up / down a row |`; read again, holds.
- Dictated text 3: holds; no change.
- Paths: the four missing paths added. The report path's clash with `spec.md:36` is standing practice across every step and is raised as open item 661; this step goes on as every step before it.
- Decisions 1: closed with Implied inputs 1.
- Decisions 2: new Decision 9 lists the seven sort lists with a reason each.
- Decisions 3: raised as open item 660, decided at O138's landing, which writes the hub's applications options; Decision 2 now says so. O137's code is the same under either answer.
- Decisions 4: Decision 8 names G32, G56, G108, G124 and G9, and check 1 runs their tests.
- Decisions 5: holds; no change.
- Libraries: none; no change.
