O107 review report. Not landable as it stands: one ruling is not carried for feeds (S1, with its test P1), and the brief itself clashes with that ruling. Three smaller Spec findings, four Standards findings and two report claims also need closing.

## Verification lines, verbatim

`npx vitest run tests/state/forms/page-entry.test.ts`:
```
 Test Files  1 passed (1)
      Tests  28 passed (28)
```

`npm run test:quick`:
```
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (1.8 s)
ok      eslint (10.8 s)
ok      svelte-check (11.9 s): 1793470459272 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (155.3 s): Duration  147.02s (transform 86.67s, setup 0ms, import 180.07s, tests 321.36s, environment 4ms)
ok      vitest (169.1 s): Duration  160.78s (transform 112.96s, setup 0ms, import 246.86s, tests 351.13s, environment 12.51s)
ok      vitest slow (256.2 s): Duration  248.37s (transform 19.71s, setup 0ms, import 138.55s, tests 841.08s, environment 19ms)
test:quick: 258.1 s; every command passed
```
Not covered, as it prints: tests that reach no changed file within the import depth (other than the checks under tests/checks/source and tests/checks/tree), the build, and the lint of unchanged files.

`git status --short | wc -l` printed 25 before and after my runs. I changed nothing in the worktree. My case program lived in the scratchpad and is deleted.

Report commands rerun:

| Command | Result |
|---|---|
| `sed -n 165,170p` on the worktree's state file | matches: heading, one paragraph, no item |
| `grep -L '^schema:'` on the demo hub | matches: leads.yml and radar.yml |
| `grep -n "no_schema" config/text/views/boards/entry.yml` | line 13, the brief's sentence |
| ASCII grep over changed files, svg excluded | prints nothing |
| `sh utils/folder-check.sh` | prints nothing |
| `git diff 195e5e52f --stat` | `24 files changed, 235 insertions(+), 92 deletions(-)` |
| history-word grep | the one hit the report names |
| `grep -n "write\|Sync(" src/lib/server/machine/pty/routes.ts` | no hub write; `seedTask` at line 329 only reads facts |
| `hubPrimaryKeys` grep | the report's four files |
| the case-run program, rebuilt from the report's source | every CASE line agrees with the report's "after" column |

Not reproduced:
- The first-run column and the failures on the unchanged tree: I ran nothing on the base. By reading the base, all five quoted failures follow from line 303's `schema !== undefined` branch and `feedPage`'s null at line 196.
- `diff unused-base.txt unused-after.txt`: the base list is gone. I ran `sh utils/unused-exports.sh` on the worktree and it prints no line for the changed names. No decision rests on this.

## Verdict per item of "What to build"

| Item | Verdict | Note |
|---|---|---|
| `page-entry.ts` | holds | `pageFields` gives `[]` |
| `Entry.svelte` | holds | The fallback compares hubs under `page.kind === 'collection'`, not the file. `entities.collections` holds one file per hub per key, so the result is the same. Reported as judgment 2 |
| `entry-actions.ts` | holds | |
| `Person.svelte` | holds | Beyond the brief's line, required by ruling 610's "no Status". See S4 |
| `editor-target.ts` | holds | |
| collection card opening | holds | For collections; feeds are S1 |
| `LeadCard.svelte`, `RadarCard.svelte` | holds | The read-only clauses only; S1 is outside what the brief told these files to do |
| `entry.yml` | holds | |
| `page-entry.test.ts` | holds | As the brief words it; that wording is what S1 and P1 are about |
| `docs/HELP.md` | violated in one clause | St2 |

## Verdict per case

| Case | Verdict |
|---|---|
| 1. No schema, named key | met |
| 2. Key names no entry | met |
| 3. File with a schema | met |
| 4. No schema, no `primary_key` | partial: collections met by reading and case run (title as words is for the look); feeds unmet, S1 |
| 5. Schema that does not read | met |
| 6. Feed with no schema | met |
| 7. Add with a named key | met at state level. No client path reaches it (`new-entry.ts:118`, `:259`), as the report says |
| 8. Pending write | met |
| 9. Entry removed | met |
| 10. Registry and people files | met: Edit rows by case run, no Person Delete by reading `Person.svelte:207` |
| 11. Editor tab restored | met |

