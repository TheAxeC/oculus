# O79 builder report: handed back at the first run

NOT done: nothing of "What to build" items 1 to 6 is built, no file of the step's write list is changed, and none of "Verify before you report" checks 1 to 8 ran. The step is handed back before any code change because case 15 cannot pass under the brief's own rules: item 1's finding for "an entry's `primary_key:` beside a schema flag", item 3's `primary_key: title` on oculus's own `leads` and `radar` entries of `config/defaults/sources.yml`, and item 4's `primary_key: true` on `title` in the hub's `leads.yml` and `radar.yml` schemas give the hub two findings, because the hub names no `collections:` list and reads oculus's own entries. Case 15 asks for "validates with no findings". The rule, the evidence and the options are in the section "The case the brief's rules get wrong".

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:176-180`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- none.
```

## The case the brief's rules get wrong: case 15

The rules, as the brief states them:

- Item 1: "A file with no schema names its primary key on its `collections:` entry as `primary_key: <field>`" and "An entry's `primary_key:` beside a schema flag, the same field or another, is a finding naming both, and the file's writes are refused." It also says "leads and radar are collections and take their primary key from their file".
- Item 3: "the demo hub's ... `config.yml` `collections:` entries for leads and radar (`:24-25`), whose files have no schema, carry `primary_key: title`; so do oculus's own `leads` and `radar` entries in `config/defaults/sources.yml:50-51`."
- Item 4 (the hub rewrite): "the primary key carries `primary_key: true` (`venues` on `id`; `leads` and `radar` on `title`; ...)".
- Case 15: "the hub with your rewrite applied in a scratch copy: `OCULUS_TEST_HUB=<scratch copy> npx vitest run tests/checks/config/integrity.test.ts` ('validates with no findings', `:201`) passes".

What the hub reads, run on the unchanged tree:

- The hub names no `collections:` list. `grep -n "collections\|^[a-z_]*:" ~/workspace/research-hub/.oculus/config.yml` prints only the comment line 3 and the top-level keys `scan`, `new_project_dir`, `portfolio_deck`, `audit`, `linkedin_dir`, `docs`, `lint`, `slurm`, `wallpaper`, `leads_fit`.
- So its `collections:` list is oculus's own. Case 15's program over the scratch copy of the hub prints `the collections list comes from: sources.yml`, and the entries it reads its feeds by are oculus's: `entry leads | file .oculus/data/academic/leads.yml | primary_key undefined` and `entry radar | file .oculus/data/literature/radar.yml | primary_key undefined` (undefined today; item 3 makes them `title`). In code, `portfolioConfigFrom` (`src/lib/data/index.ts:176`) reads `collectionFiles(merged.collections, ...)`, the merged list being oculus's when the hub sets none, and `feedFile` (`:189-192`) takes the leads and radar entries from it.
- The hub's leads and radar files carry schemas whose first field is `title`: `grep -n "^schema:" -A12` gives `.oculus/data/academic/leads.yml:54-55` `schema:` then `- { field: title, label: "Title", type: text, ... }`, and `.oculus/data/literature/radar.yml:14-15` `schema:` then `- { field: title, type: text, required: true, ... }`.

The result: with items 1, 3 and 4 built as written, the hub's `leads.yml` and `radar.yml` each hold a schema flag `primary_key: true` on `title` while the `collections:` entry the hub reads them by (oculus's own, `sources.yml:50-51`) carries `primary_key: title`. Item 1 makes each a finding naming both and refuses the file's writes, so the integrity case gives at least two findings and case 15 fails; the lead writes of the Position Leads view and the Lit Watch writes of the real hub are refused besides. No build of the three items as written passes case 15, and dropping any one of them is a departure from the brief, so the choice is the orchestrator's.

Options, each a reading of the brief that makes case 15 pass:

- (a) Oculus's own `leads` and `radar` entries of `config/defaults/sources.yml:50-51` carry no `primary_key:`; the demo hub's entries (`tests/fixtures/hubs/demo/.oculus/config.yml:24-25`), whose files have no schema, carry `primary_key: title` as item 3 says; the hub's and the templates' leads and radar schemas carry the flag as item 4 and item 3 say. A hub that names no list and holds a leads or radar file with no schema gets the finding of a file with no primary key. Pro: the primary key lives in the file's schema wherever the file has one, which is ruling 392's order ("for a file with no schema its `collections:` entry names it"); every rule of item 1 stands unchanged. Con: oculus's defaults no longer name a key for a schemaless feed file; a hub with such a file must add a schema or its own entry.
- (b) Oculus's entries keep `primary_key: title` and the hub rewrite leaves the hub's leads and radar schemas unflagged. Pro: a schemaless feed file of any hub keeps working with no entry of its own. Con: the hub's leads and radar are the only entries files whose key is not in their own schema, the templates' leads and radar scaffolds must then be unflagged too, and a hub that later lists its own entries loses the key with no warning beyond the finding.
- (c) The "beside" finding is given only when the entry is the hub's own and names another field than the flag. Pro: no file changes. Con: it narrows item 1's rule ("the same field or another") and adds a case to the reader that depends on where an entry came from (the lazy option, since it keeps the clash and hides it).

Recommended (a), a judgment: it keeps every rule of item 1 and every ruling's wording, and moves one default to the place ruling 392 gives a key for a file that has a schema.

## The cases' first run, on the unchanged tree (base a11f9f14, before any change)

Programs 1, 9, 10, 15 and 18 ran through `npx vitest run --config <scratchpad>/o79/vitest.config.mts --root <scratchpad>/o79 caseNN` from the worktree's root, after `npx svelte-kit sync` (which writes the git-ignored `.svelte-kit/` the worktree's `tsconfig.json` extends). Their sources and full outputs are in "The case-run programs". The other cases were read in the code; each names the lines read.

