// Layer 2, client-state tests. What the readers of a tab's instance state in state/boards and
// state/forms answer for every kind of input a saved arrangement can hold: a list, null, a map with
// an own `__proto__` key, a state whose fields are each of the wrong type, and the edge values of
// the right type. The table is described in tests/state/shared/instance-fixture.ts.

import { describe, expect, it } from 'vitest';
import {
    parseCollectionState,
    emptyCollectionState
} from '../../../src/lib/state/boards/collection.ts';
import { parseBoardState } from '../../../src/lib/state/boards/board/state.ts';
import { parsePillarsState } from '../../../src/lib/state/boards/structure/lines.ts';
import { parseMapState } from '../../../src/lib/state/boards/structure/graph.ts';
import { parseOpenForms } from '../../../src/lib/state/forms/open-forms.ts';
import {
    createManifestDraft,
    parseManifestDraft
} from '../../../src/lib/state/forms/manifest-draft.ts';
import { ABSENT, checkReaders, type Reader } from './instance-fixture.ts';

const REVEAL = { reveal: 'r' };
const OPEN_FORMS = { adding: true, editing: 'e' };
const OPEN_FORMS_WRONG = { adding: 'yes', editing: 3 };
const SEARCH = { search: 'q' };

/** A manifest editor's store over one held instance state, recording what it writes back. */
function manifestStore(held: unknown) {
    const writes: unknown[] = [];
    const store = createManifestDraft(
        {
            instanceState: () => held,
            setInstanceState: (id, state) => writes.push(['set', id, state]),
            clearInstanceState: (id) => writes.push(['clear', id]),
            instanceKeys: () => []
        },
        () => null
    );
    return { store, writes };
}

const MANIFEST = { project: 'p', edits: { title: 't', count: 1 } };

const collectionFallback = {
    search: '',
    statuses: [],
    hidden: [],
    more: [],
    adding: false,
    editing: ''
};
const collectionValid = {
    search: 'q',
    statuses: ['open', 'done'],
    hidden: ['done'],
    more: ['e1'],
    adding: true,
    editing: 'e',
    reveal: 'r',
    lead: 'L'
};
const boardFallback = {
    mode: 'cards',
    search: '',
    filters: {},
    expanded: [],
    more: [],
    labels: 'short',
    stale: false,
    dated: false,
    hiddenTypes: []
};
const boardValid = {
    mode: 'list',
    search: 'q',
    filters: { status: ['active'], year: ['2026'] },
    expanded: ['a'],
    more: ['b'],
    labels: 'full',
    stale: true,
    dated: true,
    hiddenTypes: ['idea']
};
const boardFullFallback = {
    mode: 'cards',
    search: '',
    filters: {},
    expanded: [],
    more: [],
    labels: 'full',
    stale: false,
    dated: false,
    hiddenTypes: []
};
const boardFullValid = {
    mode: 'cards',
    search: '',
    filters: {},
    expanded: [],
    more: [],
    labels: 'short',
    stale: false,
    dated: false,
    hiddenTypes: []
};
const pillarsValid = { adding: true, editing: 'e', reveal: 'r' };
const mapFallback = {
    collaborators: false,
    enabled: [],
    linkMode: false,
    types: [],
    lines: [],
    connected: false
};
const mapValid = {
    collaborators: true,
    enabled: ['a'],
    linkMode: true,
    types: ['t'],
    lines: ['l'],
    connected: true,
    start: { key: 'k', seed: 4 }
};
const draftValid = { project: 'p', edits: { title: 't', count: 1 } };
const settledValid = [['set', 'i', { project: 'p', edits: { count: 1 } }]];

