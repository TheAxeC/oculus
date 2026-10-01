// Layer 4, test. What the readers of the file browser's instance state in state/sources/fs.ts
// answer for every kind of input a saved arrangement can hold: a list, null, a string, a map with
// an own `__proto__` key, a state whose fields are each of the wrong type, and the edge values of
// the right type. The table is described in tests/state/shared/instance-fixture.ts.

import { describe, expect, it } from 'vitest';
import {
    expandedOf,
    filesLineTyped,
    filesViewOf,
    followRevealed,
    followView,
    followsSession,
    patchedFilesView,
    revealAsked,
    withFollow,
    withFollowPin,
    type FsRoot
} from '../../../src/lib/state/sources/fs.ts';
import { ABSENT, checkReaders, type Reader } from './instance-fixture.ts';

const ROOTS: FsRoot[] = [{ key: 'hub', dir: '/d', fixed: true }];
const FOUND = { root: ROOTS[0], path: 'p' };

const VIEW = {
    expanded: ['hub:a', 'hub:a/b'],
    selected: { root: 'hub', path: 'a' },
    filter: 'f',
    collapsed: ['c'],
    form: 'bookmark',
    editing: 'e',
    typed: 't',
    opening: 2,
    reveal: { root: 'hub', path: 'a/b', asked: 3, settled: true },
    revealed: {
        kind: 'missing',
        asked: { root: 'hub', path: 'a' },
        shown: { root: 'hub', path: '' },
        error: 'x'
    },
    revealing: 3,
    note: 'n',
    said: 's',
    naming: { mode: 'file', root: 'hub', path: 'a' },
    hidden: true,
    ignored: true
};

const VIEW_WRONG = {
    expanded: 'x',
    selected: 'x',
    filter: 3,
    collapsed: {},
    form: 3,
    editing: 3,
    typed: 3,
    opening: '2',
    reveal: 'x',
    revealed: 'x',
    revealing: '3',
    note: 3,
    said: 3,
    naming: 3,
    hidden: 'yes',
    ignored: 1
};

/** A whole-number field laid out as the values a count can take. */
function counts(field: string): Record<string, Record<string, unknown>> {
    return {
        [`${field} zero`]: { [field]: 0 },
        [`${field} NaN`]: { [field]: NaN },
        [`${field} Infinity`]: { [field]: Infinity },
        [`${field} negative`]: { [field]: -1 },
        [`${field} fractional`]: { [field]: 1.5 },
        [`${field} the largest safe integer`]: { [field]: Number.MAX_SAFE_INTEGER },
        [`${field} beyond the safe integers`]: { [field]: Number.MAX_SAFE_INTEGER + 1 }
    };
}

const viewFallback = {
    expanded: [],
    selected: null,
    filter: '',
    collapsed: [],
    form: '',
    editing: '',
    typed: '',
    opening: 0,
    reveal: null,
    revealed: null,
    revealing: 0,
    note: '',
    said: '',
    naming: null,
    hidden: false,
    ignored: false
};
const viewValid = {
    expanded: ['hub:a', 'hub:a/b'],
    selected: { root: 'hub', path: 'a' },
    filter: 'f',
    collapsed: ['c'],
    form: 'bookmark',
    editing: 'e',
    typed: '',
    opening: 2,
    reveal: { root: 'hub', path: 'a/b', asked: 3, settled: true },
    revealed: {
        kind: 'missing',
        asked: { root: 'hub', path: 'a' },
        shown: { root: 'hub', path: '' },
        error: 'x'
    },
    revealing: 3,
    note: 'n',
    said: 's',
    naming: { mode: 'file', root: 'hub', path: 'a' },
    hidden: true,
    ignored: true
};
const askedFallback = {
    filter: '',
    reveal: { root: 'hub', path: 'b', asked: 1, settled: false },
    revealed: null,
    revealing: 1
};
const askedValid = {
    filter: '',
    revealing: 4,
    other: [1],
    reveal: { root: 'hub', path: 'b', asked: 4, settled: false },
    revealed: null
};
const patchedValid = { expanded: ['a'], filter: 'z', typed: '', other: 1 };
const followViewFallback = {
    following: false,
    dir: null,
    found: null,
    roots: [{ key: 'hub', dir: '/d', fixed: true }],
    top: null
};
const followViewValid = {
    following: true,
    dir: '/d/sub/dir',
    found: { root: { key: 'hub', dir: '/d', fixed: true }, path: 'sub/dir' },
    roots: [{ key: 'hub', dir: '/d', fixed: true }],
    top: { path: 'sub/dir', name: 'dir' }
};
const followNoDirFallback = {
    following: false,
    dir: null,
    found: null,
    roots: [{ key: 'hub', dir: '/d', fixed: true }],
    top: null
};
const followNoDirValid = { following: true, dir: null, found: null, roots: [], top: null };
const followValid = { follow: true, session: 's', expanded: ['a'] };
const pinFallback = { follow: true, session: 's2' };
const pinValid = { follow: true, expanded: ['a'], session: 's2' };
const pinNoneValid = { follow: true, expanded: ['a'] };
const revealedFollowValid = { expanded: ['hub:q', 'hub:p'], filter: 'f' };