1. Run (case01). Every collection card heading, every entry page's title, fixed field and write id, the choices of every select, chips and tags field with a source or options of the project form and of each collection's form, the reference index's counts (`total | references 114 | definitions 44`) and an edit, a remove and an Add on the first entry of each of the 15 collections, all `found true` with no refusal. The leads and radar entries of the demo hub have no entry page today (`leads | demo:Postdoc, Robust ML | no page`): `feedPage` (`src/lib/state/forms/page-entry.ts:196`) answers null for a feed file with no schema.
2. Read. `sourceChoices` (`src/lib/state/forms/schema.ts:298`) gives the venues `recordChoices(entities?.venues, ['short', 'name'], root)`: a venue with `short` shows it, one without shows `name`, the value is `keyOf(id)`, the registry's `id`. No schema rank is read: a venues schema ranking `name` first still shows `short`. Case 1's run shows the demo venues by name, since none has a `short` (`venue | select | "venues" | iclr:ICLR::, ...`).
3. Read. A schema with no flag is today's every schema: `identityField` (`record-fields.ts:21-24`, `server/files/fs/collections.ts:51-54`, `validate.ts:390-394`) takes the first field, there is no finding, and writes are allowed (case 1's writes).
4. Read. `primary_key` is no key of `SCHEMA_FIELD` (`src/lib/data/snapshot/schema/record.ts:315-391`, `additionalProperties: false`), which the gate checks every data file's `schema:` block against through `frame()` (`schema/hub.ts:23-30`), so each flag is a `findings.schema.not_declared` finding on its key; `fieldOf` (`schema/field.ts:131-144`) does not read it, and writes still address the first field and are allowed.
5. Read. `foreign_key` is not read by `fieldOf` and is a `not_declared` finding in the schema block; the field offers no choices (`choicesFor`, `schema.ts:285`, returns its options alone for no `from`) and its value is no reference (`specs.ts:53-54`). The events file defines no key (`build.ts:110-114` defines only the eight registries; case 1 prints `academic/events.yml | references 0 | definitions 0`).
6. Read. `foreign_key: nowhere` gives the `not_declared` finding and no choices; today's `from: nowhere` gives `findings.schema.bad_from` (`record.ts:100-106`).
7. Read. `display` is not read anywhere and is a `not_declared` finding; choices are labelled by the fixed field lists of `sourceChoices` (`schema.ts:298-306`).
8. Read. `from: people` is today's form: no finding, the field offers the people (case 1: `joint-work | person | select | ["people"] | b-coauthor:B. Coauthor::, ...`).
9. Run (case09). The planted derived source reads as `retrieval: [{"kind":"derived","from":["synthgraph"],"script":"code/prep.py"}]`, the Data view's line is `Built from synthgraph by code/prep.py`, `findings on data.yml: 0`, and `synthgraph` is a reference with the sources `datasets`.
10. Run (case10) and read. A `primary_key: title` on the demo's leads entry is read with the entry (`"primary_key":"title"`) and gives no finding on the settings file (`findings on the hub's settings file: 0`); the feed writer addresses a lead by `FEED_RULES.leads.identity`, `"title"`, from `FEED_IDENTITY` (`src/lib/data/snapshot/hubs/feeds.ts:24-28`), never from the entry; `writeFeedField(leads, "Postdoc, Robust ML", status, declined)` gives `changed ["status"]`. Read for the test half: a collection with `primary_key: true` on `key` and `display: 1` on `name` today addresses its entries by the first field (`key` when it is first), and its card is headed by `entryTitleOf` (`model-collections.ts:73-75`: `title`, else `name`), so a person's card shows the name.
11. Read. A venue edit is addressed by the first field (`identityOf`, `collections.ts:148-155`) with the `id` guarded by `KEYED_FIELDS` (`writes/entries.ts:328`, `collection-text.ts:30`), which names the collection key `venues`: a collection keyed `journals` with the venues registry gets no `id` guard, and its entries are addressed by its first field.
12. Read. `askFields` (`new-entry.ts:31-38`) asks a venue `[identity, id]`, `['name', 'id']` for the hub's venues (first field `name`), and a person `[key]` alone; the required fields are not asked.
13. Read. `manifestField` is a `z.strictObject` (`src/lib/data/shapes/catalog-files/manifest.ts:26-44`), so a `manifest_fields` row with `foreign_key: people` is refused by `manifestFieldRow` and is the finding `findings.config.manifest_field_shape` with the row left out (`hub-layer.ts:463-471`); a row with `from: people` is taken and offers the people.
14. Read. A rename of a person key edits every value of a field whose `from` names `people` (`references/rename.ts`; G67's row 'a domain key, the domains registry entry and the domain of each manifest' covers the same path for domains). A field written `foreign_key: people` is no reference today and would not be edited.
15. Run (case15 and the integrity case). Over the scratch copy of the hub, not rewritten: `OCULUS_TEST_HUB=<scratchpad>/o79-hub npx vitest run tests/checks/config/integrity.test.ts --reporter=verbose` gives `Tests  14 passed (14)`, among them `the real hub > validates with no findings 4781ms`. The program prints `schema lines holding from: 29`, `primary keys: none` for every file, `foreign keys naming nothing: 0` (there is none), and the leads and radar entries read from oculus's `sources.yml`, as quoted above. The rewrite was not applied, since its leads and radar lines are what the contradiction is about.
16. Read. A manifest `venue:` naming a venue's `name` is the finding `findings.schema.no_key` with `x-from` `venues`, since the venues list holds the registry keys (`schema/lists.ts:63-74`, `registries.ts:97`); schema-rules' row 'a reference to a key that does not exist' is the same rule.
17. Read. A bookmark is addressed by `BOOKMARK_IDENTITY = 'label'` (`src/lib/server/files/fs/bookmarks.ts:33`) and by its schema's first field `label` (`collections.ts:51-54`); add, rename and remove are allowed.
18. Run (case18). The new hub's build gives five findings, all `scan | scan directory does not exist` for the five scan folders the hub does not have; every collection's Add is allowed but two: `venues | add {"name":"case-eighteen"} | ... | refused [{"field":"id","reason":"a new entry needs a non-empty id"}]` (the program gives the identity field and the required fields, and the venues template's `id` is not required), and `data | add | no file read`: `readCollection` answers null for the data template, whose list key `datasets:` holds no entry, since `collectionText` (`collections.ts:130-133`) takes an empty list key as one only when it is `entries:`.
19. Read. An entry's `primary_key:` is read with the entry and gives no finding (case 10's run); a flag on a tags field and `primary_key: "yes"` are `not_declared` findings of the schema block; writes are allowed.
20. Read. `foreign_key: []` is a `not_declared` finding and offers nothing; a target with no primary key does not exist as a notion today.
21. Read. A collection keyed `projects` is no finding (`readList`, `hub-names.ts:378-431`, gives `view_id` only for the six view ids of `REGISTRY_VIEWS`).
22. Read. `recordChoices` (`schema.ts:223-244`) offers the entities of the snapshot's `people` table, joined across hubs by the registry, whatever each hub keys its people collection; each is stored by its own hub's key.
23. Read. A venue with `id: ""` gives one finding, `findings.registries.entry_no_id` (`registries.ts:97-104`); `checkEntryIdentity` (`validate.ts:439-452`) checks the hub's venues by `name`, their first field, and no other rule sees the empty id. A venue with no `id` key also gives `findings.schema.required` where its schema marks `id` required, two findings.

## DONE / NOT DONE

| Deliverable | State | Proof |
| --- | --- | --- |
| The cases' first run, all 23 | DONE | the section above; programs 1, 9, 10, 15, 18 printed as quoted below |
| Item 1, `primary_key: true` | NOT DONE | handed back at case 15; `git status --short` in the worktree prints nothing |
| Item 2, `foreign_key:` and `display:` | NOT DONE | as above |
| Item 3, oculus's and the demo hub's schemas | NOT DONE | as above |
| Item 4, the hub rewrite section | NOT DONE | it depends on the ruling (option (b) changes its leads and radar lines) |
| Item 5, docs and comments | NOT DONE | as above |
| Item 6, tests | NOT DONE | as above |
| Verify checks 1 to 8 | NOT DONE | not run; the verify list ran 0 times |

## Files with line counts

None changed. `git status --short` in the worktree prints nothing, and `diff -rq ../O79-base/src src`, `.../tests tests`, `.../config config -x local.yml` and `.../utils utils` print nothing. This report is the one file written under `.scratch/`.

## Judgment calls the brief left open

None taken in code. For the first runs: case 15 ran over the hub copy without the rewrite; case 1's card heading is computed as `EntryCard.svelte:270` computes it (`entry.title === '' ? entry.id : entry.title`), since no exported function gives it; case 9 plants the hub's `retrieval` records field into the demo copy's `data.yml` schema, which the demo's has not.

## Host- or user-visible changes

None: nothing was changed.

## Anything in the brief that was wrong or impossible

- Case 15 against items 1, 3 and 4, above.
- Item 3: "Every `schema:` block of `docs/templates.md` (19) ... carries `primary_key: true` on its key field". The 19 blocks (`awk '/^## |^### /{h=$0} /^schema:/{print NR": "h}' docs/templates.md`) are the bookmarks file, 17 entries files and the career file (`:1467`, `### .oculus/data/academic/career.yml`), which item 1 gives no primary key; 18 blocks take the flag.
- Premise 2's line range: `REGISTRY_SHAPES` is at `src/lib/data/helpers/hub-names.ts:801-814` at the base, not `795-814`.
- Readers of the identity the brief's write list leaves out, which item 1 needs changed: `src/lib/views/shared/forms/entry/card/EntryCard.svelte:53,137` and `src/lib/views/boards/collection/Collection.svelte:71,290,453` (`identityValue`), `src/lib/data/snapshot/hubs/merge.ts` (`collectionOf` walks `throughSchema`, whose `RECORD_SOURCES` are registry words), `src/lib/data/snapshot/schema/record.ts` (`SCHEMA_FIELD`'s `from`), `run.ts`, `static.ts` (`namesList`), `src/lib/data/shapes/catalog-files/manifest.ts:26-44` (the strict `manifestField`, which refuses `primary_key`, `display` and `foreign_key` in `config/schemas/manifest-schema.yml` and in a `manifest_fields` row). `page-file.ts:22` holds a second `page.collection === 'leads'` beside `:43`.
- Found by case 18's run, outside the step's rules: a new hub's data file from the template cannot take an Add (`data | add | no file read`), since `collectionText` takes an empty list key as a list only under `entries:`. The look of it on a page is not verified.

## Limitations

- The rewrite of the hub was not written; item 4's section waits on the ruling.
- The svelte-kit sync wrote the worktree's `.svelte-kit/` folder, which git ignores (`.gitignore:2`).
- The case-run programs import the worktree's modules by absolute path and need its `.svelte-kit/`; after the change, cases 1, 9 and 10 need their schema and entry wording read again (case 9's `O79_SOURCE_KEY` takes `foreign_key: data`).

## The case-run programs

All lie in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79/`, beside the config they run under. Each writes its lines to `caseNN.out.txt` there and nothing else outside its own scratch folder, which it removes; the scratch copy of the hub for case 15 (`scratchpad/o79-hub`, made with `cp -cR` of every top-level entry but `.git` and `.oculus`, and of every entry of `.oculus` but `local.yml`; `find <copy> -name local.yml | wc -l` printed 0) was removed before this report.

### vitest.config.mts

```ts
import { svelte } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/@sveltejs/vite-plugin-svelte/src/index.js';
import { defineConfig } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/vitest/dist/config.js';
export default defineConfig({
    plugins: [svelte({ configFile: false })],
    server: { fs: { allow: ['/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79', '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79'] } },
    test: { include: ['/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79/**/*.case.ts'], environment: 'node', testTimeout: 120000 }
});
```

### case01.case.ts

```ts
// Case 1 of O79: oculus's own config over the demo fixture hub. Prints, for a scratch copy of the
// demo hub built as the watcher builds it: every collection card's heading, every entry page's
// title, fixed fields and write id, the choices of every select, chips and tags field with a source
// of the project form and of each collection's form, the reference index's counts, and an edit, a
// remove and an Add on the first entry of each collection, each on a fresh copy. Writes only under
// the scratchpad folder, removed at the end.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/vitest/dist/index.js';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79';
const S = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79';
const OUT = join(S, 'case01.out.txt');

