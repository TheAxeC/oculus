# Brief check of O107

Run from ~/workspace/oculus on main at ed1f47130bdc4168bf553483db92c5bed059e654 (`git rev-parse HEAD`). Nothing was changed. The one probe (a read-only node program in the scratchpad, printing results for synthetic input) is deleted; it is quoted under Implied inputs.

Five findings change the brief before dispatch. Detail is under the headings.
- F1: Case 4 cannot be met. Every entry of a file with no primary key has the same id, and the page state drops an empty key.
- F2: the premise "a card with no schema carries no writing actions" is false. The Status submenu stays, and with a named `primary_key` it writes.
- F3: "Delete ... whichever the existing rule gives" gives Delete enabled on a no-schema file with a named key.
- F4: `editorRows` (entry-actions.ts:92) and `Person.svelte:215` key on `pageOf` being null. After the change a registry card of a no-schema file gains Edit and the Person page gains Delete. Neither path is in the write list.
- F5: Decision 1's reason is not in the ruling or the step line. The only no-schema files in the demo hub are the two feeds the decision excludes. This finding is inside the line, not a widening.

## Goal, line and ruling read

`grep -n -i "^.\{0,10\}goal" .scratch/migration/plan.md` printed nothing: plan.md has no Goal heading. I read its header paragraph, the O107 line at plan.md:1587 and Open item 609 at plan.md:3372. Both lines are in the working tree, uncommitted (`git diff .scratch/migration/plan.md`).

## Names

Names the step changes: `pageOf` (its answer), `PageEntry.schema` (its shape), `collectionPage`'s `schema` parameter, and the new word `entry.no_schema`.

Commands:
- `grep -rn "pageOf\b" src tests docs config --exclude=local.yml`
- `grep -rn "PageEntry\b" src tests docs`
- `grep -rnE "\.schema\b" src/lib/views/boards/entry src/lib/views/boards/person src/lib/views/boards/editor src/lib/views/shared/forms/entry src/lib/state/forms`
- `grep -rn "editorRows\|\.pageNamed\|pageNamed(\|pageFields(\|pageDraftTarget(\|client\.pages\|pages: {\|pages\.pageOf\|recordActions(" src tests`

The same `pageOf` name in lsp, zenodo, layout, fs-history and timeline-reads is another function and is dropped.

Hits outside "Paths this step writes":

| Hit | Does the change make it false? |
|---|---|
| `src/lib/views/shared/forms/entry/entry-actions.ts:92` `if (client.pages.pageOf(collection, id) === null) return [];` | YES. It decides Edit by page existence, so it starts answering a row for a no-schema file. See F4. |
| `entry-actions.ts:79-80` "none for a record with no page, which is an entry of a file with no schema" | YES, comment false. |
| `src/lib/views/shared/forms/registry/registry-card.svelte.ts:89-91` calls `editorRows` with no schema guard | YES. The card gains Edit. |
| `src/lib/views/boards/person/Person.svelte:103`, `:215` Delete under `{#if page !== null}` | YES. A person of a no-schema file gains Delete, which today is absent. |
| `Person.svelte:102` "null for a file with no schema" | YES, comment false. |
| `src/lib/views/boards/editor/editor-target.ts:172`, `:216-218` | YES unless changed. A no-schema page reaches `pageTarget` and an empty form opens. The brief asks for this but its path is not listed. |
| `src/lib/views/shared/forms/entry/DeleteAsk.svelte:34` | True only if no control opens it. |
| `docs/HELP.md:276` "A file with no `schema:` has no Edit" (in the write list) and `:339` "a person of a people file with no `schema:` has no Edit" | Stay true only if the Edit row of F4 is closed. |
| `page-file.ts:18,42` | True. Neither reads the schema. |
| `entry-save.ts:26,62,92` | True while no form reaches it. |
| `LeadCard.svelte:216`, `RadarCard.svelte:99` | True under Decision 1. |
| `tests/state/forms/entry-save.test.ts:13,33` and `tests/data/sources/career.test.ts:21,288,385` | True unless the shape chosen breaks the types of their literals or `pageFields`. |
| `tests/data/hubs/hub-portfolio.test.ts:465`, `tests/state/forms/form-draft.test.ts` | True. The hub-portfolio hit asks for an entry that `pageOf` finds and writes. The form-draft null row is a key no file holds. |

`entry.no_schema`: `grep -rn "no_schema" src tests config docs --exclude=local.yml` shows `career.no_schema`, `server.career.no_schema` and the state word in career-view.ts. No collision in the `entry` group. `grep -rln "^    entry:" config/text` printed only `config/text/views/boards/entry.yml`.

## The step line