const READERS: Reader[] = [
    {
        name: 'parseCollectionState',
        read: parseCollectionState,
        valid: {
            ...SEARCH,
            statuses: ['open', 'done'],
            hidden: ['done'],
            more: ['e1'],
            ...REVEAL,
            lead: 'L',
            ...OPEN_FORMS
        },
        wrong: {
            statuses: 'x',
            hidden: {},
            more: 4,
            lead: 3
        },
        edge: {
            'empty strings': { search: '', reveal: '', lead: '', editing: '' },
            'blank reveal and lead': { reveal: ' ', lead: '  ' },
            'padded lead': { lead: ' x ' },
            'duplicates in lists': {
                statuses: ['a', 'a'],
                hidden: ['', ''],
                more: ['m', 'm']
            },
            'lists with other items': {
                statuses: [1, 'a', null, ['b']],
                hidden: [{}, 'h'],
                more: [NaN, Infinity, 'm']
            }
        },
        notMap: collectionFallback,
        answers: {
            'empty map': collectionFallback,
            'own __proto__ key': {
                search: 's',
                statuses: [],
                hidden: [],
                more: [],
                adding: true,
                editing: ''
            },
            'own __proto__ key alone': collectionFallback,
            valid: collectionValid,
            'wrong statuses': { ...collectionValid, statuses: [] },
            'wrong hidden': { ...collectionValid, hidden: [] },
            'wrong more': { ...collectionValid, more: [] },
            'wrong lead': {
                search: 'q',
                statuses: ['open', 'done'],
                hidden: ['done'],
                more: ['e1'],
                adding: true,
                editing: 'e',
                reveal: 'r'
            },
            'all wrong': collectionFallback,
            'empty strings': {
                ...collectionFallback,
                statuses: ['open', 'done'],
                hidden: ['done'],
                more: ['e1'],
                adding: true
            },
            'blank reveal and lead': {
                search: 'q',
                statuses: ['open', 'done'],
                hidden: ['done'],
                more: ['e1'],
                adding: true,
                editing: 'e',
                reveal: ' '
            },
            'padded lead': { ...collectionValid, lead: ' x ' },
            'duplicates in lists': {
                ...collectionValid,
                statuses: ['a', 'a'],
                hidden: ['', ''],
                more: ['m', 'm']
            },
            'lists with other items': {
                ...collectionValid,
                statuses: ['a'],
                hidden: ['h'],
                more: ['m']
            }
        }
    },
    {
        name: 'parseBoardState',
        read: (raw) => parseBoardState(raw),
        valid: {
            mode: 'list',
            labels: 'full',
            ...SEARCH,
            stale: true,
            dated: true,
            hiddenTypes: ['idea'],
            expanded: ['a'],
            more: ['b'],
            filters: { status: ['active'], year: ['2026'] }
        },
        wrong: {
            mode: 'grid',
            labels: 'wide',
            search: 3,
            stale: 'yes',
            dated: 1,
            hiddenTypes: 'x',
            expanded: {},
            more: 3,
            filters: []
        },
        edge: {
            'mode in capitals': { mode: 'List', labels: 'Full' },
            'filters of an unknown facet': { filters: { nope: ['a'], status: ['s'] } },
            'filters with an empty list': { filters: { status: [], year: ['y'] } },
            'filters with a string': { filters: { status: 'a', year: [1, 'y'] } },
            'filters with duplicates': { filters: { status: ['a', 'a'] } },
            'filters with an own __proto__ key': {
                filters: JSON.parse('{"__proto__":["a"],"status":["s"]}')
            },
            'no mode and no labels': { mode: ABSENT, labels: ABSENT }
        },
        notMap: boardFallback,
        answers: {
            'empty map': boardFallback,
            'own __proto__ key': { ...boardFallback, search: 's' },
            'own __proto__ key alone': boardFallback,
            valid: boardValid,
            'wrong mode': { ...boardValid, mode: 'cards' },
            'wrong labels': { ...boardValid, labels: 'short' },
            'wrong search': { ...boardValid, search: '' },
            'wrong stale': { ...boardValid, stale: false },
            'wrong dated': { ...boardValid, dated: false },
            'wrong hiddenTypes': { ...boardValid, hiddenTypes: [] },
            'wrong expanded': { ...boardValid, expanded: [] },
            'wrong more': { ...boardValid, more: [] },
            'wrong filters': { ...boardValid, filters: {} },
            'all wrong': boardFallback,
            'mode in capitals': { ...boardValid, mode: 'cards', labels: 'short' },
            'filters of an unknown facet': { ...boardValid, filters: { status: ['s'] } },
            'filters with an empty list': { ...boardValid, filters: { year: ['y'] } },
            'filters with a string': { ...boardValid, filters: { year: ['y'] } },
            'filters with duplicates': { ...boardValid, filters: { status: ['a', 'a'] } },
            'filters with an own __proto__ key': { ...boardValid, filters: { status: ['s'] } },
            'no mode and no labels': { ...boardValid, mode: 'cards', labels: 'short' }
        }
    },
    {
        name: 'parseBoardState with the full labels',
        read: (raw) => parseBoardState(raw, 'full'),
        valid: { mode: 'cards', labels: 'short', filters: {} },
        wrong: { mode: 3, labels: 3, filters: 'x' },
        edge: { 'no labels': { labels: ABSENT } },
        notMap: boardFullFallback,
        answers: {
            'empty map': boardFullFallback,
            'own __proto__ key': { ...boardFullFallback, search: 's' },
            'own __proto__ key alone': boardFullFallback,
            valid: boardFullValid,
            'wrong mode': boardFullValid,
            'wrong labels': boardFullFallback,
            'wrong filters': boardFullValid,
            'all wrong': boardFullFallback,
            'no labels': boardFullFallback
        }
    },
    {
        name: 'parsePillarsState',
        read: parsePillarsState,
        valid: { ...OPEN_FORMS, ...REVEAL },
        wrong: { reveal: 3 },
        edge: { 'another key': { search: 'q' } },
        notMap: { adding: false, editing: '' },
        answers: {
            'empty map': { adding: false, editing: '' },
            'own __proto__ key': { adding: true, editing: '' },
            'own __proto__ key alone': { adding: false, editing: '' },
            valid: pillarsValid,
            'wrong reveal': { adding: true, editing: 'e' },
            'all wrong': { adding: false, editing: '' },
            'another key': pillarsValid
        }
    },
    {
        name: 'parseMapState',
        read: parseMapState,
        valid: {
            collaborators: true,
            enabled: ['a'],
            linkMode: true,
            types: ['t'],
            lines: ['l'],
            connected: true,
            start: { key: 'k', seed: 4 }
        },
        wrong: {
            collaborators: 'yes',
            enabled: 'x',
            linkMode: 1,
            types: {},
            lines: 3,
            connected: 'true',
            start: 's'
        },
        edge: {
            'start seed negative': { start: { key: 'k', seed: -1 } },
            'start seed fractional': { start: { key: 'k', seed: 1.5 } },
            'start seed zero': { start: { key: 'k', seed: 0 } },
            'start seed the largest safe integer': {
                start: { key: 'k', seed: Number.MAX_SAFE_INTEGER }
            },
            'start seed beyond the safe integers': {
                start: { key: 'k', seed: Number.MAX_SAFE_INTEGER + 1 }
            },
            'start seed a string': { start: { key: 'k', seed: '4' } },
            'start key empty': { start: { key: '', seed: 4 } },
            'start key a number': { start: { key: 3, seed: 4 } },
            'start with another key': { start: { key: 'k', seed: 4, extra: 1 } },
            'no start': { start: ABSENT }
        },
        notMap: mapFallback,
        answers: {
            'empty map': mapFallback,
            'own __proto__ key': mapFallback,
            'own __proto__ key alone': mapFallback,
            valid: mapValid,
            'wrong collaborators': { ...mapValid, collaborators: false },
            'wrong enabled': { ...mapValid, enabled: [] },
            'wrong linkMode': { ...mapValid, linkMode: false },
            'wrong types': { ...mapValid, types: [] },
            'wrong lines': { ...mapValid, lines: [] },
            'wrong connected': { ...mapValid, connected: false },
            'wrong start': {
                collaborators: true,
                enabled: ['a'],
                linkMode: true,
                types: ['t'],
                lines: ['l'],
                connected: true
            },
            'all wrong': mapFallback,
            'start seed negative': {
                collaborators: true,
                enabled: ['a'],
                linkMode: true,
                types: ['t'],
                lines: ['l'],
                connected: true
            },
            'start seed fractional': {
                collaborators: true,
                enabled: ['a'],
                linkMode: true,
                types: ['t'],
                lines: ['l'],
                connected: true
            },
            'start seed zero': { ...mapValid, start: { key: 'k', seed: 0 } },
            'start seed the largest safe integer': {
                ...mapValid,
                start: { key: 'k', seed: 9007199254740991 }
            },
            'start seed beyond the safe integers': {
                collaborators: true,
                enabled: ['a'],
                linkMode: true,
                types: ['t'],
                lines: ['l'],
                connected: true
            },
            'start seed a string': {
                collaborators: true,
                enabled: ['a'],
                linkMode: true,
                types: ['t'],
                lines: ['l'],
                connected: true
            },
            'start key empty': { ...mapValid, start: { key: '', seed: 4 } },
            'start key a number': {
                collaborators: true,
                enabled: ['a'],
                linkMode: true,
                types: ['t'],
                lines: ['l'],
                connected: true
            },
            'start with another key': mapValid,
            'no start': {
                collaborators: true,
                enabled: ['a'],
                linkMode: true,
                types: ['t'],
                lines: ['l'],
                connected: true
            }
        }
    },
    {
        name: 'parseOpenForms',
        read: parseOpenForms,
        valid: OPEN_FORMS,
        wrong: OPEN_FORMS_WRONG,
        edge: {
            'empty editing': { editing: '' },
            'another key': { search: 'q', reveal: 'r' }
        },
        notMap: { adding: false, editing: '' },
        answers: {
            'empty map': { adding: false, editing: '' },
            'own __proto__ key': { adding: true, editing: '' },
            'own __proto__ key alone': { adding: false, editing: '' },
            valid: { adding: true, editing: 'e' },
            'wrong adding': { adding: false, editing: 'e' },
            'wrong editing': { adding: true, editing: '' },
            'all wrong': { adding: false, editing: '' },
            'empty editing': { adding: true, editing: '' },
            'another key': { adding: true, editing: 'e' }
        }
    },
    {
        name: 'parseManifestDraft',
        read: parseManifestDraft,
        valid: MANIFEST,
        wrong: { project: 3, edits: 'x' },
        edge: {
            'empty project': { project: '' },
            'edits a list': { edits: [] },
            'edits empty': { edits: {} },
            'edits with other values': { edits: { n: NaN, i: Infinity, o: { a: [1] }, e: '' } },
            'edits with an own __proto__ key': {
                edits: JSON.parse('{"__proto__":"x","a":1}')
            },
            'another key': { search: 'q' }
        },
        notMap: null,
        answers: {
            'empty map': null,
            'own __proto__ key': null,
            'own __proto__ key alone': null,
            valid: draftValid,
            'wrong project': null,
            'wrong edits': null,
            'all wrong': null,
            'empty project': null,
            'edits a list': null,
            'edits empty': { project: 'p', edits: {} },
            'edits with other values': {
                project: 'p',
                edits: { n: NaN, i: Infinity, o: { a: [1] }, e: '' }
            },
            'edits with an own __proto__ key': {
                project: 'p',
                edits: { ['__proto__']: 'x', a: 1 }
            },
            'another key': draftValid
        }
    }
];