it('case 1', async () => {
    const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);
    const { portfolioConfigFrom } = await import(`${W}/src/lib/data/index.ts`);
    const { published, indexedOnce } = await import(`${W}/tests/data/hubs/hubs-fixture.ts`);
    const { createPages } = await import(`${W}/src/lib/state/forms/page-entry.ts`);
    const { createSettled } = await import(`${W}/src/lib/state/forms/settled.svelte.ts`);
    const { feedIdents } = await import(`${W}/src/lib/state/shared/page/idents.ts`);
    const { formFields, choicesFor } = await import(`${W}/src/lib/state/forms/schema.ts`);
    const { formFieldsOf } = await import(`${W}/src/lib/state/forms/record-fields.ts`);
    const { bareId } = await import(`${W}/src/lib/data/helpers/hub-names.ts`);
    const { writeEntry, removeEntry, createEntry } = await import(
        `${W}/src/lib/server/edit/writes.ts`
    );
    const { readCollection } = await import(`${W}/src/lib/server/files/fs/collections.ts`);

    const lines: string[] = [];
    const say = (line: string): void => void lines.push(line);
    const runs = mkdtempSync(join(S, 'runs-'));
    const DEMO = join(W, 'tests', 'fixtures', 'hubs', 'demo');
    let n = 0;
    const copy = (): string => {
        n += 1;
        const dir = join(runs, `demo${n}`);
        cpSync(DEMO, dir, { recursive: true });
        return dir;
    };
    try {
        const hub = copy();
        const folders = [{ name: 'demo', dir: hub }];
        const { snapshot, feeds } = published(folders, 'demo');
        const merged = loadConfig(engineDir(), { hub }).config;
        const config = portfolioConfigFrom(merged);
        const { setCatalog } = await import(`${W}/src/lib/state/shared/words/text.ts`);
        const { textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);
        setCatalog(textCatalog(merged));

        say('== card headings (EntryCard.svelte: entry.title, else entry.id)');
        const collections = Object.values(snapshot.entities.collections).sort((a, b) =>
            a.id < b.id ? -1 : 1
        );
        for (const one of collections) {
            for (const entry of one.entries) {
                say(`${one.id} | ${entry.id} | ${entry.title === '' ? entry.id : entry.title}`);
            }
        }

        say('== entry pages (title | fixed | writeId)');
        const pages = createPages(
            { snapshot: () => snapshot, feeds: () => feeds },
            createSettled(() => 0)
        );
        for (const one of collections) {
            for (const entry of one.entries) {
                const page = pages.pageOf(bareId(one), entry.id);
                say(
                    page === null
                        ? `${one.id} | ${entry.id} | no page`
                        : `${one.id} | ${entry.id} | ${page.title} | ${page.fixed.join(',')} | ${page.writeId}`
                );
            }
        }
        for (const kind of ['leads', 'radar'] as const) {
            const held = feeds?.[kind];
            if (held === undefined || held === null) {
                say(`${kind} | no feed`);
                continue;
            }
            const identOf = feedIdents(kind, held.entries);
            for (const entry of held.entries) {
                const ident = identOf(entry);
                const page = pages.pageOf(kind, ident);
                say(
                    page === null
                        ? `${kind} | ${ident} | no page`
                        : `${kind} | ${ident} | ${page.title} | ${page.fixed.join(',')} | ${page.writeId}`
                );
            }
        }

        const choices = (field: { from?: unknown; options?: unknown }): string =>
            choicesFor(field, snapshot, merged, 'demo')
                .map((one: { id: string; label: string; glyph?: string; hub?: string }) =>
                    [one.id, one.label, one.glyph ?? '', one.hub ?? ''].join(':')
                )
                .join(', ');
        say('== project form choices (field | type | from | choices id:label:glyph:hub)');
        for (const field of formFields(merged)) {
            if (!['select', 'chips', 'tags'].includes(field.type)) continue;
            if (field.from === undefined && field.options === undefined) continue;
            say(`${field.field} | ${field.type} | ${JSON.stringify(field.from)} | ${choices(field)}`);
        }
        say('== collection form choices (collection | field | type | from | choices)');
        for (const one of collections) {
            const fields = formFieldsOf(one.schema, one.entries.at(0)?.fields ?? {});
            for (const field of fields) {
                if (!['select', 'tags'].includes(field.type)) continue;
                if (field.from === undefined && field.options === undefined) continue;
                say(
                    `${one.id} | ${field.field} | ${field.type} | ${JSON.stringify(field.from)} | ${choices(field)}`
                );
            }
        }

        say('== reference index');
        const { references } = indexedOnce(folders, 'demo');
        let refs = 0;
        let defs = 0;
        for (const file of references.files) {
            refs += file.references.length;
            defs += file.definitions.length;
            say(
                `${file.file.root}/${file.file.path} | references ${file.references.length} | definitions ${file.definitions.length}`
            );
        }
        say(`total | references ${refs} | definitions ${defs}`);

        say('== writes on the first entry of each collection, each on a fresh copy');
        for (const entry of config.collections) {
            const key = entry.key;
            const read = (dir: string) => readCollection(dir, config, key);
            const first = read(hub);
            if (first === null) {
                say(`${key} | no file`);
                continue;
            }
            const schema = Array.isArray(first.schema) ? first.schema : [];
            const item = first.items.at(0);
            if (item === undefined) {
                say(`${key} | no entry`);
                continue;
            }
            const { entryId } = await import(`${W}/src/lib/server/files/fs/collections.ts`);
            const id = entryId(item, first.ident);
            const textField = schema.find(
                (one: { field: string; type: string }, at: number) =>
                    at > 0 && (one.type === 'text' || one.type === 'textarea') && one.field !== 'id'
            );
            const editDir = copy();
            const edit = writeEntry(editDir, config, key, id, {
                [textField?.field ?? 'note']: 'case one edit'
            });
            const after = readFileSync(join(editDir, entry.file), 'utf8');
            const before = readFileSync(join(hub, entry.file), 'utf8');
            const changedLines = after
                .split('\n')
                .filter((line, at) => line !== before.split('\n')[at]).length;
            say(
                `${key} | edit ${id} ${textField?.field ?? 'note'} | found ${edit.found} | id ${edit.id} | changed ${JSON.stringify(edit.changed)} | refused ${JSON.stringify(edit.refused)} | lines differing ${changedLines}`
            );
            const removeDir = copy();
            const removed = removeEntry(removeDir, config, key, id);
            say(
                `${key} | remove ${id} | found ${removed.found} | changed ${JSON.stringify(removed.changed)} | refused ${JSON.stringify(removed.refused)} | entries ${first.items.length} -> ${read(removeDir)?.items.length}`
            );
            const addDir = copy();
            const fields: Record<string, unknown> = { [first.ident]: 'case-one-new' };
            for (const one of schema as {
                field: string;
                type: string;
                required?: unknown;
                options?: unknown[];
            }[]) {
                if (one.required !== true || one.field in fields) continue;
                const option = one.options?.at(0);
                fields[one.field] =
                    option === undefined
                        ? one.type === 'tags'
                            ? []
                            : 'case-one-new'
                        : typeof option === 'string'
                          ? option
                          : (option as { key: string }).key;
            }
            const added = createEntry(addDir, config, key, fields);
            say(
                `${key} | add ${JSON.stringify(fields)} | found ${added.found} | changed ${JSON.stringify(added.changed)} | refused ${JSON.stringify(added.refused)} | entries ${first.items.length} -> ${read(addDir)?.items.length}`
            );
        }
    } finally {
        rmSync(runs, { recursive: true, force: true });
        writeFileSync(OUT, `${lines.join('\n')}\n`);
    }
});
```

Printed (`case01.out.txt`, run `Tests  1 passed (1)`):

```
== card headings (EntryCard.svelte: entry.title, else entry.id)
demo:applications | demo:assistant-professor-ml | Assistant Professor, ML
demo:applications | demo:postdoc-graph-learning | Postdoc, graph learning
demo:data | demo:synthgraph | Synthetic evolving-graph benchmark
demo:data | demo:stream-bench | Streaming anomaly benchmark
demo:data | demo:toy-embed | Toy embedding corpus
demo:data | demo:probe-logs | Node probe logs
demo:data | demo:node-traces | Node arrival traces
demo:domains | demo:method | Methods (domain-agnostic)
demo:domains | demo:graphs | Graph learning
demo:domains | demo:nlp | Language / representation
demo:education | demo:machine-learning-msc | Machine Learning (MSc)
demo:education | demo:supervised-msc-thesis-on-graph-transfer | Supervised: MSc thesis on graph transfer
demo:events | demo:streaming-anomaly-detection-at-scale | Streaming anomaly detection at scale
demo:events | demo:poster-robust-embeddings-under-shift | Poster: robust embeddings under shift
demo:events | demo:neurips-attending | NeurIPS (attending)
demo:funding | demo:ecf | Early-Career Fellowship
demo:funding | demo:open-data-infrastructure-grant | Open-Data Infrastructure Grant
demo:joint-work | demo:rivera-lab | Streaming systems, the anomaly-detection benchmark
demo:joint-work | demo:chen-graph | Graph learning, the transfer and bandits line
demo:literature | demo:example2024bandit | Bandit exploration over changing graphs
demo:literature | demo:coauthor2021sketching | Sketching tensors in a stream
demo:organisations | demo:northwood-university | Northwood University
demo:organisations | demo:meridian-institute | Meridian Institute
demo:people | demo:rivera-lab | Ana Rivera
demo:people | demo:chen-graph | Wei Chen
demo:people | demo:dana-example | Dr. Dana Example
demo:people | demo:b-coauthor | B. Coauthor
demo:people | demo:c-senior | C. Senior
demo:people | demo:b-colleague | B. Colleague
demo:pillars | demo:tensors | Structured tensor methods
demo:pillars | demo:graphs | Graph learning over evolving relational structure and streaming interaction data
demo:pillars | demo:repr | Representation learning
demo:resources | demo:utwente | Demo cluster
demo:resources | demo:laptop | Laptop
demo:statements | demo:short-bio-100-words | Short bio (100 words)
demo:statements | demo:data-availability-statement | Data availability statement
demo:statements | demo:funding-acknowledgment-example-grant | Funding acknowledgment (Example Grant)
demo:tasks | demo:review-2-papers-for-mlshift-workshop | Review 2 papers for MLShift Workshop
demo:tasks | demo:renew-compute-allocation | Renew compute allocation
demo:tasks | demo:update-the-lab-wiki-onboarding-page | Update the lab wiki onboarding page
demo:venues | demo:jmlr | Journal of Machine Learning Research
demo:venues | demo:tmlr | Transactions on Machine Learning Research
demo:venues | demo:neurips | NeurIPS
demo:venues | demo:iclr | ICLR
demo:venues | demo:kdd | ACM SIGKDD
== entry pages (title | fixed | writeId)
demo:applications | demo:assistant-professor-ml | Assistant Professor, ML | key | demo:assistant-professor-ml
demo:applications | demo:postdoc-graph-learning | Postdoc, graph learning | key | demo:postdoc-graph-learning
demo:data | demo:synthgraph | Synthetic evolving-graph benchmark | key | demo:synthgraph
demo:data | demo:stream-bench | Streaming anomaly benchmark | key | demo:stream-bench
demo:data | demo:toy-embed | Toy embedding corpus | key | demo:toy-embed
demo:data | demo:probe-logs | Node probe logs | key | demo:probe-logs
demo:data | demo:node-traces | Node arrival traces | key | demo:node-traces
demo:domains | demo:method | Methods (domain-agnostic) | key | demo:method
demo:domains | demo:graphs | Graph learning | key | demo:graphs
demo:domains | demo:nlp | Language / representation | key | demo:nlp
demo:education | demo:machine-learning-msc | Machine Learning (MSc) | key | demo:machine-learning-msc
demo:education | demo:supervised-msc-thesis-on-graph-transfer | Supervised: MSc thesis on graph transfer | key | demo:supervised-msc-thesis-on-graph-transfer
demo:events | demo:streaming-anomaly-detection-at-scale | Streaming anomaly detection at scale | key | demo:streaming-anomaly-detection-at-scale
demo:events | demo:poster-robust-embeddings-under-shift | Poster: robust embeddings under shift | key | demo:poster-robust-embeddings-under-shift
demo:events | demo:neurips-attending | NeurIPS (attending) | key | demo:neurips-attending
demo:funding | demo:ecf | Early-Career Fellowship | key | demo:ecf
demo:funding | demo:open-data-infrastructure-grant | Open-Data Infrastructure Grant | key | demo:open-data-infrastructure-grant
demo:joint-work | demo:rivera-lab | Streaming systems, the anomaly-detection benchmark | key | demo:rivera-lab
demo:joint-work | demo:chen-graph | Graph learning, the transfer and bandits line | key | demo:chen-graph
demo:literature | demo:example2024bandit | Bandit exploration over changing graphs | key | demo:example2024bandit
demo:literature | demo:coauthor2021sketching | Sketching tensors in a stream | key | demo:coauthor2021sketching
demo:organisations | demo:northwood-university | Northwood University | key | demo:northwood-university
demo:organisations | demo:meridian-institute | Meridian Institute | key | demo:meridian-institute
demo:people | demo:rivera-lab | Ana Rivera | key | demo:rivera-lab
demo:people | demo:chen-graph | Wei Chen | key | demo:chen-graph
demo:people | demo:dana-example | Dr. Dana Example | key | demo:dana-example
demo:people | demo:b-coauthor | B. Coauthor | key | demo:b-coauthor
demo:people | demo:c-senior | C. Senior | key | demo:c-senior
demo:people | demo:b-colleague | B. Colleague | key | demo:b-colleague
demo:pillars | demo:tensors | Structured tensor methods | key | demo:tensors
demo:pillars | demo:graphs | Graph learning over evolving relational structure and streaming interaction data | key | demo:graphs
demo:pillars | demo:repr | Representation learning | key | demo:repr
demo:resources | demo:utwente | Demo cluster | key | demo:utwente
demo:resources | demo:laptop | Laptop | key | demo:laptop
demo:statements | demo:short-bio-100-words | Short bio (100 words) | key | demo:short-bio-100-words
demo:statements | demo:data-availability-statement | Data availability statement | key | demo:data-availability-statement
demo:statements | demo:funding-acknowledgment-example-grant | Funding acknowledgment (Example Grant) | key | demo:funding-acknowledgment-example-grant
demo:tasks | demo:review-2-papers-for-mlshift-workshop | Review 2 papers for MLShift Workshop | key | demo:review-2-papers-for-mlshift-workshop
demo:tasks | demo:renew-compute-allocation | Renew compute allocation | key | demo:renew-compute-allocation
demo:tasks | demo:update-the-lab-wiki-onboarding-page | Update the lab wiki onboarding page | key | demo:update-the-lab-wiki-onboarding-page
demo:venues | demo:jmlr | Journal of Machine Learning Research | id | demo:jmlr
demo:venues | demo:tmlr | Transactions on Machine Learning Research | id | demo:tmlr
demo:venues | demo:neurips | NeurIPS | id | demo:neurips
demo:venues | demo:iclr | ICLR | id | demo:iclr
demo:venues | demo:kdd | ACM SIGKDD | id | demo:kdd
leads | demo:Assistant Professor, Machine Learning | no page
leads | demo:Lecturer in Data Science | no page
leads | demo:Postdoc, Robust ML | no page
leads | demo:Attention <script>alert(1)</script> <img src=x onerror=alert(2)> is all you need | no page
radar | demo:Fast streaming anomaly detection with adaptive thresholds | no page
radar | demo:Certified robustness for sentence embeddings under covariate shift | no page
radar | demo:Optimal transport for graph domain adaptation | no page
== project form choices (field | type | from | choices id:label:glyph:hub)
tier | select | "vocab.tiers" | research:Research::, personal:Personal::, software:Software::
stage | select | "vocab.stages" | nascent:nascent (concept)::, scoping:scoping (lit-check and framing)::, de-risking:de-risking (feasibility experiment)::, exploring:exploring::, in-prep:in preparation::, building:building::, submit-ready:submit-ready::, submitted:submitted / under review::, revision:major revision (back with the authors)::, published:published::, released:released::, failed:failed (no-go or disproved)::, stopped:stopped (dropped or abandoned)::
form | select | "vocab.forms" | journal:journal article::, conference:conference paper::, thesis:thesis::, abstract:extended abstract::, poster:poster::, tech-report:tech report (not peer-reviewed)::
status.chips | chips | "vocab.chips" | blocked:blocked (external)::, parked:parked (not being worked)::, results-in:results in, not written up::, admin-prep:admin/prep::, numbers-to-run:numbers still to run::, ai-tells:AI-writing tells::
venue | select | "venues" | iclr:ICLR::, jmlr:Journal of Machine Learning Research::, kdd:ACM SIGKDD::, neurips:NeurIPS::, tmlr:Transactions on Machine Learning Research::
domain | select | "domains" | graphs:Graph learning::, method:Methods (domain-agnostic)::, nlp:Language / representation::
pillars | chips | "pillars" | graphs:Graph learning over evolving relational structure and streaming interaction data::, repr:Representation learning::, tensors:Structured tensor methods::
funding | chips | "funding" | ecf:Early-Career Fellowship::, open-data-infrastructure-grant:Open-Data Infrastructure Grant::
lead | chips | "people" | b-coauthor:B. Coauthor::, b-colleague:B. Colleague::, c-senior:C. Senior::, chen-graph:Wei Chen::, dana-example:Dr. Dana Example::, rivera-lab:Ana Rivera::
collaborators | chips | "people" | b-coauthor:B. Coauthor::, b-colleague:B. Colleague::, c-senior:C. Senior::, chen-graph:Wei Chen::, dana-example:Dr. Dana Example::, rivera-lab:Ana Rivera::
supervisors | chips | "people" | b-coauthor:B. Coauthor::, b-colleague:B. Colleague::, c-senior:C. Senior::, chen-graph:Wei Chen::, dana-example:Dr. Dana Example::, rivera-lab:Ana Rivera::
related | chips | "projects" | bench-suite:bench-suite::, demo-toolkit:Demo-Toolkit::, early-benchmark:Early-Bench::, failed-quantization:Quant-NoGo::, graph-bandits:Graph-Bandits::, graph-transfer:Graph-Transfer::, online-clustering:Online-Cluster::, robust-embeddings:Robust-Emb::, sparse-attention:Sparse-Attn::, spectral-clustering-collab:Spectral Collab::, streaming-anomaly:Stream-Anomaly::, tensor-sketch:Sketched tensor decompositions for streaming data, online and out of core::, tensorkit-tensor-decomposition-toolkit:tensorkit - tensor decomposition toolkit::
datasets | chips | "datasets" | node-traces:Node arrival traces::, probe-logs:Node probe logs::, stream-bench:Streaming anomaly benchmark::, synthgraph:Synthetic evolving-graph benchmark::, toy-embed:Toy embedding corpus::
code_availability.status | select | undefined | none:none::, review-anon:review-anon::, deposited:deposited::
code_availability.visibility | select | undefined | public:public::, private:private::
repository.visibility | select | undefined | public:public::, private:private::
compute | chips | "resources" | laptop:Laptop:host:, utwente:Demo cluster:hpc:
== collection form choices (collection | field | type | from | choices)
demo:applications | status | select | undefined | in-prep:in-prep::, applied:applied::, rejected:rejected::, declined:declined::, withdrawn:withdrawn::
demo:data | access | select | undefined | open:open::, registration:registration::, credentialed:credentialed::, private:private::
demo:data | themes | tags | undefined | graphs:Graphs::, timeseries:Time series::
demo:education | status | select | undefined | ongoing:ongoing::, done:done::
demo:events | role | select | undefined | present:present::, attend:attend::
demo:events | status | select | undefined | upcoming:upcoming::, planned:planned::, completed:completed::, cancelled:cancelled::, not-attending:not-attending::
demo:funding | status | select | undefined | in-prep:in-prep::, planned:planned::, submitted:submitted::, awarded:awarded::, rejected:rejected::
demo:joint-work | person | select | ["people"] | b-coauthor:B. Coauthor::, b-colleague:B. Colleague::, c-senior:C. Senior::, chen-graph:Wei Chen::, dana-example:Dr. Dana Example::, rivera-lab:Ana Rivera::
demo:joint-work | status | select | undefined | exploring:exploring::, active:active::, completed:completed::
demo:literature | projects | tags | ["projects"] | bench-suite:bench-suite::, demo-toolkit:Demo-Toolkit::, early-benchmark:Early-Bench::, failed-quantization:Quant-NoGo::, graph-bandits:Graph-Bandits::, graph-transfer:Graph-Transfer::, online-clustering:Online-Cluster::, robust-embeddings:Robust-Emb::, sparse-attention:Sparse-Attn::, spectral-clustering-collab:Spectral Collab::, streaming-anomaly:Stream-Anomaly::, tensor-sketch:Sketched tensor decompositions for streaming data, online and out of core::, tensorkit-tensor-decomposition-toolkit:tensorkit - tensor decomposition toolkit::
demo:literature | source | select | undefined | search:search::, lit-watch:lit-watch::, hand:hand::
demo:organisations | kind | select | undefined | university:university::, hospital:hospital::, funder:funder::, company:company::, other:other::
demo:resources | kind | select | undefined | cluster:cluster::, machine:machine::, storage:storage::
demo:statements | status | select | undefined | draft:draft::, ready:ready::
demo:tasks | status | select | undefined | todo:todo::, doing:doing::, done:done::, dropped:dropped::
demo:venues | tier | select | undefined | flagship:flagship::, strong:strong::, specialist:specialist::
demo:venues | category | select | undefined | journal:journal::, conference:conference::
demo:venues | themes | tags | undefined | core-ml:Core ML::, graphs:Graphs::, systems:Systems::
== reference index
demo/.oculus/data/research/venues.yml | references 3 | definitions 8
demo/.oculus/data/research/data.yml | references 2 | definitions 7
demo/.oculus/data/pillars/pillars.yml | references 0 | definitions 3
demo/.oculus/data/pillars/domains.yml | references 0 | definitions 3
demo/.oculus/data/academic/funding.yml | references 0 | definitions 2
demo/.oculus/data/people/people.yml | references 0 | definitions 6
demo/.oculus/data/people/organisations.yml | references 0 | definitions 2
demo/.oculus/data/research/resources.yml | references 0 | definitions 2
demo/.oculus/data/research/statements.yml | references 0 | definitions 0
demo/.oculus/data/academic/events.yml | references 0 | definitions 0
demo/.oculus/data/academic/education.yml | references 0 | definitions 0
demo/.oculus/data/academic/applications.yml | references 0 | definitions 0
demo/.oculus/data/academic/joint-work.yml | references 2 | definitions 0
demo/.oculus/data/academic/tasks.yml | references 0 | definitions 0
demo/.oculus/data/literature/literature.yml | references 2 | definitions 0
demo/.oculus/data/academic/leads.yml | references 0 | definitions 0
demo/.oculus/data/literature/radar.yml | references 0 | definitions 0
demo/.oculus/data/academic/career.yml | references 0 | definitions 0
demo/projects/active/graph-bandits/project.yml | references 13 | definitions 1
demo/projects/active/graph-transfer/project.yml | references 11 | definitions 1
demo/projects/active/streaming-anomaly/project.yml | references 10 | definitions 1
demo/projects/archive/failed/failed-quantization/project.yml | references 5 | definitions 1
demo/projects/archive/published/early-benchmark/project.yml | references 8 | definitions 1
demo/projects/coauthor/spectral-clustering-collab/project.yml | references 10 | definitions 1
demo/projects/ideas/online-clustering/project.yml | references 6 | definitions 1
demo/projects/ideas/tensor-sketch/project.yml | references 6 | definitions 1
demo/projects/manuscripts/robust-embeddings/project.yml | references 10 | definitions 1
demo/projects/manuscripts/sparse-attention/project.yml | references 10 | definitions 1
demo/projects/software/bench-suite/project.yml | references 4 | definitions 0
demo/projects/software/demo-toolkit/project.yml | references 8 | definitions 1
demo/projects/software/tensorkit-tensor-decomposition-toolkit/project.yml | references 4 | definitions 0
demo/projects/active/graph-bandits/present/present.yml | references 0 | definitions 0
demo/deck/present.yml | references 0 | definitions 0
total | references 114 | definitions 44
== writes on the first entry of each collection, each on a fresh copy
data | edit synthgraph name | found true | id synthgraph | changed ["name"] | refused [] | lines differing 1
data | remove synthgraph | found true | changed ["datasets"] | refused [] | entries 5 -> 4
data | add {"key":"case-one-new","name":"case-one-new"} | found true | changed ["datasets"] | refused [] | entries 5 -> 6
venues | edit jmlr name | found true | id jmlr | changed ["name"] | refused [] | lines differing 1
venues | remove jmlr | found true | changed ["entries"] | refused [] | entries 5 -> 4
venues | add {"id":"case-one-new","name":"case-one-new"} | found true | changed ["entries"] | refused [] | entries 5 -> 6
pillars | edit tensors title | found true | id tensors | changed ["title"] | refused [] | lines differing 1
pillars | remove tensors | found true | changed ["entries"] | refused [] | entries 3 -> 2
pillars | add {"key":"case-one-new","title":"case-one-new"} | found true | changed ["entries"] | refused [] | entries 3 -> 4
domains | edit method title | found true | id method | changed ["title"] | refused [] | lines differing 1
domains | remove method | found true | changed ["entries"] | refused [] | entries 3 -> 2
domains | add {"key":"case-one-new","title":"case-one-new"} | found true | changed ["entries"] | refused [] | entries 3 -> 4
statements | edit short-bio-100-words title | found true | id short-bio-100-words | changed ["title"] | refused [] | lines differing 1
statements | remove short-bio-100-words | found true | changed ["entries"] | refused [] | entries 3 -> 2
statements | add {"key":"case-one-new","title":"case-one-new","status":"draft"} | found true | changed ["entries"] | refused [] | entries 3 -> 4
people | edit rivera-lab name | found true | id rivera-lab | changed ["name"] | refused [] | lines differing 1
people | remove rivera-lab | found true | changed ["entries"] | refused [] | entries 6 -> 5
people | add {"key":"case-one-new","name":"case-one-new"} | found true | changed ["entries"] | refused [] | entries 6 -> 7
organisations | edit northwood-university name | found true | id northwood-university | changed ["name"] | refused [] | lines differing 1
organisations | remove northwood-university | found true | changed ["entries"] | refused [] | entries 2 -> 1
organisations | add {"key":"case-one-new","name":"case-one-new","kind":"university"} | found true | changed ["entries"] | refused [] | entries 2 -> 3
resources | edit utwente name | found true | id utwente | changed ["name"] | refused [] | lines differing 1
resources | remove utwente | found true | changed ["entries"] | refused [] | entries 2 -> 1
resources | add {"key":"case-one-new","name":"case-one-new","kind":"cluster"} | found true | changed ["entries"] | refused [] | entries 2 -> 3
funding | edit ecf title | found true | id ecf | changed ["title"] | refused [] | lines differing 1
funding | remove ecf | found true | changed ["entries"] | refused [] | entries 2 -> 1
funding | add {"key":"case-one-new","title":"case-one-new","status":"in-prep"} | found true | changed ["entries"] | refused [] | entries 2 -> 3
events | edit streaming-anomaly-detection-at-scale title | found true | id streaming-anomaly-detection-at-scale | changed ["title"] | refused [] | lines differing 1
events | remove streaming-anomaly-detection-at-scale | found true | changed ["entries"] | refused [] | entries 3 -> 2
events | add {"key":"case-one-new","title":"case-one-new","role":"present","status":"upcoming"} | found true | changed ["entries"] | refused [] | entries 3 -> 4
education | edit machine-learning-msc title | found true | id machine-learning-msc | changed ["title"] | refused [] | lines differing 1
education | remove machine-learning-msc | found true | changed ["entries"] | refused [] | entries 2 -> 1
education | add {"key":"case-one-new","title":"case-one-new"} | found true | changed ["entries"] | refused [] | entries 2 -> 3
applications | edit assistant-professor-ml title | found true | id assistant-professor-ml | changed ["title"] | refused [] | lines differing 1
applications | remove assistant-professor-ml | found true | changed ["entries"] | refused [] | entries 2 -> 1
applications | add {"key":"case-one-new","title":"case-one-new"} | found true | changed ["entries"] | refused [] | entries 2 -> 3
joint-work | edit rivera-lab title | found true | id rivera-lab | changed ["title"] | refused [] | lines differing 1
joint-work | remove rivera-lab | found true | changed ["entries"] | refused [] | entries 2 -> 1
joint-work | add {"key":"case-one-new","title":"case-one-new","person":"case-one-new","status":"exploring"} | found true | changed ["entries"] | refused [] | entries 2 -> 3
tasks | edit review-2-papers-for-mlshift-workshop title | found true | id review-2-papers-for-mlshift-workshop | changed ["title"] | refused [] | lines differing 1
tasks | remove review-2-papers-for-mlshift-workshop | found true | changed ["entries"] | refused [] | entries 3 -> 2
tasks | add {"key":"case-one-new","title":"case-one-new","status":"todo"} | found true | changed ["entries"] | refused [] | entries 3 -> 4
literature | edit example2024bandit title | found true | id example2024bandit | changed ["title"] | refused [] | lines differing 1
literature | remove example2024bandit | found true | changed ["entries"] | refused [] | entries 2 -> 1
literature | add {"key":"case-one-new"} | found true | changed ["entries"] | refused [] | entries 2 -> 3
```

### case09.case.ts

```ts
// Case 9 of O79: a dataset entry whose `retrieval` source is `kind: derived` with the data field
// `from: [synthgraph]`, planted in a scratch copy of the demo hub with the hub's `retrieval` schema
// field (its nested `from` field naming the datasets as the hub's data.yml:60 does). Prints the
// dataset's retrieval as the snapshot reads it, the Data view's derived-from line, every finding on
// data.yml and the references the index finds in data.yml. Writes only under the scratchpad folder,
// removed at the end. SOURCE_KEY is the schema key the nested field names its source by.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/vitest/dist/index.js';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79';
const S = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79';
const OUT = join(S, 'case09.out.txt');
const SOURCE_KEY = process.env.O79_SOURCE_KEY ?? 'from: datasets';