Every part of plan.md:1587 is in "What to build":
- the entry exists and the file has no `schema:` list: yes
- draws the fields the card draws: yes
- read-only text: yes in words, but F2 shows the means named does not give it
- the line saying no `schema:` list and so no editor: yes
- in place of the unknown-entry message: yes
- a key naming no entry keeps that message: yes
- ruling 609: yes

"The entry exists and its file has no `schema:` list" has no word limiting it to collections. See F5.

## Premises

Each fact rerun with `sed`/`cat -n`/`grep -n`.

| Brief's fact | Result |
|---|---|
| `page-entry.ts:293` `pageOf`, `schema` at 303, branch at 304 | Holds |
| `if (!settled.pending(...)) return null` at line 311 | Off by one: line 310. `grep -n "settled.pending(entryKey(collection, key))"` printed 310. |
| `Entry.svelte:305` shows `t('entry.unknown', ...)` | Off: the branch is at 304, `t('entry.unknown'...)` at 307 |
| `page-entry.ts:68` `schema: SchemaField[]`, not optional | Holds |
| `Entry.svelte:116` calls `pageOf`; `schema` is `$derived(collection?.schema)` | Holds (the derived is at line 145) |
| `collection/index.ts:457` `drawnFields` | Line 457 is its doc comment; the function is at 461. The behaviour holds. |
| `EntryCard.svelte:160` `addressable = schema !== undefined`, "so a card with no schema carries no writing actions" | Line holds. The conclusion is FALSE (F2). |
| `career.yml:10` | Holds, sentence byte-equal |
| `entry.yml` holds `entry.*` | Holds |
| `page-entry.test.ts:200-205` rows | Holds: rows at 200-203, `it` at 204 |
| `feedPage` at `page-entry.ts:187-196` | The function is 185-213; 187-196 is its parameters through the schema check |
| All 17 hub data files have `schema:` | Holds: `cd ~/workspace/research-hub && grep -L '^schema:' .oculus/data/*/*.yml` printed nothing; `ls .oculus/data/*/*.yml \| wc -l` printed 17 |
| The state is shown on a scratch copy of the demo hub | Incomplete: `grep -rL '^schema:' tests/fixtures/hubs/demo/.oculus/data/*/*.yml` printed `academic/leads.yml` and `literature/radar.yml`. The demo hub already holds the state for two files, both feeds (F5). |
| `docs/adr` does not exist | Holds |