describe('the empty collection state', () => {
    it('is what an empty map reads as', () => {
        expect(parseCollectionState({})).toStrictEqual(emptyCollectionState());
        expect(Object.keys(emptyCollectionState())).toStrictEqual(
            Object.keys(parseCollectionState(null))
        );
    });
});

describe('the manifest editor over a held instance state', () => {
    it('holds the edits of the draft for the project they were typed for', () => {
        expect(manifestStore(MANIFEST).store.manifestEdits('i', 'p')).toStrictEqual(MANIFEST.edits);
    });

    it.each([
        ['another project', MANIFEST, 'q'],
        ['an instance with no draft', null, 'p']
    ])('holds no edits for %s', (_name, held, project) => {
        expect(manifestStore(held).store.manifestEdits('i', project)).toStrictEqual({});
    });

    it.each([
        ['an edit that differs from the project', MANIFEST, true],
        ['an edit of a number', { ...MANIFEST, edits: { n: 0 } }, true],
        ['no edits', { ...MANIFEST, edits: {} }, false],
        [
            'edits of blank text',
            { ...MANIFEST, edits: { a: ' ', b: '', c: null, d: undefined } },
            false
        ],
        ['an instance with no draft', null, false]
    ])('is dirty over %s: %s', (_name, held, dirty) => {
        expect(manifestStore(held).store.manifestDirty('i')).toBe(dirty);
    });

    it.each([
        ['an edit the save took', MANIFEST, settledValid],
        ['no edits', { ...MANIFEST, edits: {} }, [['clear', 'i']]],
        [
            'edits of blank text',
            { ...MANIFEST, edits: { a: ' ', b: '', c: null, d: undefined } },
            [['clear', 'i']]
        ],
        ['an instance with no draft', null, []]
    ])('writes back, for %s, what is left of the draft', (_name, held, written) => {
        const { store, writes } = manifestStore(held);
        store.settleManifest('i', { title: 't' }, []);
        expect(writes).toStrictEqual(written);
    });
});

describe('the lists and maps a reader hands on', () => {
    it('keeps the values of the edits and copies the map itself', () => {
        const nested = { a: [1] };
        const raw = { project: 'p', edits: { nested } };
        const draft = parseManifestDraft(raw);
        expect(draft?.edits).not.toBe(raw.edits);
        expect(draft?.edits.nested).toBe(nested);
    });
});

checkReaders(READERS);