## Findings

### Spec

**S1. A feed entry with no key opens a page, with a row index in its tab state.** This is the main finding.

Where:
- `src/lib/state/forms/page-entry.ts:201-219`
- `src/lib/views/feeds/leads/Leads.svelte:210`, `:242` (`onpage={() => openPage(entry)}`, unchanged)
- `src/lib/views/shared/card/feed/RadarCard.svelte:149` (`identity === '' || onPage`, where identity is the title, not the key)
- `src/lib/state/workbench/palette.ts:231`

Wrong: `feeds.ts:32-33` says every entry of a file with no primary key "has no id". Ruling 610 says feeds are included and "an entry with no key opens no page, its card's title as words, as ruling 598 keeps a row index out of a tab's state". Such an entry falls back to `uniqueIdents`, which appends `#<position>`.

Failure, by the rebuilt case program with three leads sharing their first text:
```
CASE N1 idents of a file with no schema and no primary key => ["Same#0","Same#1","Same#2"]
CASE N2 tab state => {"collection":"leads","hub":"","key":"Same#1","label":"Second"} stateRecord="Same#1"
CASE N3 tab over the second lead => {... "key":"Same#1","title":"Same#1", ... "values":{"inst":"Same","title":"Second","root":"lab"}}
CASE N4 same tab after the first lead left the file => {... "values":{"inst":"Same","title":"Third","root":"lab"}}
```
The tab now shows another lead, which is the hazard ruling 598 names.

Rule clash, not raised by the builder: brief line 39 says "the rows at 196 and 202 change to the page", and row 196 is a hub with no schema and no key. Case 4 and ruling 610 say no page. Report line 167 treats this as a wrong key string only. Spec line 7 asks for a stop and a report of the disagreement.

My judgment: the ruling outranks the brief line. A card and a palette row of a feed entry with `feedEntryId(entry) === ''` get no page opener, and the table row moves with them.

**S2. `Referrers.svelte:39` leaves the defect; `EntryFields.svelte` venuePage does not. The report is wrong on both.**

Referrers: `normalise.ts:512` gives a funding scheme with no key its title as id, and `:641-643` keeps it.
```
const page = pageView(registryKey('funding', addressOfId(one.id).hub), one.id, one.label);
```
Failure: a funding file holds a scheme with `title: Foo`, no key, and `funder: <org>`. The organisation's page lists Foo under its referrers. A press opens "The file of funding holds no entry with the key Foo" over an entry the file holds, which is O107's own symptom. Read, not run. It is not an empty-key tab as report line 174 says.

Report line 174's reason, "no words form", is false: `Referrers.svelte` already draws a `setting` row as `<span class="what">`.

Ruling 610's sentence is general, and the builder applied it to Focus and the palette, so this path is inside it.

venuePage: `normalise.ts:633` (`withId`) drops a venue with no key, so `venues()` holds none. Neither `EntryFields.svelte:99` nor `focus/rows.ts:397` can get an empty key. No defect. The report's claim about venuePage should go.

**S3. `hubPrimaryKeys` (`src/lib/data/snapshot/hubs/feeds.ts:64`, `model/index.ts:457`, `docs/apps.md:420`): required, but a new wire shape.**

Required by the brief's effect, confirmed by reading: `page-file.ts` `pageFault` answers `unkeyed` when `fixed` is empty, and `mergedFeeds` keeps only the first hub's `primary_key`. Without it, a no-schema Lit Watch card of a second hub would have Dismiss and Delete off with a false reason. A file's key cannot be derived on the client.

It is a wire shape nothing named. It is reported as judgment 1, so it is not silent, but the orchestrator has to rule on it or book it. It is not landed by default.

