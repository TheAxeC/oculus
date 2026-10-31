# O107 report: an entry of a file with no schema opens its page

Everything in the brief is done.

## Open items of the state file

`sed -n 165,170p .scratch/migration/orchestrator-state.md` prints the heading "## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)", its one paragraph, and no item. There are none to copy. This step raises one decision the orchestrator may reverse (judgment call 1 below).

## The cases' first run, on the unchanged tree

Run by the case-run program quoted at the end, `npx vitest run --config <scratchpad>/cases/vitest.config.mjs`, a config that takes one test file from the scratchpad. Its files are gone. Every line below is as printed, cut to the part that matters. No case was one the brief's rules get wrong.

| Case | First run on the unchanged tree | Run after the last change | How checked |
| --- | --- | --- | --- |
| No schema, named key, entry | `null` | `{"kind":"collection","key":"hub:a","title":"a",...,"fixed":["name"],"values":{"name":"a","status":"open"}}`, no `schema` key | test and case run |
| Same file, key names no entry | `null` | `null` | test and case run |
| A file with a schema | page with `"schema":[{"field":"name",...}]` | the same | test and case run |
| No schema, no key | `{"collection":"plain","hub":"hub","key":"","label":"x"} stateRecord=""`: a press opened that tab | `pageView` prints the same state, `identityValue => ""`, so `pageOpener` hands no opener; focus `entryPage => null`; palette row `[{"view":"plain","state":{}}]` | case run and reading; the title as words is the look on landing. The `identityValue`, `entryPage` and palette lines ran after the change only; their before is read in the base copy |
| A `schema:` that does not read | `collectionSchema => undefined`, page `null` | `undefined`, page as with none | case run |
| Feed with no schema, entry held | `null` for the named key and for the unkeyed entry | `{"kind":"feed","key":"hub:Named",...,"fixed":["title"]}`; `{"kind":"feed","key":"Unkeyed","root":"lab","writeId":"","fixed":[]}` | test and case run |
| Feed with no schema, entry not held | `null` | `null` | test and case run |
| Add to a file with no schema, named key | `null` | `{"key":"hub:new","title":"new",...}` | test and case run |
| Pending write on such an entry | `null` | `"values":{"name":"b","status":"closed"}` | test and case run |
| Entry removed while its tab is open | `null` | `null` | case run |
| Registry file and people file: Edit rows | `0` and `0` | `0` and `0` | case run; no Delete on the Person page by reading `Person.svelte`, and the look on landing |
| Editor tab restored over such an entry | `null` | `null` | case run |

The demo hub's state: `grep -L '^schema:' tests/fixtures/hubs/demo/.oculus/data/*/*.yml` prints `tests/fixtures/hubs/demo/.oculus/data/academic/leads.yml` and `.../literature/radar.yml`.

## DONE / NOT DONE