it('case 9', async () => {
    const { engineDir, loadConfig, textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);
    const { published, indexedOnce } = await import(`${W}/tests/data/hubs/hubs-fixture.ts`);
    const { setCatalog } = await import(`${W}/src/lib/state/shared/words/text.ts`);
    const { statedWords } = await import(`${W}/src/lib/state/sources/registries/datasets.ts`);
    const lines: string[] = [];
    const say = (line: string): void => void lines.push(line);
    const runs = mkdtempSync(join(S, 'runs-'));
    try {
        const hub = join(runs, 'demo');
        cpSync(join(W, 'tests', 'fixtures', 'hubs', 'demo'), hub, { recursive: true });
        const file = join(hub, '.oculus', 'data', 'research', 'data.yml');
        const text = readFileSync(file, 'utf8')
            .replace(
                'datasets:\n',
                [
                    '  - field: retrieval',
                    '    type: records',
                    '    fields:',
                    '      - { field: kind, type: select, options: [url, derived], required: true }',
                    `      - { field: from, type: tags, ${SOURCE_KEY}, when: { kind: derived } }`,
                    '      - { field: script, type: text, when: { kind: derived } }',
                    'datasets:',
                    '  - key: synth-cache',
                    '    name: Synthetic graph caches (derived)',
                    '    retrieval:',
                    '      - kind: derived',
                    '        from: [synthgraph]',
                    '        script: code/prep.py',
                    ''
                ].join('\n')
            );
        writeFileSync(file, text);
        say(`== planted schema line: from, type tags, ${SOURCE_KEY}`);
        const folders = [{ name: 'demo', dir: hub }];
        const { snapshot } = published(folders, 'demo');
        setCatalog(textCatalog(loadConfig(engineDir(), { hub }).config));
        const dataset = snapshot.entities.datasets['demo:synth-cache'];
        say(`retrieval: ${JSON.stringify(dataset?.retrieval)}`);
        for (const source of dataset?.retrieval ?? []) say(`derived-from line: ${statedWords(source)}`);
        const found = snapshot.findings.filter((one: { file: string }) => one.file === file);
        say(`findings on data.yml: ${found.length}`);
        for (const one of found) say(`  ${one.key} | ${one.message}`);
        const { references } = indexedOnce(folders, 'demo');
        const scan = references.files.find((one: { file: { path: string } }) =>
            one.file.path.endsWith('research/data.yml')
        );
        for (const one of scan?.references ?? []) {
            say(`reference: ${one.value} line ${one.span.start.line} sources ${one.sources.join(',')}`);
        }
    } finally {
        rmSync(runs, { recursive: true, force: true });
        writeFileSync(OUT, `${lines.join('\n')}\n`);
    }
});
```

Printed (`Tests  1 passed (1)`):

```
== planted schema line: from, type tags, from: datasets
retrieval: [{"kind":"derived","from":["synthgraph"],"script":"code/prep.py"}]
derived-from line: Built from synthgraph by code/prep.py
findings on data.yml: 0
reference: synthgraph line 19 sources datasets
reference: graphs line 25 sources options:.oculus/data/research/data.yml#themes
reference: timeseries line 33 sources options:.oculus/data/research/data.yml#themes
```

### case10.case.ts

```ts
// Case 10 of O79, its program half: a scratch copy of the demo hub whose `collections:` entry of the
// leads carries `primary_key: title`, and its leads file no schema, as the demo hub's has none.
// Prints the config's findings on the hub's settings file, the field the feed writer addresses a
// lead by and where it reads it from, and a write of a lead's status through the feed writer, by
// the lead's title. Writes only under the scratchpad folder, removed at the end.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/vitest/dist/index.js';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79';
const S = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79';
const OUT = join(S, 'case10.out.txt');

