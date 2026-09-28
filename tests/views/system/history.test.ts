// The History view: what one recorded change is drawn as, which rows a filter leaves, and which
// rows offer a control that puts the earlier value back.
//
// The rows are synthetic and put into the store by hand, so no case fetches anything; the catalog
// is the real one, which is what holds the words the view draws. What this does NOT cover: the
// press on the undo control, and what the server does with it, which is
// tests/routes/edit/write.test.ts's.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import History from '../../../src/lib/views/system/history/History.svelte';
import { filterOf, shown, undoSaid } from '../../../src/lib/views/system/history/rows.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { recordedKinds } from '../../fixtures/kinds.ts';
import type { Change } from '../../../src/lib/state/sessions/changes.svelte.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

const instance: Instance = { id: 'history-one', view: 'history', state: {} };

/** One change, with whatever the case cares about over the rest. */
function change(at: string, over: Partial<Change> = {}): Change {
    return {
        at,
        kind: 'manifest',
        file: 'projects/manuscripts/alpha/project.yml',
        key: 'alpha',
        field: 'status.line',
        before: 'the line',
        after: 'a new line',
        undo: 'field',
        ...over
    };
}

/** The view over rows the store is holding, with the instance state a case names. */
function drawn(rows: Change[], state: Record<string, unknown> = {}): string {
    client.changes.hold(rows);
    client.ui.setInstanceState(instance.id, state);
    return render(History, { context: clientContext(client), props: { instance } }).body;
}

describe('the rows fold', () => {
    it('shows a scalar whole and says how many things a list or a map holds', () => {
        expect(shown('a line')).toEqual({ text: 'a line', size: 0, empty: false });
        expect(shown(3)).toEqual({ text: '3', size: 0, empty: false });
        expect(shown(['one', 'two'])).toMatchObject({ size: 2, empty: false });
        expect(shown({ do: 'read it', done: true })).toMatchObject({ size: 2, empty: false });
        expect(shown(JSON.parse('null'))).toEqual({ text: '', size: 0, empty: true });
        expect(shown('')).toEqual({ text: '', size: 0, empty: true });
    });

    it('reads the filter out of whatever the instance state is', () => {
        expect(filterOf({ filter: 'tasks' })).toBe('tasks');
        expect(filterOf({})).toBe('');
        expect(filterOf(null)).toBe('');
        expect(filterOf('not a map')).toBe('');
    });
});

describe('what an undo is said to have done', () => {
    it('says the value is back only when the endpoint named a field it wrote', () => {
        expect(undoSaid({ ok: true, changed: ['status.line'] }, 'alpha / status.line')).toEqual({
            undone: true,
            said: catalog['history.undone'].replace('{0}', 'alpha / status.line')
        });
    });

    it('says nothing happened for an answer that named no field, whatever its status', () => {
        // The endpoint answers 400 `refused` for it, and a 200 that wrote no field is the same
        // thing to a reader: the value is not back either way.
        expect(undoSaid({ ok: false, changed: [], error: 'refused' }, 'x')).toEqual({
            undone: false,
            said: catalog['history.refused_write']
        });
        expect(undoSaid({ ok: true, changed: [] }, 'x')).toEqual({
            undone: false,
            said: catalog['history.refused_write']
        });
    });

    it('has a sentence of its own for every word the endpoint answers, and never the word', () => {
        for (const [word, key] of [
            ['moved', 'history.moved'],
            ['gone', 'history.gone'],
            ['unknown', 'history.unknown'],
            ['nothing', 'history.nothing']
        ]) {
            const outcome = undoSaid({ ok: false, changed: [], error: word }, 'x');
            expect(outcome).toEqual({ undone: false, said: catalog[key] });
            // the outcome is worded from the catalog, so the endpoint's own word is not in it
            expect(outcome.said).not.toContain(word);
        }
        // A refusal from before the undo branch, the token's, reads as its own sentence around the
        // reason, which is a sentence of the server's and not a word of the wire.
        const upstream = undoSaid(
            { ok: false, changed: [], error: 'the write token is missing or stale' },
            'x'
        );
        expect(upstream.said).toBe(
            catalog['history.refused'].replace('{0}', 'the write token is missing or stale')
        );
    });

    it('says a value is back in part when the writer wrote it but refused a field', () => {
        const partly = undoSaid(
            { ok: true, changed: ['entries'], refused: [{ field: 'meta', reason: 'not a list' }] },
            'x'
        );
        expect(partly).toEqual({
            undone: true,
            said: catalog['history.undone_partly'].replace('{0}', 'x').replace('{1}', '1')
        });
        expect(undoSaid({ ok: true, changed: ['entries'], refused: [] }, 'x').said).toBe(
            catalog['history.undone'].replace('{0}', 'x')
        );
    });
});

