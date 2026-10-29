// Layer 2, client state tests. A Settings family marked `sparse: true` (G138), the reader rows of
// `literature.sources` and `recover.sources` as the family editor holds them
// (state/system/config/editors/draft.ts and fields.ts): a card draws the fields its row sets and
// an Add field menu offers the others; a field added from the menu is held with its control's
// empty value and Save writes it into the row; a `fields` value that is a path text or a
// `{ path, op }` record and a `query` value that is a record are each held and read back as the
// file has them. A change to `literature.sources`, read from the primary hub alone, is written to
// the primary's `.oculus/config.yml` whatever hub is shown, and one to `recover.sources`, read from
// each hub's own file, to the hub shown (state/system/config/view/hub-settings.svelte.ts and
// editors/writer.ts). The rows are the fixture rows of tests/server/core/reader/rows.yml.
//
// It does not cover the cards and the menu the editor draws (views/system/workbench/editors/
// Cards.svelte), which the look at landing does, nor the server's write of the value.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { hubSlice } from '../../../../src/lib/data/sources/config/settings/hub-slice.ts';
import type { CatalogEntry } from '../../../../src/lib/data/sources/config/catalog/options.ts';
import { PRIMARY_ROOT } from '../../../../src/lib/state/system/config/config-files.ts';
import { fileRows, type ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import {
    applyEdit,
    draftOf,
    draftValue,
    type Draft
} from '../../../../src/lib/state/system/config/editors/draft.ts';
import {
    addableFields,
    addedValue,
    cardsOf,
    drawsCards,
    pairValueSpec,
    shownFields,
    type Card,
    type FieldValue
} from '../../../../src/lib/state/system/config/editors/fields.ts';
import { createEditorWriter } from '../../../../src/lib/state/system/config/editors/writer.ts';
import { FIXTURE_CONFIG } from '../../../server/core/reader/rows.ts';
import { bareLists, config, hubRowOf, shipped, text } from '../settings/fixture.ts';

const FILE = 'behavior.yml';

/** The fixture's text, a hub's `.oculus/config.yml` holding the four keys. */
const ROWS_TEXT = readFileSync(
    join(import.meta.dirname, '..', '..', '..', 'server', 'core', 'reader', 'rows.yml'),
    'utf8'
);

/** The merged config with the fixture's rows in force. */
const HELD = {
    ...config,
    literature: { ...(config.literature as object), ...(FIXTURE_CONFIG.literature as object) },
    recover: { ...(config.recover as object), ...(FIXTURE_CONFIG.recover as object) }
};

const lists = bareLists(HELD);

/** The row of a key of behavior.yml with the fixture's rows in force, in the primary's file. */
function rowOf(key: string): ConfigRow {
    const read = fileRows(FILE, shipped[FILE], HELD, {
        hubFile: { text: text(ROWS_TEXT), present: true },
        workspace: null
    });
    const row = read.rows.find((one) => one.key === key);
    if (row === undefined) throw new Error(`no row ${key}`);
    return row;
}

/** The draft of a row, which every row here has. */
function draftFor(row: ConfigRow): Draft {
    const draft = draftOf(row);
    if (draft === null) throw new Error('no draft');
    return draft;
}

/** The catalog field of a family row. */
function specOf(row: ConfigRow, name: string): CatalogEntry {
    if (!Object.hasOwn(row.fields, name)) throw new Error(`no field ${name}`);
    return row.fields[name];
}

/** The fields each row of the fixture sets, in the order of the row's catalog fields. */
function setFields(row: ConfigRow, held: Record<string, unknown>): string[] {
    return Object.keys(row.fields).filter((name) => Object.hasOwn(held, name));
}

/**
 * What a row's card holds down a path of field names and card places: the text a field holds, or
 * the fields of each card it draws; undefined where the path leaves the cards.
 */
function heldAt(card: Card | undefined, path: (string | number)[]): unknown {
    let at: Card | undefined = card;
    let value: unknown = undefined;
    for (const step of path) {
        if (typeof step === 'number') {
            at = cardsOf(value as FieldValue).at(step);
            value = at?.fields;
        } else {
            value = at?.fields[step];
        }
    }
    const cards = cardsOf(value as FieldValue);
    return cards.length > 0 ? cards.map((one) => one.fields) : value;
}

/**
 * The values of the fixture rows the cards draw beyond the row's own fields: a `records` that is a
 * record, a step's field record, a step's paging, a Recover row's `for_each`, and a `where` map.
 */
const DRAWN: {
    name: string;
    key: string;
    row: string;
    path: (string | number)[];
    held: unknown;
}[] = [
    {
        name: "PubMed's efetch records, a record",
        key: 'literature.sources',
        row: 'pubmed',
        path: ['then', 0, 'records'],
        held: [{ path: 'PubmedArticleSet.PubmedArticle[]', absent: 'none' }]
    },
    {
        name: "arXiv's records, a record",
        key: 'literature.sources',
        row: 'arxiv',
        path: ['records'],
        held: [{ path: 'feed.entry[]', absent: 'none' }]
    },
    {
        name: "DANDI's records, a record with refuse_when",
        key: 'recover.sources',
        row: 'dandi',
        path: ['records'],
        held: [{ path: 'results', refuse_when: 'zarr' }]
    },
    {
        name: "Hugging Face's records, a record with its where map",
        key: 'recover.sources',
        row: 'huggingface',
        path: ['records', 0, 'where'],
        held: [{ key: 'type', value: 'file' }]
    },
    {
        name: "Synapse's for_each, a text",
        key: 'recover.sources',
        row: 'synapse',
        path: ['for_each'],
        held: 'ids'
    },
    {
        name: "Synapse's children step paging, a record",
        key: 'recover.sources',
        row: 'synapse',
        path: ['then', 1, 'paging'],
        held: [{ kind: 'cursor', param: 'nextPageToken', in: 'body', from: 'nextPageToken' }]
    },
    {
        name: "DANDI's step field, a { path, kind } record",
        key: 'recover.sources',
        row: 'dandi',
        path: ['then', 0, 'fields', 0, 'value'],
        held: [{ path: 'digest.dandi:sha2-256', kind: 'sha256' }]
    }
];

describe('a sparse family card: the fields its row sets and an Add field menu of the others', () => {
    it.each(DRAWN)('draws $name', (one) => {
        const row = rowOf(one.key);
        const at = (row.value as { key: string }[]).findIndex((held) => held.key === one.row);
        expect(heldAt(draftFor(row).cards.at(at), one.path)).toEqual(one.held);
    });

    it.each(['literature.sources', 'recover.sources'])('%s', (key) => {
        const row = rowOf(key);
        expect(row.entry.sparse).toBe(true);
        const draft = draftFor(row);
        const held = row.value as Record<string, unknown>[];
        expect(draft.cards).toHaveLength(held.length);
        draft.cards.forEach((card, at) => {
            const set = setFields(row, held[at]);
            expect(shownFields(card, draft.fields, true)).toEqual(set);
            expect(addableFields(card, draft.fields)).toEqual(
                draft.fields.filter((name) => !set.includes(name))
            );
        });
        expect(draftValue(draft, row, lists)).toEqual({ ok: true, value: held });
    });

    it('draws every field on a family that is not sparse', () => {
        const row = rowOf('literature.sources');
        const card = draftFor(row).cards[0];
        expect(shownFields(card, Object.keys(row.fields), false)).toEqual(Object.keys(row.fields));
    });
});

describe('a field added from the Add field menu', () => {
    it("holds pace on OpenAlex's card, which sets none, and Save writes the gap set in it", () => {
        const row = rowOf('literature.sources');
        const at = (row.value as { key: string }[]).findIndex((one) => one.key === 'openalex');
        const draft = draftFor(row);
        expect(addableFields(draft.cards[at], draft.fields)).toContain('pace');
        const pace = specOf(row, 'pace');
        expect(addedValue(pace)).toEqual([]);
        const added = applyEdit(draft, {
            do: 'set',
            index: at,
            field: 'pace',
            value: addedValue(pace)
        });
        expect(shownFields(added.cards[at], added.fields, true)).toContain('pace');
        const path = [{ index: at, field: 'pace' }];
        const carded = applyEdit(added, { do: 'add', path });
        const gapped = applyEdit(carded, { do: 'set', index: 0, field: 'gap', value: '500', path });
        const made = draftValue(gapped, row, lists);
        const value = row.value as Record<string, unknown>[];
        expect(made).toEqual({
            ok: true,
            value: value.map((one, place) => (place === at ? { ...one, pace: { gap: 500 } } : one))
        });
    });

    it('holds each control with the empty value that draws it', () => {
        const row = rowOf('literature.sources');
        expect(addedValue(specOf(row, 'name'))).toBe('');
        expect(addedValue(specOf(row, 'query'))).toEqual([]);
        expect(addedValue(specOf(row, 'format'))).toBe('');
    });
});

describe("a reader row's fields and query values, a text or a record", () => {
    it("holds OpenAlex's path texts as texts, its { path, op } records and query terms as cards", () => {
        const row = rowOf('literature.sources');
        const card = draftFor(row).cards[0];
        const fields = specOf(row, 'fields');
        const valueSpec = pairValueSpec(fields);
        const pairs = cardsOf(card.fields.fields).map((one) => one.fields);
        const title = pairs.find((one) => one.key === 'title');
        const pmid = pairs.find((one) => one.key === 'pmid');
        expect(title?.value).toBe('display_name');
        expect(drawsCards(valueSpec, title?.value)).toBe(false);
        expect(drawsCards(valueSpec, pmid?.value)).toBe(true);
        expect(cardsOf(pmid?.value).map((one) => one.fields)).toEqual([
            { path: 'ids.pmid', op: 'match', pattern: '(\\d+)/?$' }
        ]);
        const query = specOf(row, 'query');
        const words = cardsOf(card.fields.query)
            .map((one) => one.fields)
            .find((one) => one.key === 'words');
        expect(drawsCards(pairValueSpec(query), words?.value)).toBe(true);
        expect(cardsOf(words?.value).map((one) => one.fields)).toEqual([
            { param: 'filter', text: 'title_and_abstract.search:{words|spaced}' }
        ]);
    });
});

/** Lab's settings, read, with the fixture's Recover rows in force. */
const LAB_READ = {
    state: 'ready' as const,
    slice: { hub: 'lab', config: hubSlice(HELD) }
};

/** A row of the workspace of the hubs `hub`, the primary, and `lab`, lab chosen on it. */
function shownRow(key: string): ConfigRow {
    const id = `${FILE}:${key}`;
    return hubRowOf(id, {
        hubs: ['hub', 'lab'],
        primary: 'hub',
        chosen: { [id]: 'lab' },
        read: LAB_READ,
        file: { text: text(ROWS_TEXT), present: true },
        primaryFile: ROWS_TEXT
    });
}

/** The fields of the row a Save adds: a source of its own. */
const ADDED: [string, string][] = [
    ['key', 'mine'],
    ['name', 'Mine'],
    ['format', 'json'],
    ['address', 'https://example.org/works'],
    ['records', 'items']
];

/** The hub the Save of a row with one row added names, undefined for the primary. */
async function savedTo(row: ConfigRow): Promise<(string | undefined)[]> {
    const write = vi.fn(() => Promise.resolve({ ok: true, changed: [row.key], refused: [] }));
    const writer = createEditorWriter(write, {
        reset: vi.fn(() => Promise.resolve({ ok: true, changed: [], refused: [] })),
        changed: () => undefined,
        ended: () => undefined,
        held: () => true,
        lists: () => lists
    });
    let draft = applyEdit(draftFor(row), { do: 'add' });
    const index = draft.cards.length - 1;
    for (const [field, value] of ADDED)
        draft = applyEdit(draft, { do: 'set', index, field, value });
    await writer.save(row, draft);
    return write.mock.calls.map((call: unknown[]) => call[5] as string | undefined);
}

describe('where a change to a sparse family is written, with a second hub shown', () => {
    it("writes literature.sources to the primary hub's file, and offers no hub", async () => {
        const row = shownRow('literature.sources');
        expect([row.hub, row.choice]).toEqual([undefined, undefined]);
        expect(row.place).toMatchObject({
            layer: 'hub',
            root: PRIMARY_ROOT,
            path: '.oculus/config.yml'
        });
        expect(await savedTo(row)).toEqual([undefined]);
    });

    it("writes recover.sources to the hub shown, lab's file", async () => {
        const row = shownRow('recover.sources');
        expect(row.hub).toBe('lab');
        expect(row.place).toMatchObject({ layer: 'hub', root: 'lab', path: '.oculus/config.yml' });
        expect(await savedTo(row)).toEqual(['lab']);
    });
});