it('case 10', async () => {
    const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);
    const { portfolioConfigFrom } = await import(`${W}/src/lib/data/index.ts`);
    const feeds = await import(`${W}/src/lib/server/edit/feeds/feeds.ts`);
    const lines: string[] = [];
    const say = (line: string): void => void lines.push(line);
    const runs = mkdtempSync(join(S, 'runs-'));
    try {
        const hub = join(runs, 'demo');
        cpSync(join(W, 'tests', 'fixtures', 'hubs', 'demo'), hub, { recursive: true });
        const settings = join(hub, '.oculus', 'config.yml');
        const before = readFileSync(settings, 'utf8');
        const after = before.replace(
            '{ key: leads, file: ".oculus/data/academic/leads.yml", registry: leads,',
            '{ key: leads, file: ".oculus/data/academic/leads.yml", registry: leads, primary_key: title,'
        );
        say(`settings entry rewritten: ${after !== before}`);
        writeFileSync(settings, after);
        const loaded = loadConfig(engineDir(), { hub });
        const config = portfolioConfigFrom(loaded.config, loaded.from);
        const own = loaded.findings.filter((one: { file: string }) => one.file === settings);
        say(`findings on the hub's settings file: ${own.length}`);
        for (const one of own) say(`  ${one.key} | ${one.message}`);
        say(`the leads entry as read: ${JSON.stringify(
            (loaded.config.collections as { key: string }[]).find((one) => one.key === 'leads')
        )}`);
        say(`the field the feed writer addresses a lead by: ${JSON.stringify(feeds.FEED_RULES.leads)}`);
        const title = 'Postdoc, Robust ML';
        const out = feeds.writeFeedField(hub, config, 'leads', title, 'status', 'declined');
        say(`writeFeedField(leads, ${JSON.stringify(title)}, status, declined): found ${out.found} | changed ${JSON.stringify(out.changed)} | refused ${JSON.stringify(out.refused)}`);
        const written = readFileSync(join(hub, '.oculus', 'data', 'academic', 'leads.yml'), 'utf8');
        const at = written.indexOf(title);
        say(`the lead after the write: ${JSON.stringify(written.slice(at, at + 220))}`);
    } finally {
        rmSync(runs, { recursive: true, force: true });
        writeFileSync(OUT, `${lines.join('\n')}\n`);
    }
});
```

Printed (`Tests  1 passed (1)`):

```
settings entry rewritten: true
findings on the hub's settings file: 0
the leads entry as read: {"key":"leads","file":".oculus/data/academic/leads.yml","registry":"leads","primary_key":"title","ticker":{"category":"position"},"about":"files.make_collection_line_leads"}
the field the feed writer addresses a lead by: {"identity":"title","fields":["status"],"schema":true,"deletable":true}
writeFeedField(leads, "Postdoc, Robust ML", status, declined): found true | changed ["status"] | refused []
the lead after the write: "Postdoc, Robust ML\"\n    inst: \"Meridian Institute\"\n    country: \"NL\"\n    typ: \"postdoc\"\n    focus: \"robustness, distribution shift\"\n    fit: reach\n    status: declined\n    deadline: \"2026-05-01\"\n    url: \"https://example"
```

### case15.case.ts

```ts
// Case 15 of O79, its program half, over the scratch copy of the hub (O79_HUB, the folder
// scratchpad/o79-hub, which holds no local.yml). Prints, for every data file of `.oculus/data/` and
// for `.oculus/bookmarks.yml`: each schema line, at any depth, that holds a `from:` key; the fields
// flagged `primary_key: true`; each `foreign_key:` and whether it names a collection of the hub,
// `projects` or a vocabulary list. Prints also the `collections:` entries the hub reads its leads and
// radar by, and the file each entry comes from (the hub's settings file or oculus's sources.yml),
// with each entry's `primary_key:`. Reads only; writes its output under the scratchpad folder.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { globSync } from 'node:fs';
import { parse } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/yaml/dist/index.js';
import { it } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/vitest/dist/index.js';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79';
const S = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79';
const HUB = process.env.O79_HUB ?? `${S}-hub`;
const OUT = join(S, 'case15.out.txt');