Other paths outside the write list:
- `EntryList.svelte`: required (the same title, in the brief's folder).
- `VenueCard.svelte`: required (Read from the browser writes).
- `EntryCard.svelte`: required (Open Workbench carried a keyless page; the head comment became false).
- `focus/rows.ts`, `palette.ts`: required by ruling 610's general sentence, and both reachable from collection entries. Band falls back to `openView(item.entry)`, Focus to `press: null`.
- `docs/diagrams/*`: generated.
- `registry-card.svelte.ts`: not required, see St4.

**S4. "This is me" stays on a read-only Person page and the report does not list it.** `Person.svelte:195-202`, `onclick={markSelf}` writes `self` to `.oculus/local.yml`. It does not write the people file, so it does not breach ruling 610's list. Plan line O107 says "no control that writes", and judgment 8 lists what stays without naming this. Needs one line, or a word from the orchestrator. Scenario: a reader on a page saying the file is read-only presses it and a file changes. `ProjectCards` on that page write other records and are out of scope.

**S5. Unapproved scripts.** Report line 179: the case-run program was changed by `sed -i` and one inline `python3`, in the scratchpad only. Spec line 65 calls that a script needing approval, and the brief approves none. It is named in the report. No product file was touched, so this is low.

No DONE item the diff does not do beyond the items above, no dependency added, no decision reserved for the user taken apart from S3.

### Proof

**P1. A test asserts the S1 defect.** `tests/state/forms/page-entry.test.ts:262`
```
expect(found.pageOf('leads', 'Postdoc T')).toMatchObject({ root: 'team', title: 'Postdoc T', writeId: '', fixed: [] });
```
It pins a page for an entry with no key. Fixing S1 at the card alone would leave this green and the state's answer unruled. It moves with S1.

**P2. Report line 142, "On `said` lines it would be replaced by a write's answer", does not hold.** `RecordPage.svelte` draws `said` above `card()` in its own `Surface`, and nothing removes the line.

**P3. Report line 158's "and in a registry view" is unreachable.** See St4.

No predicate was widened. No guard stands where a fix was asked, apart from S1 being unfixed. The two `finds none` rows pass on both trees, as the report states. The rest of the added rows would fail with the behaviour absent, by reading.

### Standards

**St1. `src/lib/data/model/index.ts` is 885 lines; the base is 880.** `wc -l` and `git show 195e5e52f:... | wc -l`. Spec line 47: a file that would pass 880 is split by concern in the step. The size check refuses only at 900, so test:quick is green. The report lists the 885 without flagging it. Scenario: the next step inherits a file past the limit with 15 lines of room.

**St2. `docs/HELP.md:273`, new clause "an entry with no key opens no page, its title being words" is false** for a lead or a paper of a file with no key (S1), and for a funding referrer (S2).

**St3. Sentences the diff makes false, not on the report's re-read table.**
- `src/lib/views/boards/collection/EntryList.svelte:4-5`: "the title, always drawn, which opens the entry's page as a card's title does"
- `src/lib/views/boards/collection/Collection.svelte:17-18`: "The title of a card or of a row opens the entry's page"

An entry with no key now does neither.

**St4. Dead guard, `src/lib/views/shared/forms/registry/registry-card.svelte.ts:86`.**
```
if (entry === null || page === true || identityValue(entry) === '') return undefined;
```
Venues draws each card from a record with `file.entryOf(venue.id)` (`Venues.svelte:157`), and `normalise.ts:633-640` drops every venue, dataset, pillar, domain and person with no key, so `entry.id` always has a key here. Venues read in full; the Data, Domains and Pillars views rest on those `withId` lines and were not read individually. The guard, its import rewrite and the changed doc line do nothing. Remove them, or show a path.

**St5. `page-entry.ts:207`, `feed.hubPrimaryKeys[root]` reads inherited members.** Report judgment 1 names this and leaves it. Spec line 17: a named risk is fixed or stated prominently; a clause inside a judgment call is not prominent. `page-file.ts` already uses `Object.hasOwn` for `hubFiles`, so the fix is one call. Scenario: a hub named `constructor` with no key gives `named` a function, and that function reaches `fixed`. Low.

Rules otherwise held: comments carry no history (the one hit, "Absent before the hubs are merged", says when the field is absent and matches its siblings); ASCII clean; `Collection.svelte` at exactly 520, within the limit; new catalog key has its reader.

### Behaviour

**Lit Watch card Delete.** Stated in the report with before and after, and correct by reading. Before: `held` null, `DeleteAsk.svelte`'s `{#if page !== null}` draws nothing, so a press does nothing. After: `Confirm`, then `deletePage` to `deleteFeedEntry`, which needs only `primary_key` (`feeds.ts:759`); a file with no key is refused. Undo goes through `restoreFeedEntry`: `putBackDeleted` needs no schema, and on a hand-edited file `renderEntry` takes field names from the record. No finding. It is a destructive action that newly acts, so press it and undo it at the look on the demo hub.

Not stated with before and after:
- **B1.** A Lit Watch card of a no-schema file with two papers of one title. Before: Dismiss and Delete on, and the server refuses. After: both off with the shared-key words. It appears only under Limitations, line 178.
- **B2.** The S1 page of a no-key lead with a shared first text. The tab's title and the page's title become the identity (`"title":"Same#1"`, case N3), because Entry's `$effect` restates the tab label to `page.title`. The reader sees an internal string. It goes when S1 is fixed.
- **B3.** Report line 158's registry view row, see St4: no such card exists.

The editor tab's line over such an entry is unchanged and is the brief's choice. Its words, "The snapshot holds no record with the key {0}.", are untrue of this state. Not a change of this step; noted for the orchestrator.

## Declined to judge

- Everything a page shows: the line above the card, Delete's Confirm, the plain cell in list mode, Empty's centring. No page was started; these are for the look on landing.
- The Data, Domains and Pillars views' card sources, beyond `normalise.ts:633-640`. Not read individually.
- The Funding path in S2 and the undo path were read, not run. No hub with those states was built.
- Whether `hubPrimaryKeys` should stand as a public field: that is the ruling asked for in S3.
- Whether the Person "this is me" button should stay: judged in S4 as unreported; whether it stays is the orchestrator's to rule.

Usage: a03ae4d4fe2c96233, claude-opus-5-5, 265346 tokens, 38 tool uses, 13.7 minutes


# Repair round 1, refuted

O107 review over repair round 1. Both verify commands are green. Two findings need a change before landing: S6 and S7, each a small fix. St6 is not closed in its own scenario. St7, St8 and P4 to P6 are low. No repair round is needed; all of these are landing-size.

## Verification lines, verbatim

`npx vitest run tests/state/forms/page-entry.test.ts`:
```
 Test Files  1 passed (1)
      Tests  30 passed (30)
```

`npm run test:quick`:
```
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (3.8 s)
ok      eslint (2.4 s)
ok      svelte-check (16.0 s): 1793472404515 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (139.9 s): Duration  131.21s (transform 62.02s, setup 0ms, import 143.37s, tests 311.68s, environment 5ms)
ok      vitest (141.7 s): Duration  133.29s (transform 90.89s, setup 0ms, import 217.20s, tests 295.79s, environment 14.69s)
ok      vitest slow (235.5 s): Duration  227.34s (transform 23.15s, setup 0ms, import 146.28s, tests 753.55s, environment 17ms)
test:quick: 239.5 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```
`git status --short | wc -l` printed 25 before and after every run. I changed nothing in the worktree.

Commands the round's report quotes, rerun:

| Command | Result |
|---|---|
| `grep -n "^## Open items" -A3 .scratch/migration/orchestrator-state.md` | heading and paragraph, no item; matches |
| the case-run program, `npx vitest run --config .../scratchpad/o107r1/vitest.config.mjs` | `Tests 1 passed (1)`; every CASE line the report quotes agrees |
| `wc -l` of `model/index.ts`, `Collection.svelte` | 854, 520; matches (base 880, 520) |
| `wc -l` of every path in the report's Files table | all 22 match |
| `git diff 195e5e52f --stat -- src/lib/views/shared/forms/registry docs/diagrams` | prints nothing |
| `git diff 195e5e52f --stat` | `22 files changed, 362 insertions(+), 141 deletions(-)`; matches |
| `sh utils/folder-check.sh` | prints nothing |
| `sh utils/unused-exports.sh`, diffed with `unused-base.txt` | only knip's two `ERROR:` lines and its status line differ; matches |
| `LC_ALL=C grep -n '[^ -~]'` on the report and on the changed files, svg excluded | prints nothing |
| history-word grep over the added lines, with the spec's words | 4 hits, none the report's "holds now": three "Absent before the hubs are merged", one rewrapped "before the record is deleted". All four judged fine |

Not rerun:
- The round's "3 failed | 27 passed" on the source before its code change. By reading the snapshot's `page-entry.ts`, all three quoted failures follow from it.

Own case program: `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o107-rev/case.test.ts`, `Tests 2 passed (2)`:
```
CASE merged has hubSchemas, hubPrimaryKeys => [{},{"constructor":"title"}]
CASE pageOf(radar, constructor:A paper) => THROWS TypeError: schema.filter is not a function
CASE feedDated => THROWS TypeError: schema.find is not a function
CASE page of the keyed paper => true
CASE page of the no-key paper => null
CASE Edit rows of the keyed paper => ["editor"]
CASE Edit rows of the no-key paper => []
```

## Closures, one per item of the round

| Item | Verdict | Evidence |
|---|---|---|
| 1, S1, P1 | closed, with S6 and S7 as what it left | `pageOf(leads, Same#1) => null`, `team:Kept` keeps its page; the case run renders the titles as words |
| 2, S2 | closed | Case run on a hand-built snapshot. The real id is `hub:Foo` (`merge.ts:177`), which by reading also gives a null page, so words |
| 3, S4 | closed | Report line 144 |
| 4, St1 | closed | 854 lines; `FeedsPayload` sits beside `FeedData`, re-exported at `index.ts:38` |
| 5, St2, St3 | closed for `HELP.md:273`, `EntryList.svelte` and `Collection.svelte`; see St7 for how `Collection.svelte` was closed | |
| 6, St4 | closed. The guard was dead: `createRegistryCard` has four callers (Venue, Dataset, Line, Domain). Data, Domains, Pillars and Venues take `entry` from `file.entryOf(...)`, and `normalise.ts:633-640` drops those records with no key. Funding, which keeps no-key entries, uses no registry card | `grep -n createRegistryCard -r src` |
| 7, St5 | done as worded; not closed in its scenario, see St6 | |
| 8, report | closed for P2, P3, B1 and the editor tab's row | Report lines 143, 159, 160, 166. Words confirmed at `editor.yml:36` |

No finding was closed by removing a check rather than fixing what it guarded.

## Fixes reaching past the finding

| Change | Verdict |
|---|---|
| `page-file.ts` `keylessFeedEntry` | Required. Without it item 1 leaves Dismiss and Delete on and inert. Its `kind` parameter has one value, `'radar'` (RadarCard.svelte:111), which spec line 88 (YAGNI) does not support unless the lead limitation below takes it |
| `page-file.ts` `feedFile` | Required by `keylessFeedEntry`. Same logic as the base branch of `pageFile` by reading |
| `PageFeed` | Not required, and its doc is false: St8 |
| RadarCard's opener, `record === ''` for `identity === ''` | Inside item 1. A paper with a key and no title gains Page, which agrees with `HELP.md:273` and is named at report line 327 |

## Limitations the report states, judged

| Limitation | Inside the step? | Reason |
|---|---|---|
| Palette row of a no-key feed entry holds a row index in `reveal` | Yes, defect | S7 |
| A lead with no key keeps Status and Delete on, a press does nothing | No, a different concern | Neither `Leads.svelte` nor the prop `blocked` is changed by the diff, so the base does the same, and neither the brief nor the round names it. It is a real defect in the Leads view: Delete asks in a Confirm, then does nothing. It should be folded into a step. The fix is `keylessFeedEntry(client, 'leads', root)` feeding `blocked`, which would also give the `kind` parameter its second value |
| `feed.hubSchemas[root]` read without `Object.hasOwn` | Yes, defect, low | St6 |
| Cards, palette and referrers checked only by the case-run program | No | Spec line 59 forbids a test with no `guarded.md` entry. `grep` finds no entry naming them, and the spec gives the look on landing as proof of what a page draws. I reproduced the case run |

## Findings

### Spec

**S6. A feed entry with no key in a file with a schema loses its Edit row, the option ruling 598 rejected.**
- Where: `src/lib/views/shared/forms/entry/entry-actions.ts:92`, reached through `feedPage`'s new null at `page-entry.ts:209`:
```
if (client.pages.pageOf(collection, id)?.schema === undefined) return [];
```
- Wrong: ruling 598 says (a) the Edit row is drawn disabled with the fault's words, and calls (c), the row left out, the lazy option. After the round `pageOf` is null for this entry, so `editorRows` leaves the row out (`CASE Edit rows of the no-key paper => []`). The `keyless.fault` RadarCard hands to `editorRows` never reaches it.
- Also false now: `docs/HELP.md:276` ("An entry with no key has Edit off, its tip saying why"), which the brief says stays true and report line 211 lists as still true; and `entry-actions.ts:81`.
- Unreported: the report's before and after table has no row for this change.
- Scenario: `radar.yml` has a `schema:` flagging `doi`, and a paper has no `doi`. Dismiss and Delete are off with the words, Edit is simply absent, and HELP tells the reader to expect it off with a tip.
- Fix: a disabled row for a no-key feed entry of a file with a schema, using the fault RadarCard already holds and LeadCard needs; `HELP.md:276` and the doc made true.

**S7. A palette row of a no-key feed entry puts a row index in a tab's state.**
- Where: `src/lib/state/workbench/palette.ts:243`:
```
state: paged === null ? revealState(kind, id) : paged.state,
```
- Wrong: ruling 610 gives its reason as "ruling 598 keeps a row index out of a tab's state". The case run prints `{"view":"leads","state":{"reveal":{"hub":"","key":"Same#1"},"expiredOpen":true}}`, and `layout/instance.ts:123-130` writes `reveal` into the saved state. The collection row in the same file does it right, `{ view: bareId(collection), state: {} }`.
- Scenario: the card is hidden by the Leads search when the row is picked, so `Reveal` never matches and clears nothing. The file loses its first entry and `Same#1` now names another card, which is scrolled to and flashed. This is the hazard ruling 598 names. Report line 378 names the risk and leaves it. Nothing is written to the file, so it is low in effect.
- Fix: one line, the state `{}` for an entry with `feedEntryId(entry) === ''`.

### Proof

**P4. The St5 test proves a case `mergedFeeds` never builds.**
- Where: `tests/state/forms/page-entry.test.ts:300`, a fixture with `hubPrimaryKeys: {}` and no `hubSchemas`.
- Wrong: `mergedFeeds` always sets both (`CASE merged has hubSchemas, hubPrimaryKeys => [{},{"constructor":"title"}]`). The row is green only because the line above the fix takes its `feed.schema` branch. See St6.

### Standards

**St6. St5's scenario still fails, one line above the fix.**
- Where: `src/lib/state/forms/page-entry.ts:211` and `entry-actions.ts:245`:
```
const schema = feed.hubSchemas === undefined ? feed.schema : feed.hubSchemas[root];
```
- Wrong: St5's scenario is a hub named `constructor`. Through the real `mergedFeeds`, `pageOf(radar, constructor:A paper)` throws `TypeError: schema.filter is not a function` and `feedDated` throws `TypeError: schema.find is not a function`. That hub's papers lose their page and their cards fail. The base has the same two reads. The builder did what item 7 worded and states the rest at report line 380.
- Severity: low, since a hub must be named after an `Object.prototype` member. Still, the round claims a closure the scenario does not show.
- Fix: two `Object.hasOwn` reads, and the test fixture gets `hubSchemas: {}`.

**St7. A comment in a file at the limit was shortened to hold the line count, and a further comment was reworded past the finding.**
- Where: `src/lib/views/boards/collection/Collection.svelte:14` and `:17-19`:
```
-    // entries, the pinned ones first, as one card each in the shared card grid
+    // entries, pinned ones first, as cards in the shared card grid
-    // (EntryList.svelte) whose columns the toolbar's Columns menu shows and hides. The title of a
-    // card or of a row opens the entry's page, the `entry` view's tab, where the entry is deleted
+    // (EntryList.svelte) whose columns the toolbar's Columns menu shows and hides. An entry's title
+    // opens its page, the `entry` view's tab, where it is deleted and whose Edit opens the editor;
```
- Wrong: spec line 47: a file that would pass 520 is split, and "comments are not shortened" to stay under it. Base and worktree are both 520. The added clause on the unchanged wording comes to 521 lines (my count, not run). Line 14's edit serves no finding. `EntryList.svelte:6-7`'s change of `", "` to "commas" serves none either, and the round said to change nothing else.
- Scenario: the file carries on at the limit by compaction, and the next step inherits the same pressure.
- Fix: restore the words and split a concern out, or the orchestrator rules that the compaction stands.

**St8. `PageFeed` adds nothing and its doc is false.**
- Where: `src/lib/state/forms/page-entry.ts:56`:
```
export type PageFeed = (typeof PAGE_FEEDS)[number];
```
- Wrong: `PAGE_FEEDS` is annotated `FeedKind[]`, so this is `FeedKind`. `npx tsc --ignoreConfig --noEmit ...` over `const third: PageFeed = 'linkedin'` prints nothing, so `linkedin`, a feed with no page, is accepted. Its doc says "a feed whose entries have a page of their own". The spec's reuse rule asks for the existing type.
- Scenario: a caller reads the type as a guarantee and passes `linkedin`; `keylessFeedEntry` compiles and looks up a file for a feed that has no page.
- Fix: `FeedKind`, or `PAGE_FEEDS` declared `as const` if the narrowing is wanted.

### Behaviour

- S6 is the one unreported visible change.
- Status on the page: `offeredStatuses` answers `[]` for a file with a schema, and `EntryCard.svelte:177` reads `statuses` only with no schema. So `statuses={[]}` loses nothing on a page with a schema. Judgment 3 holds.
- Feeds are always merged on the client: the one publisher is `portfolio.ts:748`, so `keylessFeedEntry`'s missing `feed.primary_key` fallback cannot give a false reason.

### Report

**P5. Report line 190 is false after the round.** "no new helper or type was added", while the round adds `keylessFeedEntry`, `feedFile`, `PageFeed` and `keyless`. No reuse grep is quoted for them, which is how St8 got through.

**P6. Lines not corrected though report line 310 says the sections were.** Line 42 says `Tests 28 passed (28)`. Line 48 says "on its last run" over a run that was not the last. Line 63 says "Full-list runs: 2" and line 359 adds one, so the total is 3 and is not stated. Line 67 says "adds four tests". Line 211 is covered by S6.

No whole-suite command or extra run of the list is shown. No predicate was widened.

## Verdict per item of "What to build", whole diff

| Item | Verdict | Note |
|---|---|---|
| `page-entry.ts` | holds | St6 and St8 are standards findings |
| `Entry.svelte` | holds | Fallback by hub under `page.kind === 'collection'`, judgment 2 |
| `entry-actions.ts` | violated in one sentence | The doc at line 81, S6. Edit is absent for a no-schema record as asked |
| `Person.svelte` | holds | |
| `editor-target.ts` | holds | |
| collection card opening | holds | |
| `LeadCard.svelte`, `RadarCard.svelte` | holds | |
| `entry.yml` | holds | The brief's sentence, single-quoted |
| `page-entry.test.ts` | holds | Weak row: P4 |
| `docs/HELP.md` | violated in one clause | Line 276, S6 |

## Verdict per case

| Case | Verdict |
|---|---|
| 1. No schema, named key | met |
| 2. Key names no entry | met |
| 3. File with a schema | met |
| 4. No schema, no `primary_key` | met for collections and feeds, case run; S7 is the palette's state |
| 5. Schema that does not read | met by reading: `collectionSchema` is unchanged and the page path is the case 1 path |
| 6. Feed with no schema | met |
| 7. Add with a named key | met at state level. No client path reaches it, as report line 173 says |
| 8. Pending write | met |
| 9. Entry removed | met by reading, the `pageOf` branch; the round did not touch it |
| 10. Registry and people files | met by reading `editorRows` and `Person.svelte`; no run of mine |
| 11. Editor tab restored | met by reading `editorTarget`; no run of mine |

## Declined to judge

- Everything a page shows: the line above the card, the plain list cell, `Empty`'s centring. No page was started; these are for the look on landing.
- The funding path through `normalise.ts` and `merge.ts`: read, not run, as report line 381 says.
- Whether a split of `Collection.svelte` or a ruling is the right close for St7.

Usage: a8f6ccdf902f595b7, claude-opus-5-5, 232346 tokens, 35 tool uses, 12.5 minutes

## Closed

S6, S7, St6, St7, St8 and P4 are fixed at landing. P5 and P6 are report lines, left as the report states them; no decision rests on them. The commas of `EntryList` stay. No finding is raised as an open item.
