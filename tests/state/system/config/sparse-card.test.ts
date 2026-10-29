// Layer 2, client state tests. A Settings family marked `sparse: true` (G138), the reader rows of
// `literature.sources` and `recover.sources` as the family editor holds them
// (state/system/config/editors/draft.ts and fields.ts): a card draws the fields its row sets and
// an Add field menu offers the others; a field added from the menu is held with its control's
// empty value and Save writes it into the row; a `fields` value that is a path text or a
// `{ path, op }` record and a `query` value that is a record are each held and read back as the
// file has them. Every value of the rows oculus ships and of the fixture's rows, `else`, `each`, a
// step's `then` and `paging.total` at any depth among them, is held by a control of its own and
// none is kept as the file has it, and each nested value changed is saved with the rest of its
// row as it was. A constant `value` (a scalar) of a boolean, a number or a text is drawn as its
// text, and saved, as it was or as a text typed over it, in the type the file held it in when the
// text reads as one; a boolean or a number a text field holds (a row's `name`) is kept as the file
// has it, with no box. `literature.sources`, read from the primary hub alone, is drawn in the
// Primary hub scope alone and its change held for the primary's `.oculus/config.yml`, and
// `recover.sources`, read from each hub's own file, is drawn in a hub's Hub scope and its change
// held under that hub for its file (state/system/config/view/hub-settings.svelte.ts, scopes/ and
// editors/writer.ts). The rows are the fixture rows of tests/server/core/reader/rows.yml.
//
// It does not cover the cards and the menu the editor draws (views/system/workbench/editors/
// Cards.svelte), which the look at landing does, nor the server's write of the value.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { hubSlice } from '../../../../src/lib/data/sources/config/settings/hub-slice.ts';
import type { CatalogEntry } from '../../../../src/lib/data/sources/config/catalog/options.ts';
import { PRIMARY_ROOT } from '../../../../src/lib/state/system/config/config-files.ts';
import { fileRows, type ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import {
    applyEdit,
    draftOf,
    draftValue,
    type Draft,
    type Step
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
import { settingsGroups } from '../../../../src/lib/state/system/config/groups.ts';
import { scopeGroups } from '../../../../src/lib/state/system/config/scopes/rows.ts';
import {
    fileOf,
    type Scope,
    type ScopeGround
} from '../../../../src/lib/state/system/config/scopes/scope.ts';
import { FIXTURE_CONFIG } from '../../../server/core/reader/rows.ts';
import { memoryStage } from '../../../views/system/workbench/workbench-fixture.ts';
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
    recover: { ...(config.recover as object), ...(FIXTURE_CONFIG.recover as object) },
    venues: { ...(config.venues as object), ...(FIXTURE_CONFIG.venues as object) }
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

/** The row of a key of behavior.yml as oculus ships it, with a hub file that sets none. */
function shippedRowOf(key: string): ConfigRow {
    const read = fileRows(FILE, shipped[FILE], config, {
        hubFile: { text: text('scan: []\n'), present: true },
        workspace: null
    });
    const row = read.rows.find((one) => one.key === key);
    if (row === undefined) throw new Error(`no row ${key}`);
    return row;
}

/** Every value a draft's cards keep as the file has it, by its place, at any depth. */
function keptIn(cards: Card[], place: string): string[] {
    return cards.flatMap((card, at) => [
        ...Object.keys(card.kept).map((name) => `${place}[${at}].${name}`),
        ...Object.entries(card.fields).flatMap(([name, held]) =>
            keptIn(cardsOf(held), `${place}[${at}].${name}`)
        )
    ]);
}

/** The rows the editor draws: the shipped rows and the fixture's, venues.browser among them. */
const ALL_ROWS: [string, () => ConfigRow][] = [
    ['the shipped literature.sources', () => shippedRowOf('literature.sources')],
    ['the shipped recover.sources', () => shippedRowOf('recover.sources')],
    ['the shipped links', () => shippedRowOf('links')],
    ["the fixture's literature.sources", () => rowOf('literature.sources')],
    ["the fixture's recover.sources", () => rowOf('recover.sources')],
    ["the fixture's venues.browser", () => rowOf('venues.browser')]
];

/** Set the value at a path of keys and places inside a value read from YAML. */
function setAt(value: unknown, path: (string | number)[], set: unknown): void {
    const inner = path.slice(0, -1).reduce<unknown>((at, step) => {
        if (typeof at !== 'object' || at === null) throw new Error(`no ${String(step)}`);
        return (at as Record<string | number, unknown>)[step];
    }, value);
    if (typeof inner !== 'object' || inner === null) throw new Error('no record to set in');
    (inner as Record<string | number, unknown>)[path[path.length - 1]] = set;
}

/** A way down a draft's cards: a field and the card in it, by its place or, in a map, its key. */
type Down = [string, number | string];

/**
 * The steps of an edit down a row's cards to a nested card, from the row's card of `row` (the
 * one card of a family that holds one record when `row` is null).
 */
function stepsTo(draft: Draft, row: string | null, down: Down[]): Step[] {
    const top = row === null ? 0 : draft.cards.findIndex((card) => card.fields.key === row);
    let cards = draft.cards;
    let index = top;
    const steps: Step[] = [];
    for (const [field, which] of down) {
        steps.push({ index, field });
        cards = cardsOf(cards[index].fields[field]);
        index =
            typeof which === 'number'
                ? which
                : cards.findIndex((card) => card.fields.key === which);
        if (index < 0) throw new Error(`no card ${String(which)} under ${field}`);
    }
    return [...steps, { index, field: '' }];
}

/**
 * The values of a reader row nested deeper than its own fields, each changed through its control:
 * the row, the way down to the card that holds it, its field, the value set, the path in the row
 * where its file then holds it, and the value saved there when it is not the value set.
 */
const NESTED: {
    name: string;
    key: string;
    row: string | null;
    down: Down[];
    field: string;
    value: FieldValue;
    held: (string | number)[];
    saved?: unknown;
}[] = [
    {
        name: "Crossref's authors each",
        key: 'literature.sources',
        row: 'crossref',
        down: [
            ['fields', 'authors'],
            ['value', 0],
            ['each', 0]
        ],
        field: 'path',
        value: 'literal',
        held: ['fields', 'authors', 'each', 'path']
    },
    {
        name: "PubMed's efetch authors each",
        key: 'literature.sources',
        row: 'pubmed',
        down: [
            ['then', 0],
            ['fields', 'authors'],
            ['value', 0],
            ['each', 0]
        ],
        field: 'path',
        value: 'Collective',
        held: ['then', 0, 'fields', 'authors', 'each', 'path']
    },
    {
        name: "PubMed's efetch date else",
        key: 'literature.sources',
        row: 'pubmed',
        down: [
            ['then', 0],
            ['fields', 'date'],
            ['value', 0],
            ['else', 0]
        ],
        field: 'pattern',
        value: '\\d{2}',
        held: ['then', 0, 'fields', 'date', 'else', 'pattern']
    },
    {
        name: "Europe PMC's type else",
        key: 'literature.sources',
        row: 'europe_pmc',
        down: [
            ['fields', 'type'],
            ['value', 0],
            ['else', 0]
        ],
        field: 'path',
        value: 'pubTypeList.type',
        held: ['fields', 'type', 'else', 'path']
    },
    {
        name: "arXiv's oa value",
        key: 'literature.sources',
        row: 'arxiv',
        down: [
            ['fields', 'oa'],
            ['value', 0]
        ],
        field: 'value',
        value: 'false',
        held: ['fields', 'oa', 'value'],
        saved: false
    },
    {
        name: "the Stanford Digital Repository's checksum else",
        key: 'recover.sources',
        row: 'stanford',
        down: [
            ['fields', 'checksum'],
            ['value', 0],
            ['else', 0]
        ],
        field: 'kind',
        value: 'sha256',
        held: ['fields', 'checksum', 'else', 'kind']
    },
    {
        name: "Synapse's children step's then",
        key: 'recover.sources',
        row: 'synapse',
        down: [
            ['then', 1],
            ['then', 0]
        ],
        field: 'address',
        value: 'https://example.org/{id}',
        held: ['then', 1, 'then', 0, 'address']
    },
    {
        name: "Synapse's children step's body includeTypes",
        key: 'recover.sources',
        row: 'synapse',
        down: [
            ['then', 1],
            ['body', 'includeTypes']
        ],
        field: 'value',
        value: ['file'],
        held: ['then', 1, 'body', 'includeTypes']
    },
    {
        name: "the address row's name else",
        key: 'recover.sources',
        row: 'url',
        down: [
            ['fields', 'name'],
            ['value', 0],
            ['else', 0]
        ],
        field: 'op',
        value: 'first',
        held: ['fields', 'name', 'else', 'op']
    },
    {
        name: "the address row's checksum else",
        key: 'recover.sources',
        row: 'url',
        down: [
            ['fields', 'checksum'],
            ['value', 0],
            ['else', 0]
        ],
        field: 'kind',
        value: 'sha1',
        held: ['fields', 'checksum', 'else', 'kind']
    },
    {
        name: "the journal browser's paging total",
        key: 'venues.browser',
        row: null,
        down: [
            ['paging', 0],
            ['total', 0]
        ],
        field: 'pattern',
        value: '(\\d+)',
        held: ['paging', 'total', 'pattern']
    }
];

/** The source of a hub's `literature.sources` whose field `oa` is the constant `held`. */
function constantSource(held: unknown): Record<string, unknown> {
    return {
        key: 'mine',
        name: 'Mine',
        format: 'json',
        address: 'https://example.org/works',
        records: 'items',
        fields: { oa: { value: held } }
    };
}

/**
 * The row of `literature.sources` with the one source whose `oa` is `held`, in the primary's file.
 */
function constantRowOf(held: unknown): ConfigRow {
    return sourceRowOf(constantSource(held));
}

/** The row of `literature.sources` with one source in force, in the primary's file. */
function sourceRowOf(source: Record<string, unknown>): ConfigRow {
    const merged = {
        ...config,
        literature: { ...(config.literature as object), sources: [source] }
    };
    const read = fileRows(FILE, shipped[FILE], merged, {
        hubFile: { text: text(stringify({ literature: { sources: [source] } })), present: true },
        workspace: null
    });
    const row = read.rows.find((one) => one.key === 'literature.sources');
    if (row === undefined) throw new Error('no row literature.sources');
    return row;
}

/** A constant `value` of each scalar type, its text in the box, a text typed and what is saved. */
const CONSTANTS: { name: string; held: unknown; shown: string; typed: string; saved: unknown }[] = [
    { name: 'a boolean', held: true, shown: 'true', typed: 'false', saved: false },
    { name: 'a number', held: 3, shown: '3', typed: '4', saved: 4 },
    { name: 'a text', held: 'preprint', shown: 'preprint', typed: 'article', saved: 'article' }
];

describe("a reader row's values at any depth, each drawn by a control of its own", () => {
    it.each(CONSTANTS)(
        'draws $name constant value as its text, and saves it and a text typed over it in its type',
        (one) => {
            const row = constantRowOf(one.held);
            const draft = draftFor(row);
            const steps = stepsTo(draft, 'mine', [
                ['fields', 'oa'],
                ['value', 0]
            ]);
            const last = steps[steps.length - 1];
            const path = steps.slice(0, -1);
            const card = path.reduce(
                (cards, step) => cardsOf(cards[step.index].fields[step.field]),
                draft.cards
            )[last.index];
            const edited = applyEdit(draft, {
                do: 'set',
                index: last.index,
                field: 'value',
                value: one.typed,
                path
            });
            expect(keptIn(draft.cards, row.key)).toEqual([]);
            expect(card.fields.value).toBe(one.shown);
            expect(draftValue(draft, row, lists)).toEqual({ ok: true, value: row.value });
            expect(draftValue(edited, row, lists)).toEqual({
                ok: true,
                value: [{ ...constantSource(one.held), fields: { oa: { value: one.saved } } }]
            });
        }
    );

    it.each([
        ['a boolean', true],
        ['a number', 7]
    ])(
        'keeps %s that a text field holds as the file has it, and draws no box for it',
        (_n, held) => {
            const source = { ...constantSource('x'), name: held };
            const row = sourceRowOf(source);
            const draft = draftFor(row);
            const card = draft.cards.find((one) => one.fields.key === 'mine');
            expect(card?.fields.name).toBeUndefined();
            expect(keptIn(draft.cards, row.key)).toEqual([`${row.key}[0].name`]);
            expect(draftValue(draft, row, lists)).toEqual({ ok: true, value: [source] });
        }
    );

    it.each(ALL_ROWS)('draws every value of %s and keeps none as the file has it', (_name, of) => {
        const row = of();
        const draft = draftFor(row);
        expect(draft.cards.length).toBeGreaterThan(0);
        expect(Object.keys(draft.cards[0].fields).length).toBeGreaterThan(0);
        expect(keptIn(draft.cards, row.key)).toEqual([]);
        expect(draftValue(draft, row, lists)).toEqual({ ok: true, value: row.value });
    });

    it.each(NESTED)('saves $name changed, and the rest of the row as it was', (one) => {
        const row = rowOf(one.key);
        const draft = draftFor(row);
        const steps = stepsTo(draft, one.row, one.down);
        const last = steps[steps.length - 1];
        const edited = applyEdit(draft, {
            do: 'set',
            index: last.index,
            field: one.field,
            value: one.value,
            path: steps.slice(0, -1)
        });
        const value: unknown = structuredClone(row.value);
        const held = Array.isArray(value)
            ? (value as { key?: unknown }[]).find((record) => record.key === one.row)
            : value;
        setAt(held, one.held, one.saved ?? one.value);
        expect(draftValue(edited, row, lists)).toEqual({ ok: true, value });
    });
});

/** Lab's settings, read, with the fixture's Recover rows in force. */
const LAB_READ = {
    state: 'ready' as const,
    slice: { hub: 'lab', config: hubSlice(HELD) }
};

/** The workspace of the hubs `hub`, the primary, and `lab`. */
const GROUND: ScopeGround = {
    folders: [
        { key: 'hub', dir: '/w/hub', hub: true },
        { key: 'lab', dir: '/w/lab', hub: true }
    ],
    primary: 'hub',
    workspaceFile: '.oculus/workspaces/w.yml'
};

/** The row of a key in the Hub scope of `lab`, as the Settings view draws it there. */
function shownRow(key: string): ConfigRow {
    return hubRowOf(`${FILE}:${key}`, {
        hub: 'lab',
        read: LAB_READ,
        file: { text: text(ROWS_TEXT), present: true },
        primaryFile: ROWS_TEXT
    });
}

/** Whether a scope of the workspace draws the row of a key. */
function drawnIn(scope: Scope, key: string): boolean {
    const groups = settingsGroups(shipped, HELD, {
        hubFile: { text: text(ROWS_TEXT), present: true },
        workspace: null
    });
    const file = { name: 'f', present: true, blocked: null, digest: 'd' };
    return scopeGroups(groups, scope, GROUND, file)
        .flatMap((group) => group.sections.flatMap((section) => section.rows))
        .some((row) => row.kind === 'config' && row.id === `${FILE}:${key}`);
}

/** The fields of the row a Save adds: a source of its own. */
const ADDED: [string, string][] = [
    ['key', 'mine'],
    ['name', 'Mine'],
    ['format', 'json'],
    ['address', 'https://example.org/works'],
    ['records', 'items']
];

/** The keys of the changes the Save of a row with one row added holds, and the row it adds. */
function heldBy(row: ConfigRow): { keys: string[]; added: unknown } {
    const stage = memoryStage();
    const writer = createEditorWriter({
        stage,
        changed: () => undefined,
        ended: () => undefined,
        held: () => undefined,
        stale: () => false,
        lists: () => lists
    });
    let draft = applyEdit(draftFor(row), { do: 'add' });
    const index = draft.cards.length - 1;
    for (const [field, value] of ADDED)
        draft = applyEdit(draft, { do: 'set', index, field, value });
    writer.save(row, draft);
    const held = stage.held(row);
    const rows = held !== undefined && 'value' in held ? (held.value as unknown[]) : [];
    return { keys: [...stage.changes.keys()], added: rows.at(-1) };
}

describe('where a change to a sparse family is written, with a second hub in the workspace', () => {
    it("draws literature.sources in the Primary hub scope alone, its change held for the primary's file", () => {
        expect([
            drawnIn({ kind: 'primary' }, 'literature.sources'),
            drawnIn({ kind: 'hub', hub: 'lab' }, 'literature.sources')
        ]).toEqual([true, false]);
        expect(fileOf({ kind: 'primary' }, GROUND)).toBe('hub:hub');
        const row = shownRow('literature.sources');
        expect([row.hub, row.slot]).toEqual([undefined, undefined]);
        expect(row.place).toMatchObject({
            layer: 'hub',
            root: PRIMARY_ROOT,
            path: '.oculus/config.yml'
        });
        const held = heldBy(row);
        expect(held.keys).toEqual([`${FILE}:literature.sources`]);
        expect(held.added).toMatchObject({ key: 'mine', name: 'Mine' });
    });

    it("draws recover.sources in lab's Hub scope, its change held under lab for lab's file", () => {
        expect(drawnIn({ kind: 'hub', hub: 'lab' }, 'recover.sources')).toBe(true);
        expect(fileOf({ kind: 'hub', hub: 'lab' }, GROUND)).toBe('hub:lab');
        const row = shownRow('recover.sources');
        expect([row.hub, row.slot]).toEqual(['lab', 'lab']);
        expect(row.place).toMatchObject({ layer: 'hub', root: 'lab', path: '.oculus/config.yml' });
        const held = heldBy(row);
        expect(held.keys).toEqual([JSON.stringify([`${FILE}:recover.sources`, 'lab'])]);
        expect(held.added).toMatchObject({ key: 'mine', name: 'Mine' });
    });
});