type Field = { field?: string; fields?: Field[]; [key: string]: unknown };

it('case 15', async () => {
    const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);
    const lines: string[] = [];
    const say = (line: string): void => void lines.push(line);
    try {
        const loaded = loadConfig(engineDir(), { hub: HUB });
        const merged = loaded.config;
        const entries = (merged.collections ?? []) as Record<string, unknown>[];
        const keys = entries.map((one) => String(one.key));
        const vocab = (source: string): boolean => {
            if (!source.startsWith('vocab.')) return false;
            const [list, field] = source.slice('vocab.'.length).split('.');
            const held = merged[list];
            if (held === undefined) return false;
            if (field === undefined) return true;
            return Object.values(held as Record<string, unknown>).some(
                (row) => typeof row === 'object' && row !== null && (row as Record<string, unknown>)[field] === true
            );
        };
        say(`the collections list comes from: ${loaded.from.collections ?? '(none)'}`);
        for (const one of entries.filter((entry) => ['leads', 'radar'].includes(String(entry.registry)))) {
            say(`  entry ${String(one.key)} | file ${String(one.file)} | primary_key ${JSON.stringify(one.primary_key)}`);
        }
        const files = [
            ...globSync('.oculus/data/**/*.yml', { cwd: HUB }).sort(),
            '.oculus/bookmarks.yml'
        ];
        let froms = 0;
        let unnamed = 0;
        for (const path of files) {
            const data = parse(readFileSync(join(HUB, path), 'utf8')) as Record<string, unknown>;
            const schema = Array.isArray(data?.schema) ? (data.schema as Field[]) : null;
            if (schema === null) {
                say(`${path} | no schema`);
                continue;
            }
            const flagged: string[] = [];
            const walk = (fields: Field[], at: string): void => {
                for (const one of fields) {
                    const name = `${at}${String(one.field)}`;
                    if (Object.hasOwn(one, 'from')) {
                        froms += 1;
                        say(`${path} | from: on ${name} | ${JSON.stringify(one.from)}`);
                    }
                    if (one.primary_key === true) flagged.push(name);
                    if (Object.hasOwn(one, 'foreign_key')) {
                        const targets = [one.foreign_key].flat() as unknown[];
                        for (const target of targets) {
                            const word = typeof target === 'string' ? target : JSON.stringify(target);
                            const ok =
                                typeof target === 'string' &&
                                (target === 'projects' || keys.includes(target) || vocab(target));
                            if (!ok) unnamed += 1;
                            say(`${path} | foreign_key on ${name} | ${word} | ${ok ? 'names a target' : 'NAMES NOTHING'}`);
                        }
                    }
                    if (Array.isArray(one.fields)) walk(one.fields, `${name}.`);
                }
            };
            walk(schema, '');
            say(`${path} | primary keys: ${flagged.length === 0 ? 'none' : flagged.join(', ')}`);
        }
        say(`schema lines holding from: ${froms}`);
        say(`foreign keys naming nothing: ${unnamed}`);
    } finally {
        writeFileSync(OUT, `${lines.join('\n')}\n`);
    }
});
```

Printed (`Tests  1 passed (1)`), over the scratch copy as copied, no rewrite:

```
the collections list comes from: sources.yml
  entry leads | file .oculus/data/academic/leads.yml | primary_key undefined
  entry radar | file .oculus/data/literature/radar.yml | primary_key undefined