describe('the History view', () => {
    it('draws one row per change with the file, what it addressed and both values', () => {
        const body = drawn([change('2026-09-15T10:00:00.000Z')]);
        expect(body).toContain('data-change="2026-09-15T10:00:00.000Z"');
        expect(body).toContain('projects/manuscripts/alpha/project.yml');
        expect(body).toContain('alpha / status.line');
        expect(body).toContain('the line');
        expect(body).toContain('a new line');
        expect(body).toContain(catalog['history.before']);
        expect(body).toContain(catalog['history.after']);
    });

    it('offers the undo control on a row that can be taken back and on no other', () => {
        const body = drawn([
            change('a'),
            change('b', { undo: 'none', kind: 'new-idea', key: 'fresh', field: 'entries' })
        ]);
        const controls = body.split(catalog['history.undo']).length - 1;
        // The label is drawn once on the control and once in its tooltip.
        expect(controls).toBeGreaterThan(0);
        expect(body).toContain('Put back what alpha / status.line held before this write');
        // this write cannot be taken back, so no undo is offered over it
        expect(body).not.toContain('Put back what fresh / entries held before this write');
    });

    it('summarises a list or a map rather than drawing it, until the reader opens it', () => {
        const body = drawn([
            change('a', {
                kind: 'delete-entry',
                field: 'entries',
                before: { title: 'Another task', status: 'open' },
                after: null,
                undo: 'delete'
            })
        ]);
        expect(body).toContain(catalog['history.items']);
        expect(body).toContain(catalog['history.nothing_there']);
        // the row holds the deleted item, so there is no value to draw as what it became
        expect(body).not.toContain('data-value="a:before"');
    });

    it('names every kind of write in words, and never draws the wire word', () => {
        const kinds = recordedKinds();
        expect(kinds.length).toBeGreaterThan(0);
        const body = drawn(kinds.map((kind, at) => change(`k${at}`, { kind })));
        for (const kind of kinds) {
            const word = catalog[`history.kind_${kind.replaceAll('-', '_')}`];
            expect(word, `no word for ${kind}`).toBeDefined();
            expect(body).toContain(`>${word}</span>`);
        }
        // The kind is on the row as data for a test to select on, and never as the reader's word.
        expect(body).toContain('data-kind="new-entry"');
        // the kind is on the row as data for a test to select on, never as the reader's word
        expect(body).not.toContain('>new-entry</span>');
    });

    it('draws only the rows the filter leaves', () => {
        const rows = [
            change('a'),
            change('b', { file: 'tasks/tasks.yml', key: 'Review the draft', field: 'status' })
        ];
        const body = drawn(rows, { filter: 'tasks' });
        expect(body).toContain('data-change="b"');
        // the filter holds the rows whose file carries its text, and this one does not
        expect(body).not.toContain('data-change="a"');
    });

    it('says the log holds nothing when it holds nothing, and when the filter leaves nothing', () => {
        expect(drawn([])).toContain(catalog['history.none']);
        expect(drawn([change('a')], { filter: 'nonesuch' })).toContain(catalog['history.none']);
    });
});