| Deliverable | State | Command and output |
| --- | --- | --- |
| `page-entry.ts`: optional schema, `pageOf`, the pending branch, `feedPage`; `pageNamed` for the career file and `pageFields` keep working | DONE | `npx vitest run tests/state/forms/page-entry.test.ts tests/checks/source/comment-width.test.ts`: `Tests  30 passed (30)`; `CASE 1 pageFields of such a page => []` |
| `Entry.svelte`: the line above the card, no control that writes, the read controls kept, the fallback by the file | DONE by reading, svelte-check; the sight is the look on landing | `npm run test:quick`: `ok      svelte-check (66.9 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `entry-actions.ts`: no Edit row, comment true | DONE | `CASE 10 registry card Edit rows => 0`, `CASE 10 people card Edit rows => 0` |
| `Person.svelte`: no Delete, comments true | DONE by reading; the look on landing | as svelte-check above |
| `editor-target.ts`: no form target | DONE | `CASE 11 editor tab over such an entry => null` |
| Card of an entry with no key: no opener | DONE by reading; the look on landing | `CASE 4 no schema no key: identityValue => ""` |
| `LeadCard.svelte`, `RadarCard.svelte` | DONE by reading; the look on landing | one clause each, listed below |
| `entry.no_schema` in `entry.yml`, single-quoted, word for word | DONE | `grep -rn "no_schema" config/text/views/boards/entry.yml` prints line 13 with the brief's sentence |
| `page-entry.test.ts`: rows added, 196 and 202 changed | DONE | verify 2 run alone: `Tests  28 passed (28)`; after it the only change to a file it tests was prettier's on `page-entry.ts`, and the last `test:quick` ran the file: `ok      vitest (261.1 s)` |
| `docs/HELP.md`: lines 276 and 339 true, one sentence on the page | DONE | line 273 ends with the new sentence; 276 and 339 read and left |
| Verify 1 | DONE | `test:quick: 358.5 s; every command passed` |
| Verify 3: failures on the unchanged tree | DONE | quoted under Tests |
| Verify 4: each sentence read against the standards | DONE | read; the greps below |

The lines `npm run test:quick` printed on its last run:

```
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.0 s)
ok      eslint (65.1 s)
ok      svelte-check (66.9 s): 1793469877250 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (244.7 s): Duration  233.72s (transform 125.10s, setup 0ms, import 274.53s, tests 523.45s, environment 5ms)
ok      vitest (261.1 s): Duration  251.72s (transform 234.36s, setup 0ms, import 470.39s, tests 502.10s, environment 26.35s)
ok      vitest slow (356.4 s): Duration  347.29s (transform 27.34s, setup 0ms, import 185.69s, tests 1192.62s, environment 20ms)
test:quick: 358.5 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files
```

Full-list runs: 2. The first printed `FAILED  vitest checks`, one case, `tests/checks/source/comment-width.test.ts`, line `src/lib/views/boards/person/Person.svelte:25`, a file the step changes. That paragraph was rewrapped, the file rerun alone (30 passed with the page test), and the list run once more. No whole-suite command was run. `npm run diagrams` ran right before each list.

## Tests

The step adds four tests and one table row pair and changes two, all in `describe('pageOf')`, entry G32, which names every row of that describe, so `agents/guarded.md` needs no change. The verbose run on the unchanged source (`Tests  5 failed | 23 passed (28)`):

| Test | On the unchanged tree |
| --- | --- |
| finds an entry of a file with no schema, with its title and values and no schema | `AssertionError: expected null to match object { kind: 'collection', ...(5) }` |
| makes the page of an Add to a file with no schema from the fields the write took | `AssertionError: expected null to match object { key: 'hub:new', title: 'new', ...(1) }` |
| shows the values a write took over an entry of a file with no schema | `AssertionError: expected undefined to deeply equal { name: 'one', status: 'closed' }` |
| finds a feed entry of a workspace with no primary with the schema of its own hub (changed) | `AssertionError: expected null to match object { root: 'team', ...(3) }` |
| finds a feed entry of a file with no schema, named by the key of the file | `AssertionError: expected null to match object { Object (kind, title, ...) }` |
| finds a collection entry with the values, the fixed fields and the peers (changed: `schema: SCHEMA`) | passes on both, a preserved behaviour |
| finds none for a key no entry of a file with no schema holds | passes on both |
| finds none for a key no entry of a feed with no schema holds | passes on both |

Every edit to an existing test line, from `diff <base>/tests/state/forms/page-entry.test.ts tests/state/forms/page-entry.test.ts`:

| Before | After |
| --- | --- |
| `const held = [collection('hub', ['a', 'b']), collection('second', ['c'])];` | the list with `NO_SCHEMA` added |
| `radar: { meta: {}, entries: [{ title: 'A paper', root: 'hub', id: 'hub:A paper' }] }` | the same with `primary_key: 'title'` |
| `const feed = (schema: SchemaField[] \| undefined, title: string) => ({` | takes a third argument `key?: string` |
| `...(schema === undefined ? {} : { schema, primary_key: 'title' })` | `schema` and `primary_key` spread apart, so a file can have a key with no schema |
| `const own = (schema: SchemaField[] \| undefined, title: string) =>` and its body | passes `key` on |
| `{ key: 'lab', feeds: own(lab, 'Postdoc L') },` | `own(lab, 'Postdoc L', 'title')` |
| `{ key: 'team', feeds: own(undefined, 'Postdoc T') }` | the same, and a hub `named` with `own(undefined, 'Postdoc N', 'title')` |
| `expect(found.pageOf('leads', 'team:Postdoc T')).toBeNull();` | the page by `'Postdoc T'`, and the page of `'named:Postdoc N'`, `fixed: ['title']` |
| `['a feed that has no schema', 'radar', 'hub:A paper'],` | moved out to its own test of the page |
| `['a feed entry no file holds', 'leads', 'hub:Postdoc B']` | kept, with a comma, then a row for a key no entry of a feed with no schema holds |

No allow list or predicate was edited.

## Files

From `diff -rq <base copy> <worktree>` over `src`, `tests`, `config`, `docs` and `utils`; the base copy is `<scratchpad>/base`, which the step made since the brief names none. Line counts from `wc -l`.

| File | Lines | On the write list |
| --- | --- | --- |
| `src/lib/state/forms/page-entry.ts` | 404 | yes |
| `src/lib/views/boards/entry/Entry.svelte` | 379 | yes |
| `src/lib/views/shared/forms/entry/entry-actions.ts` | 319 | yes |
| `src/lib/views/boards/person/Person.svelte` | 312 | yes |
| `src/lib/views/boards/editor/editor-target.ts` | 222 | yes |
| `src/lib/views/boards/collection/Collection.svelte` | 520 | yes; at the limit, the line count unchanged |
| `src/lib/views/shared/card/feed/LeadCard.svelte` | 432 | yes |
| `src/lib/views/shared/card/feed/RadarCard.svelte` | 388 | yes |
| `config/text/views/boards/entry.yml` | 28 | yes |
| `tests/state/forms/page-entry.test.ts` | 351 | yes |
| `docs/HELP.md` | 606 | yes |
| `src/lib/data/snapshot/hubs/feeds.ts` | 79 | no: `feedPage` of a file with no schema needs the primary key of the entry's hub, judgment call 1 |
| `src/lib/data/model/index.ts` | 885 | no: the type of that payload field |
| `docs/apps.md` | 847 | no: its `feeds` row lists the payload's fields |
| `src/lib/views/boards/collection/EntryList.svelte` | 158 | no: list mode opens a page from the title too, the same case as the card |
| `src/lib/views/shared/forms/registry/registry-card.svelte.ts` | 123 | no: the Venues, Data, Domains and Pillars cards open a page through it, the same case |
| `src/lib/views/shared/card/record/registry/VenueCard.svelte` | 374 | no: Read from the browser writes the entry, so a page with no schema must not offer it |
| `src/lib/views/shared/forms/entry/card/EntryCard.svelte` | 365 | no: its head comment "Every entry has a page" became false, and Open Workbench handed a page with no key to the folder's pane |
| `src/lib/views/boards/focus/rows.ts` | 505 | no: `entryPage` opened a no-key entry from Focus; its doc named `openPage` |
| `src/lib/state/workbench/palette.ts` | 850 | no: a palette row opened a no-key entry's empty tab |
| `docs/diagrams/layers.dot`, `layers.svg`, `layer-views.dot`, `layer-views.svg` | 101, 556, 179, 809 | no: written by `npm run diagrams`; the count of imports from views to state, 1514 to 1515 in `layers.dot` |

`git diff --stat`: `24 files changed, 235 insertions(+), 92 deletions(-)`.

## The changes to the two cards

- `LeadCard.svelte:243`: `if (identity === '' || (page && held?.schema === undefined)) return rows;`, so on such a lead's page the menu ends after the posting: no Status, Applied, Decline, Reopen or Delete. Head comment extended. The card in the Leads view keeps every action.
- `RadarCard.svelte`: `if (identity === '' || (onPage && held?.schema === undefined)) return openers;`, so that page holds the paper and the projects: no Dismiss, Restore, Idea, Save to Literature or Delete. Head comment extended. The card in Lit Watch keeps every action.

Edit on both goes through `editorRows`, and the Add run through `feedDated`, which answers undefined with no schema.

## Judgment calls the orchestrator may reverse

1. A new payload field, a wire shape the brief does not name: `hubPrimaryKeys?: Record<string, string>` on each feed of the `feeds` channel, the primary key of the feed's file by hub, which apps can read and `docs/apps.md` lists. `mergedFeeds` keeps the primary hub's `primary_key` alone, and `pageFault` calls a feed page with no fixed field unkeyed. Without per-hub keys, every no-schema Lit Watch card of a second hub, or of a workspace with no primary, would have Dismiss and Delete disabled with a false reason. Empty: a file with no key has no row, the page has `fixed: []`. Duplicated: one row per hub by `Object.fromEntries`. Colliding: `feed.hubPrimaryKeys[root]` is read as `hubSchemas[root]` is, so a hub named like an `Object.prototype` member would read the inherited value, unfixed as on `hubSchemas`. Asynchronous paths: none, it is a value of one payload.
2. The fallback at `Entry.svelte:131` compares `rootOf(one) === page.root` under `page.kind === 'collection'`. The brief says it compares by the file. `collectionsOf` gives one file per hub for a key, since `entities.collections` is keyed by hub and key, so the hub names the file and `PageEntry` needs no new field. The kind guard keeps a feed page off a collection keyed `leads` with no `registry:`.
3. `Entry.svelte` and `Person.svelte` take `schema` from `page?.schema`, so one fact decides the page. `lifecycle` is removed from both and the card is handed `statuses={[]}`: it held statuses only for a file with no schema, which those pages no longer offer.
4. The Person page goes beyond the brief's line for it, "no Delete": it also loses Status and gains the line above the card. Plan line O107 and ruling 610 say the page of an entry of such a file has no Status and carries the line, and a person's page is one. `docs/HELP.md:339` stays true.
5. The ruling's "an entry with no key opens no page" is applied past the collection card: list mode (the title is plain words), registry cards, Focus (`entryPage` null, so a ticker line is words and a Band card opens the collection) and Open Workbench (no page in the documents pane).
6. A palette row of an entry with no key opens its collection's view rather than an empty entry tab. Dropping the row was the other choice; it would hide the entry from search.
7. The line is drawn with `ui/frame/Empty.svelte`, as the Career view draws its sentence, with no glyph. It is centred, as `Empty` is. On `said` lines it would be replaced by a write's answer.
8. Start Agent stays on the read-only page of a task. It seeds a composer (`composeAt`, `host.seedTask`), and `grep -n "write\|Sync(" src/lib/server/machine/pty/routes.ts` shows it writes no hub file. Recover on a dataset's page stays too: it opens a view.
9. `pageOpener` replaces `openPage` in `Collection.svelte`, which holds the file at 520 lines; `EntryList.svelte`'s `onpage` now answers the opener.

## Before and after, for the look

Internal choices need no look; these are what a reader sees. A demo-hub workspace shows the first three, its `leads.yml` and `radar.yml` having no `schema:`.

| View and state | Before | After |
| --- | --- | --- |
| Lead's page, file with no schema | "The file of leads holds no entry with the key ..." | the sentence `entry.no_schema` over the lead card; menu with the posting only; no Applied in the strip; toolbar has Show in, Source; no Delete |
| Lit Watch paper's page, same | the unknown-entry message | the sentence over the card; paper and projects only; no Dismiss; no Delete |
| Lit Watch card in a file with no schema | Delete pressed: nothing happened, `DeleteAsk` had no page | Delete asks, then deletes; Dismiss and Delete are off while the file has unsaved text in a source tab, and off with the no-primary-key reason for a file with no key |
| Entry page, collection file with no schema and a named key | the unknown-entry message | the sentence over the card, its fields as text; Show in Files and Open Workbench kept; no Status, Delete or Edit; referrers and folder blocks kept |
| Venue's page, file with no schema | the unknown-entry message | the sentence over the venue card; no Edit, Edit in File, Delete or Read from the browser |
| Person's page, people file with no schema | card with Status, no line | the sentence over the card; no Status, Edit or Delete |
| Card of an entry with no key, in cards, in list mode and in a registry view | title pressable, opens "This tab was opened for no entry" | title is words, no Page; list mode cell is plain text in the cell's colour |
| Focus line or Band card of an entry with no key | opens that empty tab | a line is words; a Band card opens the collection |
| Palette row of an entry with no key | opens that empty tab | opens the collection's view |
| Open Workbench on a card of an entry with no key | the documents pane held that empty tab | the pane holds no page |
| Editor tab over such an entry | the gone-record line | the same |
| A key that names no entry | the unknown-entry message | the same |

## Anything in the brief that was wrong

- "the rows at 196 and 202 change to the page": row 196's key `team:Postdoc T` names nothing, since that hub's file has no primary key and its entry's identity is its first text: `CASE 6 feed no schema, entry held, no key => {"kind":"feed","key":"Unkeyed",...}`. The row changed to the key `'Postdoc T'`, and the hub `named` keeps the `<hub>:<title>` form with a key.
- The brief names no base copy and no base for `sh utils/unused-exports.sh`, both of which the rules file says it names. The step took both before any change.
- Case "An Add to a file with no schema": no client path reaches it now. `Collection.svelte` draws Add under `schema !== undefined`, and `new-entry.ts:118` and `:259` refuse such a file. The branch is written and tested at the state level as the brief asks.
- "Delete of such an entry is live" holds of a card, and it was inert on a Lit Watch card; see the table above.

## Limitations and sharp edges

- `Referrers.svelte:39` and `EntryFields.svelte`'s `venuePage` can still open a tab with an empty key, if a funding referrer or a venue named by a Literature entry has no key. Left unchanged: both are drawn as controls with no words form, which is a shape of its own, and neither is a card of the entry. Handed back with that reason.
- An entry with no key and no title shows its id as its title, `hub:`, as before; `EntryCard.svelte` draws `entry.id`.
- The list's rows of entries with no key share `id`, so `byId` holds the last of them. None of them opens a page, so nothing reads the wrong one.
- `pageOf(collection, 'hub:')` answers a page of the first no-key entry of a no-schema file. Nothing draws it: `editorRows` answers no row and no tab holds that key.
- `pageFault` of a no-schema feed names `fixed[0]`, the hub's key; a key shared by two entries gives the shared-key words with it.
- A scratch edit: the case-run program and its config were written and changed by shell redirects, `sed -i` and one inline `python3`, in the scratchpad only. No file of the step's diff was touched that way. The formatter ran by `npx prettier --write` on the changed files.

## The greps

- History words over added comments and titles, `git diff -U0 | grep -E '^\+' | grep -E "^\+\s*(//|\*|/\*|it\(|it\.each|\[')" | grep -nE "before|used to|no longer|still|..."`: one hit, `* hub's name. Absent before the hubs are merged.`, in the `hubPrimaryKeys` doc. Judged fine: it says when a value of the payload is absent, the wording of `hubFiles` and `hubSchemas` beside it, and compares with no earlier state of the code.
- ASCII, `LC_ALL=C grep -n '[^ -~]' $(git diff --name-only)`: prints nothing.
- Unused exports, `diff unused-base.txt unused-after.txt`: only knip's two `ERROR:` lines and its status line of the base run are gone; the step adds no line.
- Renames: `grep -rn "openPage" src tests docs README.md` finds no reference to the view's function, the hits being `layout`'s page opener and the apps' `openPage`, which are other functions. `grep -rn "hubPrimaryKeys"` hits `page-entry.ts`, `feeds.ts`, `model/index.ts`, `docs/apps.md`.
- Reuse before writing: `grep -rn "identityValue\|keyOf"` found `identityValue`, used; no new helper or type was added. `grep -rn "no_schema" config/text` found the Career view's word, a line of another group; `entry.no_schema` joins its group where it is.
- `sh utils/folder-check.sh`: no new tracked file; the step adds none.

## Comments and documents re-read

| Text | State |
| --- | --- |
| `page-entry.ts` head, `PageEntry.schema`, `feedPage` doc | rewritten |
| `page-entry.ts` `collectionPage`, `createPages`, `pageDraftTarget`, `pageFields` docs | still true |
| `Entry.svelte` head | rewritten |
| `Person.svelte` head, `page` doc | rewritten |
| `editor-target.ts` head | still true |
| `editorTarget` doc | rewritten |
| `editorRows` doc | rewritten |
| `entry-actions.ts` head, `entryActions`, `recordActions`, `feedDated` docs | still true |
| `EntryCard.svelte` head | rewritten |
| `LeadCard.svelte`, `RadarCard.svelte` heads | rewritten |
| `feeds.ts` head | rewritten |
| `registry-card.svelte.ts` `onpage` doc | rewritten |
| `VenueCard.svelte` `readAction` doc | rewritten |
| `focus/rows.ts` `entryPage` doc | rewritten |
| `docs/HELP.md:273` | rewritten |
| `docs/HELP.md:276`, `:278`, `:288`, `:339` | still true |
| `docs/apps.md:420` | rewritten |
| `config/text/views/boards/entry.yml` head | still true |

## The case-run program

`vitest.config.mjs` gave `root: <worktree>`, `plugins: [svelte({ configFile: false })]` with dependency discovery off, `resolve.alias` of `$lib`, `server.fs.strict: false` and `test.include` of this one file.

```ts
// Case-run program of O107: prints the result of each case of the brief, asserts nothing.
import { it } from 'vitest';
import { collectionSchema } from '<worktree>/src/lib/data/snapshot/normalise.ts';
import { mergedFeeds } from '<worktree>/src/lib/data/snapshot/hubs/feeds.ts';
import { createPages, pageFields, pageView } from '<worktree>/src/lib/state/forms/page-entry.ts';
import { createSettled } from '<worktree>/src/lib/state/forms/settled.svelte.ts';
import { stateRecord } from '<worktree>/src/lib/state/shared/page/records.ts';
import { identityValue } from '<worktree>/src/lib/state/boards/collection/index.ts';
import { entryPage } from '<worktree>/src/lib/views/boards/focus/rows.ts';
import { editorRows } from '<worktree>/src/lib/views/shared/forms/entry/entry-actions.ts';
import { editorTarget } from '<worktree>/src/lib/views/boards/editor/editor-target.ts';
import { buildIndex } from '<worktree>/src/lib/state/workbench/palette.ts';

const entry = (root: string, key: string, fields: Record<string, unknown>, index: number) => ({
    id: root + ':' + key, title: key, fields, file: '/' + root + '/x.yml', index, root
});
const file = (id: string, extra: object, keys: string[]) => ({
    id: 'hub:' + id, title: id, file: '/hub/' + id + '.yml', root: 'hub', ...extra,
    entries: keys.map((key, at) => entry('hub', key, { name: key, status: 'open' }, at))
});
const SCHEMA = [{ field: 'name', type: 'text', primary_key: true }];
const unread = collectionSchema('not a list');
let collections: Record<string, unknown> = {
    'hub:plain': file('plain', { primary_key: 'name' }, ['a', 'b']),
    'hub:withschema': file('withschema', { primary_key: 'name', schema: SCHEMA }, ['a']),
    'hub:unread': file('unread', { primary_key: 'name', schema: unread }, ['a']),
    'hub:venues': file('venues', { primary_key: 'name', registry: 'venues' }, ['v']),
    'hub:people': file('people', { primary_key: 'name', registry: 'people' }, ['p'])
};
const one = (feed: object | undefined, title: string) => ({
    ok: true, kind: 'leads', file: 'leads.yml', meta: {}, entries: [{ title }], ...feed
});
const empty = { ok: true, file: '', meta: {}, entries: [], missing: true };
const none = { radar: { ...empty, kind: 'radar' }, leads: { ...empty, kind: 'leads' }, linkedin: { ...empty, kind: 'linkedin' } };
const hubFeeds = (feed: object | undefined, title: string) => ({ ...none, leads: one(feed, title) });
const feeds = mergedFeeds(none as never, [
    { key: 'hub', feeds: hubFeeds({ primary_key: 'title' }, 'Named') as never },
    { key: 'lab', feeds: hubFeeds(undefined, 'Unkeyed') as never }
]);
const settled = createSettled(() => 0);
const pages = createPages(
    { snapshot: () => ({ entities: { collections, career: null } }) as never, feeds: () => feeds },
    settled
);
const shown = (page: ReturnType<typeof pages.pageOf>) =>
    page === null ? 'null' : JSON.stringify({ kind: page.kind, key: page.key, title: page.title, root: page.root, writeId: page.writeId, fixed: page.fixed, values: page.values, schema: page.schema });
const say = (name: string, result: unknown) => console.log('CASE ' + name + ' => ' + String(result));
const client = { pages, layout: { openBeside: () => undefined }, selectors: {}, source: {}, fs: { primary: () => 'hub' } } as never;

it('prints every case', () => {
    say('1 no schema, named key, entry', shown(pages.pageOf('plain', 'hub:a')));
    say('2 no schema, key names no entry', shown(pages.pageOf('plain', 'hub:zz')));
    say('3 a schema', shown(pages.pageOf('withschema', 'hub:a')));
    const state = pageView('plain', 'hub:', 'x').state;
    say('4 no schema no key: tab state', JSON.stringify(state) + ' stateRecord=' + JSON.stringify(stateRecord(state)));
    const unkeyed = { id: 'hub:', title: '', fields: { a: 1 }, file: '/hub/x.yml', index: 0, root: 'hub' };
    say('4 no schema no key: identityValue', JSON.stringify(identityValue(unkeyed)));
    say('4 no schema no key: focus entryPage', entryPage('x', 'hub', 'hub:', () => [{ id: 'hub:x', root: 'hub', entries: [unkeyed] }] as never));
    say('1 pageFields of such a page', JSON.stringify(pageFields(pages.pageOf('plain', 'hub:a') ?? ({ schema: [], values: {} } as never))));
    say('5 schema that does not read: collectionSchema', unread);
    say('5 schema that does not read: page', shown(pages.pageOf('unread', 'hub:a')));
    say('6 feed no schema, entry held, named key', shown(pages.pageOf('leads', 'hub:Named')));
    say('6 feed no schema, entry held, no key', shown(pages.pageOf('leads', 'Unkeyed')));
    say('6 feed no schema, entry not held', shown(pages.pageOf('leads', 'hub:Nothing')));
    const added = settled.begin();
    pages.settle.added('plain', 'hub:new', { name: 'new', status: 'open' }, added);
    say('7 Add to a file with no schema', shown(pages.pageOf('plain', 'hub:new')));
    const seq = settled.begin();
    pages.settle.entry('plain', 'hub:b', { status: 'closed' }, seq);
    say('8 pending write', shown(pages.pageOf('plain', 'hub:b')));
    const before = collections;
    collections = { ...before, 'hub:plain': file('plain', { primary_key: 'name' }, ['b']) };
    say('9 entry removed while its tab is open', shown(pages.pageOf('plain', 'hub:a')));
    collections = before;
    say('10 registry card Edit rows', editorRows(client, 'venues', 'hub:v', 'v', null, undefined).length);
    say('10 people card Edit rows', editorRows(client, 'people', 'hub:p', 'p', null, undefined).length);
    say('11 editor tab over such an entry', editorTarget(client, { kind: 'entry', collection: 'plain', key: 'hub:a' }));
});
it('prints the palette row of an entry with no key', () => {
    const unkeyed = { id: 'hub:', title: 'Loose', fields: {}, file: '/hub/x.yml', index: 0, root: 'hub' };
    const held = { id: 'hub:plain', root: 'hub', title: 'x', file: '/hub/x.yml', entries: [unkeyed] };
    const items = buildIndex({ entities: { projects: {}, collections: { 'hub:plain': held } } } as never, {} as never, [], 'hub');
    console.log('CASE 4 no schema no key: palette row => ' + JSON.stringify(items.map((one) => ({ view: one.view, state: one.state }))));
});
```

The first run on the unchanged tree used the same program without the `identityValue`, `entryPage`, `pageFields` and palette lines, which were added afterwards.
