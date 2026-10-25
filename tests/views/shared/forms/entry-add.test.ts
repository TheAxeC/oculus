// Layer 3, view-helper tests. Which hub an Add writes to (G8): the collection's Add and the
// Literature view's Add ask the hub when more than one hub names the collection, the primary first
// and chosen, and write to the one hub that names it, primary or not, without asking. The client
// is a stub whose writes record the call; the Literature Add is given an address no source is
// asked about, so no request leaves the test. The Add of a lead and of a Lit Watch paper opens the
// page of the record the server answers it made, whichever hub that is.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import type { SchemaField } from '../../../../src/lib/data/model/index.ts';
import type { ClientState } from '../../../../src/lib/state/client/context.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import {
    collectionAsk,
    leadAsk,
    literatureAsk,
    paperAsk,
    type Ask
} from '../../../../src/lib/views/shared/forms/entry/entry-add.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** The primary hub's name. */
const PRIMARY = 'main';

/** One write the stub was asked to make: the collection or source, the fields, the hub. */
type Sent = { what: string; fields: unknown; root: string | undefined };

/**
 * A client whose portfolio holds the collection in the hubs named, each carrying its hub's name,
 * and whose writes record what they were asked and answer an entry written.
 */
function clientOf(hubs: string[], sent: Sent[]): ClientState {
    const client = {
        fs: { primary: () => PRIMARY },
        selectors: {
            collectionsOfKey: () => hubs.map((name) => ({ root: name }))
        },
        writes: {
            writeToken: () => 'token',
            newEntry: (collection: string, fields: unknown, root?: string) => {
                sent.push({ what: collection, fields, root });
                return Promise.resolve({ ok: true, id: 'k1', refused: [] });
            },
            saveLiterature: (source: string, paper: unknown, root?: string) => {
                sent.push({ what: source, fields: paper, root });
                return Promise.resolve({ ok: true, id: 'k1', refused: [] });
            }
        },
        layout: { openView: () => Promise.resolve() }
    };
    return client as unknown as ClientState;
}

const EDUCATION: SchemaField[] = [{ field: 'title', type: 'text', required: true }];

/** The Literature Add over the hubs named, its empty answer an Add that is never reached. */
function literatureOf(hubs: string[], sent: Sent[]): Ask {
    const plain = (): Ask => ({ message: 'plain', fields: [], submit: () => Promise.resolve('') });
    return literatureAsk(clientOf(hubs, sent), plain);
}

describe('the hub an Add writes to', () => {
    it.each([
        { name: 'a second hub', hubs: ['lab'], root: 'lab' },
        { name: 'the primary', hubs: [PRIMARY], root: PRIMARY }
    ])(
        "asks no hub and writes the collection's entry to the one hub naming it, $name (G8)",
        async (row) => {
            const sent: Sent[] = [];
            const ask = collectionAsk(
                clientOf(row.hubs, sent),
                'education',
                EDUCATION,
                'Education'
            );
            expect(ask.fields.map((one) => one.label)).toEqual(['title']);
            expect(await ask.submit(['A course'])).toBe('');
            expect(sent).toEqual([
                { what: 'education', fields: { title: 'A course' }, root: row.root }
            ]);
        }
    );

    it('asks the hub of a Literature Add when two hubs name Literature, the primary chosen, and saves to the hub chosen (G8)', async () => {
        const sent: Sent[] = [];
        const ask = literatureOf([PRIMARY, 'lab'], sent);
        expect(ask.fields).toEqual([
            { label: t('entry_form.add_literature_value'), value: '' },
            {
                label: t('entry_form.add_hub'),
                value: PRIMARY,
                choices: [
                    { id: PRIMARY, label: PRIMARY },
                    { id: 'lab', label: 'lab' }
                ]
            }
        ]);
        expect(await ask.submit(['https://example.org/notes', 'lab'])).toBe('');
        expect(sent).toEqual([
            { what: 'hand', fields: { url: 'https://example.org/notes' }, root: 'lab' }
        ]);
    });

    it("turns an empty Literature Add into the collection's Add with the hub chosen in it, and writes there (G8)", async () => {
        const sent: Sent[] = [];
        const client = clientOf([PRIMARY, 'lab'], sent);
        const ask = literatureAsk(client, (chosen) =>
            collectionAsk(client, 'literature', EDUCATION, 'Literature', chosen)
        );
        const plain = await ask.submit(['', 'lab']);
        if (typeof plain === 'string') throw new Error(`expected an Add, got "${plain}"`);
        expect(plain.fields.map((one) => [one.label, one.value])).toEqual([
            ['title', ''],
            [t('entry_form.add_hub'), 'lab']
        ]);
        expect(await plain.submit(['A paper', 'lab'])).toBe('');
        expect(sent).toEqual([{ what: 'literature', fields: { title: 'A paper' }, root: 'lab' }]);
    });

    it('asks no hub of a Literature Add and saves to the one hub naming Literature, a second hub (G8)', async () => {
        const sent: Sent[] = [];
        const ask = literatureOf(['lab'], sent);
        expect(ask.fields.map((one) => one.label)).toEqual([t('entry_form.add_literature_value')]);
        expect(await ask.submit(['https://example.org/notes'])).toBe('');
        expect(sent).toEqual([
            { what: 'hand', fields: { url: 'https://example.org/notes' }, root: 'lab' }
        ]);
    });
});

/**
 * A client whose lead and Lit Watch writes answer `answer` and whose layout records each view it
 * is asked to open, with the primary hub `main`.
 */
function openingClient(answer: Record<string, unknown>, opened: unknown[]): ClientState {
    const client = {
        fs: { primary: () => PRIMARY, roots: () => [{ key: PRIMARY, hub: true }] },
        entities: { config: () => null },
        writes: {
            addLead: () => Promise.resolve(answer),
            addRadarEntry: () => Promise.resolve(answer)
        },
        layout: {
            openView: (view: string, state: unknown) => {
                opened.push([view, state]);
                return Promise.resolve();
            }
        }
    };
    return client as unknown as ClientState;
}

describe('the page an Add opens', () => {
    it.each([
        ['a lead', 'leads', (client: ClientState) => leadAsk(client).submit(['A lead'])],
        [
            'a Lit Watch paper',
            'radar',
            (client: ClientState) => paperAsk(client).submit(['A lead', 'https://example.org', ''])
        ]
    ])(
        'opens %s under the id the server answers, not under the primary',
        async (_name, collection, add) => {
            const opened: unknown[] = [];
            expect(
                await add(openingClient({ ok: true, id: 'lab:A lead', refused: [] }, opened))
            ).toBe('');
            expect(opened).toEqual([
                ['entry', { collection, hub: 'lab', key: 'A lead', label: 'A lead' }]
            ]);
        }
    );

    it('opens no page for a lead the server answers with no id', async () => {
        const opened: unknown[] = [];
        await leadAsk(openingClient({ ok: true, refused: [] }, opened)).submit(['A lead']);
        expect(opened).toEqual([]);
    });
});