.oculus/data/academic/applications.yml | from: on related | "projects"
.oculus/data/academic/applications.yml | from: on lead | "people"
.oculus/data/academic/applications.yml | from: on collaborators | "people"
.oculus/data/academic/applications.yml | from: on supervisors | "people"
.oculus/data/academic/applications.yml | primary keys: none
.oculus/data/academic/career.yml | primary keys: none
.oculus/data/academic/education.yml | from: on related | "projects"
.oculus/data/academic/education.yml | from: on lead | "people"
.oculus/data/academic/education.yml | from: on collaborators | "people"
.oculus/data/academic/education.yml | from: on supervisors | "people"
.oculus/data/academic/education.yml | primary keys: none
.oculus/data/academic/events.yml | from: on related | "projects"
.oculus/data/academic/events.yml | from: on lead | "people"
.oculus/data/academic/events.yml | from: on collaborators | "people"
.oculus/data/academic/events.yml | from: on supervisors | "people"
.oculus/data/academic/events.yml | primary keys: none
.oculus/data/academic/funding.yml | from: on funder | "organisations"
.oculus/data/academic/funding.yml | from: on lead | "people"
.oculus/data/academic/funding.yml | from: on collaborators | "people"
.oculus/data/academic/funding.yml | from: on supervisors | "people"
.oculus/data/academic/funding.yml | primary keys: none
.oculus/data/academic/joint-work.yml | from: on person | "people"
.oculus/data/academic/joint-work.yml | primary keys: none
.oculus/data/academic/leads.yml | primary keys: none
.oculus/data/academic/tasks.yml | from: on lead | "people"
.oculus/data/academic/tasks.yml | from: on collaborators | "people"
.oculus/data/academic/tasks.yml | from: on supervisors | "people"
.oculus/data/academic/tasks.yml | primary keys: none
.oculus/data/literature/literature.yml | from: on projects | "projects"
.oculus/data/literature/literature.yml | primary keys: none
.oculus/data/literature/radar.yml | from: on bucket | "vocab.radar_buckets"
.oculus/data/literature/radar.yml | from: on project | "projects"
.oculus/data/literature/radar.yml | from: on maps_to | "projects"
.oculus/data/literature/radar.yml | primary keys: none
.oculus/data/people/organisations.yml | primary keys: none
.oculus/data/people/people.yml | from: on affiliations | "organisations"
.oculus/data/people/people.yml | primary keys: none
.oculus/data/pillars/domains.yml | primary keys: none
.oculus/data/pillars/pillars.yml | primary keys: none
.oculus/data/research/data.yml | from: on access | "vocab.data_access"
.oculus/data/research/data.yml | from: on retrieval.from | "datasets"
.oculus/data/research/data.yml | primary keys: none
.oculus/data/research/resources.yml | primary keys: none
.oculus/data/research/statements.yml | primary keys: none
.oculus/data/research/venues.yml | from: on category | "vocab.venue_categories"
.oculus/data/research/venues.yml | from: on tier | "vocab.venue_tiers"
.oculus/data/research/venues.yml | primary keys: none
.oculus/bookmarks.yml | primary keys: none
schema lines holding from: 29
foreign keys naming nothing: 0
```

The integrity file over the same copy, `OCULUS_TEST_HUB=<scratchpad>/o79-hub npx vitest run tests/checks/config/integrity.test.ts --reporter=verbose`, its lines filtered by `grep -E` on the pass, fail and skip glyphs and on `Test Files`, `Tests ` and `FAIL` (the pass glyph written here as <check>):

```
<check> |unit| tests/checks/config/integrity.test.ts > the demo hub > validates with no findings 493ms
<check> |unit| tests/checks/config/integrity.test.ts > the demo hub > holds exactly what a second count of the tree finds 11ms
<check> |unit| tests/checks/config/integrity.test.ts > the demo hub > survives JSON.stringify and JSON.parse unchanged 3ms
<check> |unit| tests/checks/config/integrity.test.ts > the demo hub > reads a deck out of every project that has a present/ folder, with no finding 4ms
<check> |unit| tests/checks/config/integrity.test.ts > the demo hub > reads an equation out of every slide that writes one, as LaTeX that typesets 8ms
<check> |unit| tests/checks/config/integrity.test.ts > the demo hub > reads the portfolio deck with every named deck found 5ms
<check> |unit| tests/checks/config/integrity.test.ts > the real hub > validates with no findings 4781ms
<check> |unit| tests/checks/config/integrity.test.ts > the real hub > holds exactly what a second count of the tree finds 483ms
<check> |unit| tests/checks/config/integrity.test.ts > the real hub > survives JSON.stringify and JSON.parse unchanged 16ms
<check> |unit| tests/checks/config/integrity.test.ts > the real hub > reads a deck out of every project that has a present/ folder, with no finding 156ms
<check> |unit| tests/checks/config/integrity.test.ts > the real hub > reads an equation out of every slide that writes one, as LaTeX that typesets 208ms
<check> |unit| tests/checks/config/integrity.test.ts > the real hub > reads the portfolio deck with every named deck found 22ms
<check> |unit| tests/checks/config/integrity.test.ts > the real hub > reads every project of the personal folder with no finding, each with the tier personal 1037ms
<check> |unit| tests/checks/config/integrity.test.ts > the count of written equations > agrees with the reader on several slides, a blank equation and a value that is not text 189ms
 Test Files  1 passed (1)
      Tests  14 passed (14)
