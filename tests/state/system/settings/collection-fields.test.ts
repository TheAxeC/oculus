// Layer 2, client state tests. The `collections:` row of sources.yml as the family editor holds it
// (state/system/config/editors/draft.ts): an entry's `ticker:` one card of its two fields, a choice
// of the words of `ticker_categories` and a toggle (`holds: record`), and its `dissemination_skip:`
// one card per field and value (`key` and `value`, a value a text or a list of texts). Each is
// edited with the presses the editor sends and read back into the value Save writes, and the
// category is offered from the words of `ticker_categories` in force. The rows are read over
// oculus's own merged configuration.
//
// It does not cover the cards the editor draws (views/system/workbench/editors/Cards.svelte), which
// the look does, nor the server's write and refusal of the value (config-fit.ts), which
// tests/server/edit/config-value.test.ts holds. The editor writes a choice as it is picked, so a
// word the list does not offer is refused by the server's check, not by the draft.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { fileRows, type ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import {
    applyEdit,
    draftOf,
    draftValue,
    type Draft
} from '../../../../src/lib/state/system/config/editors/draft.ts';
import { cardsOf, poolOf } from '../../../../src/lib/state/system/config/editors/fields.ts';
import { listsOf } from '../../../../src/lib/state/system/config/editors/sources.ts';
import { shipped } from './fixture.ts';

const FILE = 'sources.yml';
const config = loadConfig(engineDir()).config;
const lists = listsOf({
    config,
    portfolio: null,
    views: [],
    tiers: null,
    themeClasses: [],
    codeThemeClasses: [],
    offers: { themes: [], icons: [] },
    folder: () => ({ state: 'ready', entries: [] })
});

/** The two entries the rows start from, as a hub's list writes them. */
const LIST = [
    {
        key: 'events',
        file: 'events.yml',
        dissemination: true,
        dissemination_skip: { role: 'attend' },
        ticker: { category: 'event' }
    },
    { key: 'tasks', file: 'tasks.yml', tasks: true, ticker: { category: 'task', undated: true } }
];

/** The `collections` row with `list` in force. */
function rowOf(list: unknown): ConfigRow {
    const read = fileRows(
        FILE,
        shipped[FILE],
        { ...config, collections: list },
        { workspace: null }
    );
    const row = read.rows.find((one) => one.key === 'collections');
    if (row === undefined) throw new Error('no collections row');
    return row;
}

/** The draft of a row, which every row here has. */
function draftFor(row: ConfigRow): Draft {
    const draft = draftOf(row);
    if (draft === null) throw new Error('no draft');
    return draft;
}

describe('the ticker and the skip of a collections entry in the family editor', () => {
    it('holds a ticker as one card of its two fields and a skip as a card per field', () => {
        const draft = draftFor(rowOf(LIST));
        const [events, tasks] = draft.cards;
        expect(cardsOf(events.fields.ticker).map((card) => card.fields)).toEqual([
            { category: 'event' }
        ]);
        expect(cardsOf(tasks.fields.ticker).map((card) => card.fields)).toEqual([
            { category: 'task', undated: true }
        ]);
        expect(cardsOf(events.fields.dissemination_skip).map((card) => card.fields)).toEqual([
            { key: 'role', value: 'attend' }
        ]);
        expect(cardsOf(tasks.fields.dissemination_skip)).toEqual([]);
        expect(draftValue(draft, rowOf(LIST), lists)).toEqual({ ok: true, value: LIST });
    });

    it('saves a ticker edited in its two fields as one record', () => {
        const row = rowOf(LIST);
        const ticker = [{ index: 0, field: 'ticker' }];
        let draft = draftFor(row);
        draft = applyEdit(draft, {
            do: 'set',
            path: ticker,
            index: 0,
            field: 'category',
            value: 'conference'
        });
        draft = applyEdit(draft, {
            do: 'set',
            path: ticker,
            index: 0,
            field: 'undated',
            value: true
        });
        const made = draftValue(draft, row, lists);
        expect(made.ok && (made.value as typeof LIST)[0].ticker).toEqual({
            category: 'conference',
            undated: true
        });
    });

    it("offers the ticker's category from the words of ticker_categories in force", () => {
        const spec = rowOf(LIST).fields.ticker.fields?.category;
        if (spec === undefined) throw new Error('no category field');
        expect(poolOf(spec, {}, lists).items).toEqual(
            Object.keys(config.ticker_categories as Record<string, unknown>)
        );
    });

    it('adds a ticker to an entry with none, and leaves it out when its card is removed', () => {
        const row = rowOf([{ key: 'notes', file: 'notes.yml' }]);
        const ticker = [{ index: 0, field: 'ticker' }];
        let draft = applyEdit(draftFor(row), { do: 'add', path: ticker });
        draft = applyEdit(draft, {
            do: 'set',
            path: ticker,
            index: 0,
            field: 'category',
            value: 'task'
        });
        expect(draftValue(draft, row, lists)).toEqual({
            ok: true,
            value: [{ key: 'notes', file: 'notes.yml', ticker: { category: 'task' } }]
        });
        draft = applyEdit(draft, { do: 'remove', path: ticker, index: 0 });
        expect(draftValue(draft, row, lists)).toEqual({
            ok: true,
            value: [{ key: 'notes', file: 'notes.yml' }]
        });
    });

    it('saves a skip with a field added that holds a list of values', () => {
        const row = rowOf(LIST);
        const skip = [{ index: 0, field: 'dissemination_skip' }];
        let draft = applyEdit(draftFor(row), { do: 'add', path: skip });
        draft = applyEdit(draft, { do: 'set', path: skip, index: 1, field: 'key', value: 'kind' });
        draft = applyEdit(draft, {
            do: 'set',
            path: skip,
            index: 1,
            field: 'value',
            value: ['poster', 'demo']
        });
        const made = draftValue(draft, row, lists);
        expect(made.ok && (made.value as typeof LIST)[0].dissemination_skip).toEqual({
            role: 'attend',
            kind: ['poster', 'demo']
        });
    });

    it('stops a skip whose field is empty or named twice', () => {
        const row = rowOf(LIST);
        const skip = [{ index: 0, field: 'dissemination_skip' }];
        let draft = applyEdit(draftFor(row), { do: 'add', path: skip });
        expect(draftValue(draft, row, lists).ok).toBe(false);
        draft = applyEdit(draft, { do: 'set', path: skip, index: 1, field: 'key', value: 'role' });
        expect(draftValue(draft, row, lists).ok).toBe(false);
    });
});