F2. Premise wrong. `entry-actions.ts:160-162`: `if (!input.addressable) return [...page, ...statusRows(input), ...input.shows, ...input.extra];`. A no-schema card keeps the Status submenu, fed by `Entry.svelte:157` `lifecycle` (the file's own statuses). `EntryCard.svelte:282-283` writes through `writeEntry`. On the server, `src/lib/server/edit/writes/entries.ts:374-375` refuses only when `ident === null`, so a no-schema file with a named `primary_key` takes the write. Brief lines 15 and 26 are therefore false for Case 5, and the page would not be read-only as drawn. `extra` is not a write on a read of the code: Start Agent opens the composer, Copy BibTeX copies. To meet "every other control that writes is absent", `Entry.svelte` must pass no statuses for such a page, or the card must take the rule. The brief should say which.

F3. "Delete ... whichever the card's and page's existing rule for a blocked file gives" names a rule that gives two answers.
- `Entry.svelte:275-284` draws Delete under `page !== null`, disabled by `blocked`.
- `blocked` is `blockedBy` at `entry-file.ts:151-162`, which is '' for a no-schema file with a named key and no fault.
- `entries.ts:483-490` deletes such an entry, since `ident` is non-null.

So that rule gives Delete enabled and live, against "absent or disabled". The card's own rule (`entryActions`, addressable false) gives absent. The brief should name absent or disabled and stop using "whichever".

## Cases and checks

Read against spec.md. The test rule holds for rows in this file: guarded.md:278 (G32) names `tests/state/forms/page-entry.test.ts`, describe 'pageOf' and describe 'pageNamed', every row, so new `pageOf` rows need no new entry. No guarded entry reads `editorRows`, `createRegistryCard` or `editorTarget`: `grep -n "page-entry\|pageOf\|entry-actions\|editor-target\|Entry\.svelte" .scratch/migration/agents/guarded.md` hit only lines 84, 85, 277 and 278, and those four are `page-entry.ts`/`page-entry.test.ts` lines. So the controls of F2, F3 and F4 cannot be tests and their proof is the look.

- Case 1 and Case 5 are one state on this tree. An entry has a key only through a named `primary_key` when the file has no schema (`primaryKeyOf(undefined, named)`, `entryIdOf`).
- Case 2: reads against the rules, preservation; passes on both trees.
- Case 3: preservation. The case text says "as before", a word spec.md bars in comments and test titles; the row's title must not copy it.
- Case 4: wrong as written (F1).
- Case 5 "no form opens": the place is `editor-target.ts`, outside the write list.
- Case 6, a feed with no schema: asks about a place the step does not change (`feedPage`). Rows at `page-entry.test.ts:196` and `:202` already hold it.
- Case 7: reachable only through the Status write of F2 on a named-key file. `settle.entry` records it and `collectionPage` goes down the `own` false path, which calls `entryTitleOf(values, schema, primaryKey)`. That function already takes undefined.
- Case 8: same state as Case 2 at `pageOf`.

The brief says "No script is written for this step" and also "Every other case ... is checked by a run the report quotes". spec.md allows a case-run program, and "A builder runs no page". Cases that are no test and no page (Case 5, Case 8) then have no means of a run under the brief's sentence. The brief should allow the case-run program or name such cases as read and looked at.

The header says "Then, in full: `.scratch/migration/agents/spec.md`, and the ADRs this brief names". That repeats spec.md and names no ADR, and spec.md says read "the files the brief lists, and only those". The brief asks for every caller to be read but lists none.

O104, O105 and O106 name no worktree, base copy, port or unused-exports base either (`grep -n -i "worktree\|base copy\|port 8\|unused-exports\|base's"` hit only "Run from the worktree"). This is not a finding of this brief alone; spec.md expects them from the brief.

## The question

Could each pass without the goal being reached?

- Case 1 row: yes. `pageOf` answering a page proves nothing about `Entry.svelte` drawing it or the line. Only the look proves it.
- Case 2 row: no for the message at state level; it passes on both trees, so it guards rather than proves.
- Case 3 row: same.
- Case 4: a `pageOf('...', 'hub:')` row would pass while the reader sees `entry.none`, since `Entry.svelte:116` never calls `pageOf` for an empty key (F1). Yes, it could pass with the goal unreached.
- Case 5 row: yes. A row on `pageOf` cannot see the form; the fact is in `editorTarget`. An empty target passes the row and opens an empty form.
- Case 6: no, but it does not touch the goal.
- Case 7 row: holds at state level. No view proof.
- Case 8 row: holds at state level.
- Verify 1 and 2: yes, both pass with nothing drawn.
- Verify 3: passes for state rows only.
- Verify 4: reading, no.
- The brief names no look state. The goal rests on the look, so the report's before and after should name: a scratch demo copy with one plain file's `schema:` removed, with and without `primary_key` on its entry; one registry file (Venues) to see Edit gone; `people.yml` to see Delete gone on the Person page.

## Implied inputs

Probe on the unchanged tree, synthetic snapshot through the real `createPages`, `entryPageState`, `stateRecord`, `entryIdOf`, `entryTitleOf`:

```
nokey entry ids [ '"hub:"', '"hub:"' ] titles [ '""', '""' ]
named entry ids [ 'hub:One', 'hub:Two' ] titles [ 'One', 'Two' ]
state of second no-key entry {"collection":"nokey","hub":"hub","key":"","label":"Two"} stateRecord ""
pageOf named hub:One on the tree null
pageOf nokey hub: on the tree null
```

F1. No primary key. This has happened in the sense that `tests/server/edit/writes-collection.test.ts:410` and HELP.md:278 name the state.
- Every entry's id is `hub:` and its title ''.
- `Collection.svelte:246-250` opens state `{key:''}`. `stateRecord` (records.ts:27-31) answers ''. `Entry.svelte:116` gives null and line 300 draws `entry.none` ("This tab was opened for no entry"), not the unknown-entry message and not the page.
- If that gate were lifted, `find` answers the first entry for every card, one tab holds all of them (`stateId` of instance.ts, as the head comment of `entryPageState` says), and the title is '' (`keyOf('hub:')`).
- The expected result "the page opens by the id the card gave it" is not reachable. The card gives no usable id.
- Reaching each entry needs a new address in the tab's state, such as the entry's index. That is a route shape nothing names, so it is a decision for Axel under spec.md's "No silent design decisions". This is inside the step line, not a widening. Dropping the case instead narrows the line.

F4. Registry card of a no-schema file (Venues, Data, Domains, Pillars) with a named key.
- `recordActions` returns [] for no schema (entry-actions.ts:120), but `editorRows` at registry-card.svelte.ts:90 does not check, and strip `['editor']` draws it.
- Expected: no Edit, as HELP.md:276 says.
- `entry-actions.ts` joins the write list. `editorRows` is the one place that answers it, and it also covers Person.

Person page of a no-schema people file. `Person.svelte:215` draws Delete, enabled with a named key. Expected: absent, as today. `Person.svelte` joins the write list, with comments 26 and 102. No case names the Person page.

The form. `editor-target.ts:216-218` must answer null for such a page, so `Editor.svelte:274` draws what it draws today. An editor tab restored over such an entry takes the same path. `editor-target.ts` joins the write list.

Where the line reads its state. `Entry.svelte:145` `schema` is `collection?.schema`, undefined whenever `collection` is null, and `collection` can be null on a feed page (lines 121-129). A line keyed on the view's `schema` could draw on a lead or paper page that has a schema. Expected: the line reads what the page carries, for `kind: 'collection'`.

Malformed `schema:`. `collectionSchema` (normalise.ts) answers undefined for a block that does not read, so such a file takes the new branch. The dictated sentence "has no schema: list" is false for it; the block is there, and HELP.md:278 calls this "its schema does not read". Expected: the page opens, and the words stay true. Career's sentence has the same gap, outside this step.

Add on a no-schema file with a named key.
- `Collection.svelte:274` calls `collectionAsk` with `schema`, `entry-add.ts:253` asks the named key, `entries.ts:577-578` needs only `ident`, and `entry-add.ts:293` opens the page.
- `page-entry.ts:314` and `:316` require a schema, so the page is null, showing the unknown-entry message until the snapshot arrives, though the entry exists.
- Expected: the page from the first frame, as line 319's branch gives a file with a schema.
- If that branch is opened, `Entry.svelte:127` `one.schema === page.schema` compares undefined to undefined and can pick the first no-schema file of another hub.
- Whether the Add button is drawn for such a file: not verified.

Two hubs, one key, one file with a schema and one without: `find` is per file, so each page follows its own file. No finding.

Draft of a tab whose file lost its schema: `pageDraftTarget` `differs` goes to `hasWords`, since `formFieldsOf` takes undefined (record-fields.ts:58-62). Holds if `pageFields` keeps that.

Entry.svelte:127 today: reached only when no file holds the key, which no no-schema page without the Add branch does. Holds.

## ADRs

`ls docs/adr`: No such file or directory. `git ls-files docs/adr | wc -l`: 0. None.

## Dictated text

`grep -n "no_schema\|Ruling 609\|has no editor" .scratch/migration/agents/briefs/O107.md`, then a read of each decision. `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O107.md` printed nothing.

- Line 28, the word: `The file has no schema: list, so this entry has no editor. Add a schema: to the file to edit it.` Holds against the prose rules. Two notes: it holds ": ", so it must be single-quoted as career.yml:10 is, which the brief does not say; and it is false for a malformed `schema:` (above).
- Line 24, ruling sentence: holds against plan.md:1587 and :3372.
- Line 67, Decision 1, "the ruling names a collection entry's card": breaks "No silent design decisions" and "a narrower reading of the request". plan.md:1587 and :3372 say "the entry", "its file" and "an entry of a file with no schema"; neither names a collection or a card of one.
- Line 68, Decision 2: holds.
- Lines 15 and 26, "carries no writing action(s)": breaks spec.md's "Verify before asserting" (F2). These are premise lines, not dictated text.

F5. Demo hub:
- `leads.yml` and `radar.yml` have no `schema:`, and demo config.yml:23-24 names `primary_key: title` for both.
- `Leads.svelte:135` and `RadarCard.svelte:146` open `entry` by title.
- `feedPage` line 196 answers null, so the reader sees "The file of leads holds no entry with the key X" over an entry the file holds.
- These are the only no-schema data files in the demo hub, and the hub has none, so the step as briefed changes nothing on any shipped data.

Reversing Decision 1 changes guarded rows `page-entry.test.ts:196,202`. It is inside the step line, so it is not a widening. This is a ruling for the orchestrator or Axel. Where open item 609 arose is not recorded in the state file (`grep -n "609\|no schema\|O107" .scratch/migration/orchestrator-state.md` has no such line).

## Declined to judge

- How the no-key address should be shaped (F1): a user-visible state shape, Axel's.
- Whether Status on a named-key no-schema file should stay on the collection view's card: outside this page, and an existing behaviour the ruling does not name.
- Whether the line belongs beneath the frame's head or above the card: the brief leaves it to the builder; judged at the look.
- Whether the sentence should change for a malformed `schema:`: a wording ruling.

Widening findings: none. Every finding above is inside the O107 line.


## Closed

- F1: open item 610: an entry with no key has no page, as ruling 598 keeps a row index out of a tab's state; the collection's card draws its title as words. Case rewritten.
- F2, F3, F4: What to build names the read-only page: no Status, no Delete, no Edit, no form; `entry-actions.ts`, `Person.svelte`, `editor-target.ts` joined the paths.
- F5: Decision 1 removed: feeds are inside the ruling; `feedPage` answers a page and the rows at `page-entry.test.ts:196,202` change under open item 610.
- Line numbers corrected; the word quoted and made true of a schema that does not read; the Add branch and the feed-page line named; the case-run program allowed; look states named.

Usage: a0a4cb0e10cbb5673, claude-opus-5-5, 229614 tokens, 26 tool uses, 7.1 minutes.
