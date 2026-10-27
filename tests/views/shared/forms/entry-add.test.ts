// Layer 3, view-helper tests of the Adds of a collection, the Literature view, a lead and a Lit
// Watch paper. The client is a stub whose writes record the call and whose people are each hub's
// own; the Literature Add is given an address no source is asked about, so no request leaves the
// test.
//
// The guarded entry G8 is the describe 'the hub an Add writes to' and the describe 'the page an Add
// opens'. The collection's Add and the Literature view's Add ask the hub when more than one hub
// names the collection, the primary first and chosen, and write to the one hub that names it,
// primary or not, without asking; the Add of a lead and of a Lit Watch paper opens the page of the
// record the server answers it made, whichever hub that is.
//
// The guarded entry G134 is the describe 'what a collection Add asks and writes': each field by its
// type, a select as a pick of its options, a people field as a multi-pick of the hub's people, Lead
// starting at the user, and a body that holds a pick as its id, a multi-pick as its list of ids, a
// typed line trimmed and no field left empty that is not required; the Add of the hub asked handed
// back when it is not the hub whose choices the box offered; and whether the box's yes is on
// (`answered`), off while a required field, a typed line among them, is unanswered.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import type { SchemaField } from '../../../../src/lib/data/model/index.ts';
import type { ClientState } from '../../../../src/lib/state/client/context.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import { answered, type PromptField } from '../../../../src/lib/ui/forms/prompt.ts';
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

/** The people each hub's people collection holds, by key, as a person pick offers them. */
const PEOPLE: Record<string, { id: string; label: string }[]> = {
    [PRIMARY]: [
        { id: 'axel', label: 'Axel' },
        { id: 'amir', label: 'Amir' }
    ],
    lab: [{ id: 'lina', label: 'Lina' }]
};

/**
 * A client whose portfolio holds the collection in the hubs named, each carrying its hub's name,
 * the Literature collection keyed `literature` and naming the `literature` registry, whose user is
 * `self` and whose field choices are a field's options and each hub's people, and whose writes
 * record what they were asked and answer an entry written.
 */