const READERS: Reader[] = [
    {
        name: 'expandedOf',
        read: expandedOf,
        valid: { expanded: ['hub:a', 'hub:b'], filter: 'f' },
        wrong: { expanded: 'x' },
        edge: {
            'expanded with other items': { expanded: [1, 'a', null, ['b']] },
            'expanded with duplicates': { expanded: ['a', 'a'] },
            'expanded empty strings': { expanded: ['', ''] },
            'expanded empty': { expanded: [] },
            'no expanded': { expanded: ABSENT }
        },
        notMap: [],
        answers: {
            'empty map': [],
            'search 3, reveal empty': [],
            'search s, reveal r, lead space': [],
            'own __proto__ key': [],
            'own __proto__ key alone': [],
            valid: ['hub:a', 'hub:b'],
            'wrong expanded': [],
            'all wrong': [],
            'expanded with other items': ['a'],
            'expanded with duplicates': ['a', 'a'],
            'expanded empty strings': ['', ''],
            'expanded empty': [],
            'no expanded': []
        }
    },
    {
        name: 'filesViewOf',
        read: filesViewOf,
        valid: VIEW,
        wrong: VIEW_WRONG,
        edge: {
            'form root keeps typed and drops editing': { form: 'root' },
            'form workspace keeps typed and drops editing': { form: 'workspace' },
            'form empty': { form: '' },
            'form unknown': { form: 'folder' },
            'form bookmark without editing': { editing: ABSENT },
            'selected with an empty root': { selected: { root: '', path: 'a' } },
            'selected with an empty path': { selected: { root: 'hub', path: '' } },
            'selected with a numeric path': { selected: { root: 'hub', path: 3 } },
            'selected a list': { selected: [] },
            'selected null': { selected: null },
            'selected with another key': { selected: { root: 'hub', path: 'a', extra: 1 } },
            ...counts('opening'),
            ...counts('revealing'),
            'reveal asked zero': { reveal: { root: 'hub', path: 'a', asked: 0, settled: true } },
            'reveal asked NaN': { reveal: { root: 'hub', path: 'a', asked: NaN, settled: true } },
            'reveal with an empty root': {
                reveal: { root: '', path: 'a', asked: 1, settled: false }
            },
            'reveal settled a string': {
                reveal: { root: 'hub', path: 'a', asked: 1, settled: 'yes' }
            },
            'reveal without a path': { reveal: { root: 'hub', asked: 1, settled: false } },
            'reveal with another key': {
                reveal: { root: 'hub', path: 'a', asked: 1, settled: false, extra: 1 }
            },
            'revealed of the kind found': {
                revealed: { kind: 'found', asked: { root: 'hub', path: 'a' }, shown: null }
            },
            'revealed of the kind no-roots': {
                revealed: { kind: 'no-roots', asked: { root: 'hub', path: 'a' }, error: 'e' }
            },
            'revealed of an unknown kind': {
                revealed: { kind: 'lost', asked: { root: 'hub', path: 'a' } }
            },
            'revealed without asked': { revealed: { kind: 'found' } },
            'revealed with asked of the wrong type': { revealed: { kind: 'found', asked: 'a' } },
            'revealed with shown null': {
                revealed: { kind: 'unread', asked: { root: 'hub', path: 'a' }, shown: null }
            },
            'revealed with shown of the wrong type': {
                revealed: { kind: 'unread', asked: { root: 'hub', path: 'a' }, shown: 3 }
            },
            'revealed with an error of the wrong type': {
                revealed: { kind: 'unread', asked: { root: 'hub', path: 'a' }, error: 3 }
            },
            'revealed a list': { revealed: [] },
            'expanded with other items': { expanded: [1, 'a', null, ['b']] },
            'expanded with duplicates': { expanded: ['a', 'a'] },
            'collapsed with other items': { collapsed: ['', 2, 'c', 'c'] },
            'filter empty': { filter: '' },
            'no booleans': { hidden: ABSENT, ignored: ABSENT }
        },
        notMap: viewFallback,
        answers: {
            'empty map': viewFallback,
            'search 3, reveal empty': viewFallback,
            'search s, reveal r, lead space': viewFallback,
            'own __proto__ key': viewFallback,
            'own __proto__ key alone': viewFallback,
            valid: viewValid,
            'wrong expanded': { ...viewValid, expanded: [] },
            'wrong selected': { ...viewValid, selected: null },
            'wrong filter': { ...viewValid, filter: '' },
            'wrong collapsed': { ...viewValid, collapsed: [] },
            'wrong form': { ...viewValid, form: '', editing: '' },
            'wrong editing': { ...viewValid, editing: '' },
            'wrong typed': viewValid,
            'wrong opening': { ...viewValid, opening: 0 },
            'wrong reveal': { ...viewValid, reveal: null },
            'wrong revealed': { ...viewValid, revealed: null },
            'wrong revealing': { ...viewValid, revealing: 0 },
            'wrong note': { ...viewValid, note: '' },
            'wrong said': { ...viewValid, said: '' },
            'wrong naming': { ...viewValid, naming: null },
            'wrong hidden': { ...viewValid, hidden: false },
            'wrong ignored': { ...viewValid, ignored: false },
            'all wrong': viewFallback,
            'form root keeps typed and drops editing': {
                ...viewValid,
                form: 'root',
                editing: '',
                typed: 't'
            },
            'form workspace keeps typed and drops editing': {
                ...viewValid,
                form: 'workspace',
                editing: '',
                typed: 't'
            },
            'form empty': { ...viewValid, form: '', editing: '' },
            'form unknown': { ...viewValid, form: '', editing: '' },
            'form bookmark without editing': { ...viewValid, editing: '' },
            'selected with an empty root': { ...viewValid, selected: null },
            'selected with an empty path': { ...viewValid, selected: { root: 'hub', path: '' } },
            'selected with a numeric path': { ...viewValid, selected: null },
            'selected a list': { ...viewValid, selected: null },
            'selected null': { ...viewValid, selected: null },
            'selected with another key': viewValid,
            'opening zero': { ...viewValid, opening: 0 },
            'opening NaN': { ...viewValid, opening: 0 },
            'opening Infinity': { ...viewValid, opening: 0 },
            'opening negative': { ...viewValid, opening: 0 },
            'opening fractional': { ...viewValid, opening: 0 },
            'opening the largest safe integer': { ...viewValid, opening: 9007199254740991 },
            'opening beyond the safe integers': { ...viewValid, opening: 0 },
            'revealing zero': { ...viewValid, revealing: 0 },
            'revealing NaN': { ...viewValid, revealing: 0 },
            'revealing Infinity': { ...viewValid, revealing: 0 },
            'revealing negative': { ...viewValid, revealing: 0 },
            'revealing fractional': { ...viewValid, revealing: 0 },
            'revealing the largest safe integer': { ...viewValid, revealing: 9007199254740991 },
            'revealing beyond the safe integers': { ...viewValid, revealing: 0 },
            'reveal asked zero': { ...viewValid, reveal: null },
            'reveal asked NaN': { ...viewValid, reveal: null },
            'reveal with an empty root': { ...viewValid, reveal: null },
            'reveal settled a string': { ...viewValid, reveal: null },
            'reveal without a path': { ...viewValid, reveal: null },
            'reveal with another key': {
                ...viewValid,
                reveal: { root: 'hub', path: 'a', asked: 1, settled: false }
            },
            'revealed of the kind found': {
                ...viewValid,
                revealed: {
                    kind: 'found',
                    asked: { root: 'hub', path: 'a' },
                    shown: null,
                    error: ''
                }
            },
            'revealed of the kind no-roots': {
                ...viewValid,
                revealed: {
                    kind: 'no-roots',
                    asked: { root: 'hub', path: 'a' },
                    shown: null,
                    error: 'e'
                }
            },
            'revealed of an unknown kind': { ...viewValid, revealed: null },
            'revealed without asked': { ...viewValid, revealed: null },
            'revealed with asked of the wrong type': { ...viewValid, revealed: null },
            'revealed with shown null': {
                ...viewValid,
                revealed: {
                    kind: 'unread',
                    asked: { root: 'hub', path: 'a' },
                    shown: null,
                    error: ''
                }
            },
            'revealed with shown of the wrong type': {
                ...viewValid,
                revealed: {
                    kind: 'unread',
                    asked: { root: 'hub', path: 'a' },
                    shown: null,
                    error: ''
                }
            },
            'revealed with an error of the wrong type': {
                ...viewValid,
                revealed: {
                    kind: 'unread',
                    asked: { root: 'hub', path: 'a' },
                    shown: null,
                    error: ''
                }
            },
            'revealed a list': { ...viewValid, revealed: null },
            'expanded with other items': { ...viewValid, expanded: ['a'] },
            'expanded with duplicates': { ...viewValid, expanded: ['a', 'a'] },
            'collapsed with other items': { ...viewValid, collapsed: ['', 'c', 'c'] },
            'filter empty': { ...viewValid, filter: '' },
            'no booleans': { ...viewValid, hidden: false, ignored: false }
        }
    },
    {
        name: 'revealAsked',
        read: (raw) => revealAsked(raw, 'a/../b'),
        valid: { filter: 'f', revealing: 3, other: [1] },
        wrong: { filter: 3, revealing: '3', other: null },
        edge: {
            'revealing zero': { revealing: 0 },
            'revealing NaN': { revealing: NaN },
            'revealing Infinity': { revealing: Infinity },
            'revealing negative': { revealing: -1 },
            'revealing fractional': { revealing: 1.5 },
            'revealing beyond the safe integers': { revealing: Number.MAX_SAFE_INTEGER + 1 },
            'a reveal and an outcome held': {
                reveal: { root: 'hub', path: 'x', asked: 1, settled: true },
                revealed: { kind: 'found', asked: { root: 'hub', path: 'x' }, shown: null }
            }
        },
        notMap: askedFallback,
        answers: {
            'empty map': askedFallback,
            'search 3, reveal empty': {
                search: 3,
                reveal: { root: 'hub', path: 'b', asked: 1, settled: false },
                filter: '',
                revealed: null,
                revealing: 1
            },
            'search s, reveal r, lead space': {
                search: 's',
                reveal: { root: 'hub', path: 'b', asked: 1, settled: false },
                lead: ' ',
                filter: '',
                revealed: null,
                revealing: 1
            },
            'own __proto__ key': {
                ['__proto__']: { search: 'p', adding: true },
                search: 's',
                adding: true,
                filter: '',
                reveal: { root: 'hub', path: 'b', asked: 1, settled: false },
                revealed: null,
                revealing: 1
            },
            'own __proto__ key alone': {
                ['__proto__']: 'x',
                filter: '',
                reveal: { root: 'hub', path: 'b', asked: 1, settled: false },
                revealed: null,
                revealing: 1
            },
            valid: askedValid,
            'wrong filter': askedValid,
            'wrong revealing': {
                ...askedValid,
                revealing: 1,
                reveal: { root: 'hub', path: 'b', asked: 1, settled: false }
            },
            'wrong other': { ...askedValid, other: null },
            'all wrong': {
                ...askedValid,
                revealing: 1,
                other: null,
                reveal: { root: 'hub', path: 'b', asked: 1, settled: false }
            },
            'revealing zero': {
                ...askedValid,
                revealing: 1,
                reveal: { root: 'hub', path: 'b', asked: 1, settled: false }
            },
            'revealing NaN': {
                ...askedValid,
                revealing: 1,
                reveal: { root: 'hub', path: 'b', asked: 1, settled: false }
            },
            'revealing Infinity': {
                ...askedValid,
                revealing: 1,
                reveal: { root: 'hub', path: 'b', asked: 1, settled: false }
            },
            'revealing negative': {
                ...askedValid,
                revealing: 1,
                reveal: { root: 'hub', path: 'b', asked: 1, settled: false }
            },
            'revealing fractional': {
                ...askedValid,
                revealing: 1,
                reveal: { root: 'hub', path: 'b', asked: 1, settled: false }
            },
            'revealing beyond the safe integers': {
                ...askedValid,
                revealing: 1,
                reveal: { root: 'hub', path: 'b', asked: 1, settled: false }
            },
            'a reveal and an outcome held': askedValid
        }
    },
    {
        name: 'patchedFilesView',
        read: (raw) => patchedFilesView(raw, { filter: 'z', typed: '' }),
        valid: { expanded: ['a'], filter: 'f', typed: 't', other: 1 },
        wrong: { expanded: 'x', filter: 3, other: null },
        edge: { 'no filter': { filter: ABSENT } },
        notMap: { filter: 'z', typed: '' },
        answers: {
            'empty map': { filter: 'z', typed: '' },
            'search 3, reveal empty': { search: 3, reveal: '', filter: 'z', typed: '' },
            'search s, reveal r, lead space': {
                search: 's',
                reveal: 'r',
                lead: ' ',
                filter: 'z',
                typed: ''
            },
            'own __proto__ key': {
                ['__proto__']: { search: 'p', adding: true },
                search: 's',
                adding: true,
                filter: 'z',
                typed: ''
            },
            'own __proto__ key alone': { ['__proto__']: 'x', filter: 'z', typed: '' },
            valid: patchedValid,
            'wrong expanded': { expanded: 'x', filter: 'z', typed: '', other: 1 },
            'wrong filter': patchedValid,
            'wrong other': { expanded: ['a'], filter: 'z', typed: '', other: null },
            'all wrong': { expanded: 'x', filter: 'z', other: null, typed: '' },
            'no filter': { expanded: ['a'], typed: '', other: 1, filter: 'z' }
        }
    },
    {
        name: 'followsSession',
        read: followsSession,
        valid: { follow: true, session: 's' },
        wrong: { follow: 'yes', session: 3 },
        edge: {
            'follow false': { follow: false },
            'follow a number': { follow: 1 },
            'follow null': { follow: null },
            'no follow': { follow: ABSENT }
        },
        notMap: false,
        answers: {
            'empty map': false,
            'search 3, reveal empty': false,
            'search s, reveal r, lead space': false,
            'own __proto__ key': false,
            'own __proto__ key alone': false,
            valid: true,
            'wrong follow': false,
            'wrong session': true,
            'all wrong': false,
            'follow false': false,
            'follow a number': false,
            'follow null': false,
            'no follow': false
        }
    },
    {
        name: 'followView',
        read: (raw) => followView(raw, ROOTS, '/d/sub/dir'),
        valid: { follow: true },
        wrong: { follow: 'yes' },
        edge: { 'follow false': { follow: false } },
        notMap: followViewFallback,
        answers: {
            'empty map': followViewFallback,
            'search 3, reveal empty': followViewFallback,
            'search s, reveal r, lead space': followViewFallback,
            'own __proto__ key': followViewFallback,
            'own __proto__ key alone': followViewFallback,
            valid: followViewValid,
            'wrong follow': followViewFallback,
            'all wrong': followViewFallback,
            'follow false': followViewFallback
        }
    },
    {
        name: 'followView without a folder',
        read: (raw) => followView(raw, ROOTS, null),
        valid: { follow: true },
        wrong: { follow: 'yes' },
        notMap: followNoDirFallback,
        answers: {
            'empty map': followNoDirFallback,
            'search 3, reveal empty': followNoDirFallback,
            'search s, reveal r, lead space': followNoDirFallback,
            'own __proto__ key': followNoDirFallback,
            'own __proto__ key alone': followNoDirFallback,
            valid: followNoDirValid,
            'wrong follow': followNoDirFallback,
            'all wrong': followNoDirFallback
        }
    },
    {
        name: 'withFollow',
        read: (raw) => withFollow(raw, true),
        valid: { follow: false, session: 's', expanded: ['a'] },
        wrong: { follow: 'x', session: 3, expanded: 'x' },
        edge: { 'no follow': { follow: ABSENT } },
        notMap: { follow: true },
        answers: {
            'empty map': { follow: true },
            'search 3, reveal empty': { search: 3, reveal: '', follow: true },
            'search s, reveal r, lead space': { search: 's', reveal: 'r', lead: ' ', follow: true },
            'own __proto__ key': {
                ['__proto__']: { search: 'p', adding: true },
                search: 's',
                adding: true,
                follow: true
            },
            'own __proto__ key alone': { ['__proto__']: 'x', follow: true },
            valid: followValid,
            'wrong follow': followValid,
            'wrong session': { follow: true, session: 3, expanded: ['a'] },
            'wrong expanded': { follow: true, session: 's', expanded: 'x' },
            'all wrong': { follow: true, session: 3, expanded: 'x' },
            'no follow': { session: 's', expanded: ['a'], follow: true }
        }
    },
    {
        name: 'withFollowPin',
        read: (raw) => withFollowPin(raw, 's2'),
        valid: { follow: false, session: 's', expanded: ['a'] },
        wrong: { follow: 'x', session: 3, expanded: 'x' },
        edge: { 'no session': { session: ABSENT } },
        notMap: pinFallback,
        answers: {
            'empty map': pinFallback,
            'search 3, reveal empty': { search: 3, reveal: '', follow: true, session: 's2' },
            'search s, reveal r, lead space': {
                search: 's',
                reveal: 'r',
                lead: ' ',
                follow: true,
                session: 's2'
            },
            'own __proto__ key': {
                ['__proto__']: { search: 'p', adding: true },
                search: 's',
                adding: true,
                follow: true,
                session: 's2'
            },
            'own __proto__ key alone': { ['__proto__']: 'x', follow: true, session: 's2' },
            valid: pinValid,
            'wrong follow': pinValid,
            'wrong session': pinValid,
            'wrong expanded': { follow: true, expanded: 'x', session: 's2' },
            'all wrong': { follow: true, expanded: 'x', session: 's2' },
            'no session': pinValid
        }
    },
    {
        name: 'withFollowPin to none',
        read: (raw) => withFollowPin(raw, null),
        valid: { follow: false, session: 's', expanded: ['a'] },
        wrong: { follow: 'x', session: 3, expanded: 'x' },
        edge: { 'no session': { session: ABSENT } },
        notMap: { follow: true },
        answers: {
            'empty map': { follow: true },
            'search 3, reveal empty': { search: 3, reveal: '', follow: true },
            'search s, reveal r, lead space': { search: 's', reveal: 'r', lead: ' ', follow: true },
            'own __proto__ key': {
                ['__proto__']: { search: 'p', adding: true },
                search: 's',
                adding: true,
                follow: true
            },
            'own __proto__ key alone': { ['__proto__']: 'x', follow: true },
            valid: pinNoneValid,
            'wrong follow': pinNoneValid,
            'wrong session': pinNoneValid,
            'wrong expanded': { follow: true, expanded: 'x' },
            'all wrong': { follow: true, expanded: 'x' },
            'no session': pinNoneValid
        }
    },
    {
        name: 'followRevealed',
        read: (raw) => followRevealed(raw, FOUND),
        valid: { expanded: ['hub:q'], filter: 'f' },
        wrong: { expanded: 'x', filter: 3 },
        edge: {
            'the folder already open': { expanded: ['hub:q', 'hub:p'] },
            'expanded with other items': { expanded: [1, 'a', null, ['b']] },
            'no expanded': { expanded: ABSENT }
        },
        notMap: { expanded: ['hub:p'] },
        answers: {
            'empty map': { expanded: ['hub:p'] },
            'search 3, reveal empty': { search: 3, reveal: '', expanded: ['hub:p'] },
            'search s, reveal r, lead space': {
                search: 's',
                reveal: 'r',
                lead: ' ',
                expanded: ['hub:p']
            },
            'own __proto__ key': {
                ['__proto__']: { search: 'p', adding: true },
                search: 's',
                adding: true,
                expanded: ['hub:p']
            },
            'own __proto__ key alone': { ['__proto__']: 'x', expanded: ['hub:p'] },
            valid: revealedFollowValid,
            'wrong expanded': { expanded: ['hub:p'], filter: 'f' },
            'wrong filter': { expanded: ['hub:q', 'hub:p'], filter: 3 },
            'all wrong': { expanded: ['hub:p'], filter: 3 },
            'the folder already open': revealedFollowValid,
            'expanded with other items': { expanded: ['a', 'hub:p'], filter: 'f' },
            'no expanded': { filter: 'f', expanded: ['hub:p'] }
        }
    },
    {
        name: 'filesLineTyped',
        read: (raw) => filesLineTyped('files', raw),
        valid: { form: 'root', typed: 't' },
        wrong: { form: 3, typed: 3 },
        edge: {
            'typed spaces': { typed: '  ' },
            'typed empty': { typed: '' },
            'form workspace': { form: 'workspace' },
            'form bookmark': { form: 'bookmark' },
            'no form': { form: ABSENT }
        },
        notMap: false,
        answers: {
            'empty map': false,
            'search 3, reveal empty': false,
            'search s, reveal r, lead space': false,
            'own __proto__ key': false,
            'own __proto__ key alone': false,
            valid: true,
            'wrong form': false,
            'wrong typed': false,
            'all wrong': false,
            'typed spaces': false,
            'typed empty': false,
            'form workspace': true,
            'form bookmark': false,
            'no form': false
        }
    }
];