```

### case18.case.ts

```ts
// Case 18 of O79: a new hub made from docs/templates.md as Make Folder a Hub makes one with every
// collection ticked (`.oculus/config.yml` from `hubConfigText`, each collection's data file from its
// template body at its path; no local.yml), in a scratch folder. Prints every finding of its build
// and an Add on each collection through createEntry, the identity field and the required fields
// given. Writes only under the scratchpad folder, removed at the end.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { it } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/vitest/dist/index.js';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79';
const S = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79';
const OUT = join(S, 'case18.out.txt');

it('case 18', async () => {
    const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);
    const { portfolioConfigFrom } = await import(`${W}/src/lib/data/index.ts`);
    const { published } = await import(`${W}/tests/data/hubs/hubs-fixture.ts`);
    const { collectionTemplates, hubConfigText } = await import(
        `${W}/src/lib/data/sources/documents/templates.ts`
    );
    const { createEntry } = await import(`${W}/src/lib/server/edit/writes.ts`);
    const { readCollection } = await import(`${W}/src/lib/server/files/fs/collections.ts`);
    const lines: string[] = [];
    const say = (line: string): void => void lines.push(line);
    const runs = mkdtempSync(join(S, 'runs-'));
    try {
        const hub = join(runs, 'fresh');
        const page = readFileSync(join(W, 'docs', 'templates.md'), 'utf8');
        const chosen = collectionTemplates(page);
        say(`collections offered: ${chosen.map((one: { key: string }) => one.key).join(', ')}`);
        mkdirSync(join(hub, '.oculus'), { recursive: true });
        writeFileSync(join(hub, '.oculus', 'config.yml'), hubConfigText(page, chosen));
        for (const one of chosen as { file: string; body: string }[]) {
            mkdirSync(dirname(join(hub, one.file)), { recursive: true });
            writeFileSync(join(hub, one.file), one.body);
        }
        const { snapshot } = published([{ name: 'fresh', dir: hub }], 'fresh');
        say(`findings: ${snapshot.findings.length}`);
        for (const one of snapshot.findings) say(`  ${one.file.slice(hub.length)} | ${one.key} | ${one.message}`);
        const loaded = loadConfig(engineDir(), { hub });
        const config = portfolioConfigFrom(loaded.config, loaded.from);
        for (const entry of config.collections) {
            const held = readCollection(hub, config, entry.key);
            if (held === null) {
                say(`${entry.key} | add | no file read`);
                continue;
            }
            const schema = (Array.isArray(held.schema) ? held.schema : []) as {
                field: string;
                type: string;
                required?: unknown;
                options?: unknown[];
            }[];
            const fields: Record<string, unknown> = { [held.ident]: 'case-eighteen' };
            for (const one of schema) {
                if (one.required !== true || one.field in fields) continue;
                const option = one.options?.at(0);
                fields[one.field] =
                    option === undefined
                        ? 'case-eighteen'
                        : typeof option === 'string'
                          ? option
                          : (option as { key: string }).key;
            }
            const out = createEntry(hub, config, entry.key, fields);
            say(`${entry.key} | add ${JSON.stringify(fields)} | found ${out.found} | changed ${JSON.stringify(out.changed)} | refused ${JSON.stringify(out.refused)}`);
        }
    } finally {
        rmSync(runs, { recursive: true, force: true });
        writeFileSync(OUT, `${lines.join('\n')}\n`);
    }
});
```

Printed (`Tests  1 passed (1)`):

```
collections offered: data, venues, pillars, domains, statements, people, organisations, resources, funding, events, education, applications, joint-work, tasks, literature, leads, radar
findings: 5
  /projects/active | scan | scan directory does not exist
  /projects/archive | scan | scan directory does not exist
  /projects/coauthor | scan | scan directory does not exist
  /projects/ideas | scan | scan directory does not exist
  /projects/manuscripts | scan | scan directory does not exist
data | add | no file read
venues | add {"name":"case-eighteen"} | found true | changed [] | refused [{"field":"id","reason":"a new entry needs a non-empty id"}]
pillars | add {"key":"case-eighteen","title":"case-eighteen"} | found true | changed ["entries"] | refused []
domains | add {"key":"case-eighteen","title":"case-eighteen"} | found true | changed ["entries"] | refused []
statements | add {"key":"case-eighteen","title":"case-eighteen","status":"draft"} | found true | changed ["entries"] | refused []
people | add {"key":"case-eighteen","name":"case-eighteen"} | found true | changed ["entries"] | refused []
organisations | add {"key":"case-eighteen","name":"case-eighteen","kind":"university"} | found true | changed ["entries"] | refused []
resources | add {"key":"case-eighteen","name":"case-eighteen","kind":"cluster"} | found true | changed ["entries"] | refused []
funding | add {"key":"case-eighteen","title":"case-eighteen","status":"in-prep","lead":"case-eighteen"} | found true | changed ["entries"] | refused []
events | add {"key":"case-eighteen","title":"case-eighteen","role":"present","status":"upcoming","lead":"case-eighteen"} | found true | changed ["entries"] | refused []
education | add {"key":"case-eighteen","title":"case-eighteen","status":"planned","lead":"case-eighteen"} | found true | changed ["entries"] | refused []
applications | add {"key":"case-eighteen","title":"case-eighteen","status":"not-applied","lead":"case-eighteen"} | found true | changed ["entries"] | refused []
joint-work | add {"key":"case-eighteen","title":"case-eighteen","person":"case-eighteen","status":"exploring"} | found true | changed ["entries"] | refused []
tasks | add {"key":"case-eighteen","title":"case-eighteen","status":"todo","lead":"case-eighteen"} | found true | changed ["entries"] | refused []
literature | add {"key":"case-eighteen","title":"case-eighteen"} | found true | changed ["entries"] | refused []
```

### Other commands that wrote files

- `npx svelte-kit sync` in the worktree: wrote the git-ignored `.svelte-kit/`.
- `cp -cR` of the hub into `scratchpad/o79-hub` (APFS clones, the hub's files untouched; `git status --short` in the hub printed the same five lines before and after) and `rm -rf` of that folder and of the scratchpad's vitest cache `scratchpad/o79/node_modules` before this report.

## Runs of the verify list and whole-suite commands

The verify list (`npm run diagrams && npm run test:quick`) ran 0 times. No whole-suite command ran. The one test file of the worktree run was `tests/checks/config/integrity.test.ts`, once, over the scratch copy of the hub, for case 15.