function clientOf(hubs: string[], sent: Sent[], self: string[] = [`${PRIMARY}:axel`]): ClientState {
    const client = {
        fs: { primary: () => PRIMARY },
        selectors: {
            collectionsOfKey: (key: string) =>
                hubs.map((name) => ({ id: `${name}:${key}`, root: name })),
            registryCollections: (registry: string) =>
                hubs.map((name) => ({ id: `${name}:literature`, root: name, registry })),
            registryKey: () => 'literature',
            selfPeople: () => new Set(self),
            fieldChoices: (
                field: { options?: string[]; foreign_key?: string[] },
                _project: null,
                hub: string
            ) => [
                ...(field.options ?? []).map((one) => ({ id: one, label: one })),
                ...(field.foreign_key?.includes('people') === true ? (PEOPLE[hub] ?? []) : [])
            ]
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

/** The people fields of a tasks file: its lead, required, its collaborators and supervisors. */
const PEOPLE_FIELDS: SchemaField[] = [
    { field: 'lead', type: 'tags', foreign_key: ['people'], required: true },
    { field: 'collaborators', type: 'tags', foreign_key: ['people'] },
    { field: 'supervisors', type: 'tags', foreign_key: ['people'] }
];

/** A tasks file's schema: its key, title and status required, a field not asked, its people. */
const TASKS: SchemaField[] = [
    { field: 'key', type: 'text', primary_key: true, required: true },
    { field: 'title', type: 'text', display: 1, required: true },
    {
        field: 'status',
        type: 'select',
        options: ['todo', 'doing', 'done', 'dropped'],
        required: true
    },
    { field: 'note', type: 'textarea' },
    ...PEOPLE_FIELDS
];

/** How a box asks one field: a typed line, a pick or a multi-pick, and what it holds. */
function asked(field: PromptField): Record<string, unknown> {
    if (field.picked !== undefined) {
        return {
            label: field.label,
            multi: field.choices?.map((one) => one.id),
            picked: field.picked,
            required: field.required === true
        };
    }
    if (field.choices !== undefined) {
        return {
            label: field.label,
            pick: field.choices.map((one) => one.id),
            value: field.value,
            required: field.required === true
        };
    }
    return { label: field.label, line: field.value };
}

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
                ],
                empty: t('entry_form.add_hub_none'),
                required: true
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

describe('what a collection Add asks and writes', () => {
    it('asks a tasks Add its key and title as lines, its status as a pick and its people as multi-picks, Lead holding the user, and writes the picks and no empty field (G134)', async () => {
        const sent: Sent[] = [];
        const ask = collectionAsk(clientOf([PRIMARY], sent), 'tasks', TASKS, 'Tasks');
        const people = ['axel', 'amir'];
        expect(ask.fields.map(asked)).toEqual([
            { label: 'key', line: '' },
            { label: 'title', line: '' },
            {
                label: 'status',
                pick: ['todo', 'doing', 'done', 'dropped'],
                value: '',
                required: true
            },
            { label: 'lead', multi: people, picked: ['axel'], required: true },
            { label: 'collaborators', multi: people, picked: [], required: false },
            { label: 'supervisors', multi: people, picked: [], required: false }
        ]);
        const answer = await ask.submit(
            [' t1 ', 'T', 'todo', '', '', ''],
            [[], [], [], ['axel'], [], ['amir']]
        );
        expect(answer).toBe('');
        expect(sent).toEqual([
            {
                what: 'tasks',
                fields: {
                    key: 't1',
                    title: 'T',
                    status: 'todo',
                    lead: ['axel'],
                    supervisors: ['amir']
                },
                root: PRIMARY
            }
        ]);
    });

    it('writes nothing when the hub answered is not the one the box opened on, and hands back the Add of the hub answered, its people and the typed lines carried (G134)', async () => {
        const sent: Sent[] = [];
        const ask = collectionAsk(clientOf([PRIMARY, 'lab'], sent), 'tasks', TASKS, 'Tasks');
        const answer = await ask.submit(
            ['t1', 'T', 'todo', '', '', '', 'lab'],
            [[], [], [], ['axel'], [], [], []]
        );
        if (typeof answer === 'string') throw new Error(`expected an Add, got "${answer}"`);
        expect(sent).toEqual([]);
        expect(answer.fields.map(asked)).toEqual([
            { label: 'key', line: 't1' },
            { label: 'title', line: 'T' },
            {
                label: 'status',
                pick: ['todo', 'doing', 'done', 'dropped'],
                value: '',
                required: true
            },
            { label: 'lead', multi: ['lina'], picked: [], required: true },
            { label: 'collaborators', multi: ['lina'], picked: [], required: false },
            { label: 'supervisors', multi: ['lina'], picked: [], required: false },
            {
                label: t('entry_form.add_hub'),
                pick: [PRIMARY, 'lab'],
                value: 'lab',
                required: true
            }
        ]);
    });

    /** One field of a box, a multi-pick when `multi`, else a pick, required when `required`. */
    const field = (multi: boolean, required: boolean): PromptField => ({
        label: 'field',
        value: '',
        choices: [{ id: 'axel', label: 'Axel' }],
        empty: '',
        required,
        ...(multi ? { picked: [] } : {})
    });

    it.each([
        {
            name: 'a required multi-pick holding a pick',
            on: field(true, true),
            picked: ['axel'],
            yes: true
        },
        {
            name: 'a required multi-pick holding none',
            on: field(true, true),
            picked: [],
            yes: false
        },
        {
            name: 'a required pick at the empty choice',
            on: field(false, true),
            picked: [],
            yes: false
        },
        {
            name: 'an optional multi-pick holding none',
            on: field(true, false),
            picked: [],
            yes: true
        }
    ])('turns the yes on or off for $name (G134)', (row) => {
        expect(answered([row.on], [''], [row.picked])).toBe(row.yes);
    });

    it("keeps a tasks Add's yes off while its key or title is empty or only spaces, and turns it on once both hold text (G134)", () => {
        const ask = collectionAsk(clientOf([PRIMARY], [] as Sent[]), 'tasks', TASKS, 'Tasks');
        const picked = [[], [], [], ['axel'], [], []];
        const yes = (key: string, title: string): boolean =>
            answered(ask.fields, [key, title, 'todo', '', '', ''], picked);
        expect({
            keyEmpty: yes('', 'T'),
            keySpaces: yes('  ', 'T'),
            titleEmpty: yes('t1', ''),
            titleSpaces: yes('t1', ' '),
            both: yes('t1', 'T')
        }).toEqual({
            keyEmpty: false,
            keySpaces: false,
            titleEmpty: false,
            titleSpaces: false,
            both: true
        });
    });

    it('keeps the yes off while a required Lead typed as a list, in a hub with no people, is empty or only commas, and turns it on once it names a key (G134)', () => {
        const ask = collectionAsk(clientOf(['solo'], [] as Sent[]), 'tasks', TASKS, 'Tasks');
        expect(ask.fields.map((one) => one.label)).toEqual([
            'key',
            'title',
            'status',
            'lead',
            'collaborators',
            'supervisors'
        ]);
        const none = ask.fields.map(() => []);
        const yes = (lead: string): boolean =>
            answered(ask.fields, ['t1', 'T', 'todo', lead, '', ''], none);
        expect({
            empty: yes(''),
            spaces: yes('  '),
            commas: yes(' , ,'),
            named: yes('axel')
        }).toEqual({
            empty: false,
            spaces: false,
            commas: false,
            named: true
        });
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
        'opens %s under the id the server answers, not under the primary (G8)',
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

    it('opens no page for a lead the server answers with no id (G8)', async () => {
        const opened: unknown[] = [];
        await leadAsk(openingClient({ ok: true, refused: [] }, opened)).submit(['A lead']);
        expect(opened).toEqual([]);
    });
});