describe('the objects a file browser reader hands on', () => {
    it('keeps the lists and maps of the state it extends, and builds the rest', () => {
        const expanded = ['hub:a'];
        const other = { a: 1 };
        const kept = { expanded, other };
        for (const answer of [
            patchedFilesView(kept, { filter: 'z' }),
            revealAsked(kept, 'x'),
            withFollow(kept, true),
            withFollowPin(kept, 's')
        ]) {
            expect(answer).not.toBe(kept);
            expect((answer as Record<string, unknown>).expanded).toBe(expanded);
            expect((answer as Record<string, unknown>).other).toBe(other);
        }
    });

    it('answers a view of fresh lists and maps', () => {
        const input = {
            expanded: ['hub:a'],
            collapsed: ['c'],
            selected: { root: 'hub', path: 'a' },
            reveal: { root: 'hub', path: 'a', asked: 1, settled: false }
        };
        const view = filesViewOf(input);
        expect(view.expanded).not.toBe(input.expanded);
        expect(view.collapsed).not.toBe(input.collapsed);
        expect(view.selected).not.toBe(input.selected);
        expect(view.reveal).not.toBe(input.reveal);
    });

    it('hands the roots it was given back while the tab does not follow', () => {
        expect(followView({}, ROOTS, '/d/sub').roots).toBe(ROOTS);
        expect(followView({ follow: true }, ROOTS, '/d/sub').roots).not.toBe(ROOTS);
        expect(followView({ follow: true }, ROOTS, '/d/sub').found?.root).toBe(ROOTS[0]);
    });
});

checkReaders(READERS);
