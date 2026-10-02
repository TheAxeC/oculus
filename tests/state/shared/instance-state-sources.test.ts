// Layer 4, test. What the readers of a tab's instance state in state/sources (the datasets, the
// venues and the repositories) answer for every kind of input a saved arrangement can hold: a
// list, null, a string, a map with an own `__proto__` key, a state whose fields are each of the
// wrong type, and the edge values of the right type. The table is described in
// tests/state/shared/instance-fixture.ts.

import { describe, expect, it } from 'vitest';
import { parseDataState } from '../../../src/lib/state/sources/datasets.ts';
import {
    diffViewOf,
    heldDiff,
    repositoriesViewOf
} from '../../../src/lib/state/sources/repositories/repositories.ts';
import { parseVenuesState } from '../../../src/lib/state/sources/venues.ts';
import { ABSENT, checkReaders, type Reader } from './instance-fixture.ts';

const OPEN_FORMS = { adding: true, editing: 'e' };
const OPEN_FORMS_WRONG = { adding: 'yes', editing: 3 };

const dataFallback = { search: '', off: [], adding: false, editing: '' };
const dataValid = { search: 'q', off: ['open', 'closed'], adding: true, editing: 'e', reveal: 'r' };
const venuesFallback = {
    search: '',
    off: [],
    journalsOpen: true,
    conferencesOpen: true,
    adding: false,
    editing: ''
};
const venuesValid = {
    search: 'q',
    off: ['a'],
    journalsOpen: false,
    conferencesOpen: false,
    adding: true,
    editing: 'e',
    reveal: 'r'
};
const heldDiffFallback = {
    id: '',
    label: '',
    root: '',
    path: '',
    staged: false,
    worktree: false,
    commit: '',
    save: '',
    stash: '',
    group: undefined,
    against: undefined,
    line: 0,
    session: ''
};
const heldDiffValid = {
    id: 'i',
    label: 'l',
    root: 'r',
    path: 'p',
    staged: true,
    worktree: true,
    commit: 'c',
    save: 'v',
    stash: 's',
    group: 'staged',
    against: { root: 'a', path: 'b' },
    line: 4,
    session: 's-1'
};
const diffViewFallback = { mode: 'side', views: {}, unchanged: 'folded', folded: [] };
const diffViewValid = {
    mode: 'inline',
    views: { 'a.ts': { scroll: 1 }, 'b.ts': {} },
    unchanged: 'shown',
    folded: ['a.ts']
};
const diffPathsFallback = { mode: 'side', views: {}, unchanged: 'folded', folded: [] };
const diffPathsValid = {
    mode: 'inline',
    views: { 'a.ts': { scroll: 1 }, 'c.ts': { scroll: 2 } },
    unchanged: 'shown',
    folded: ['a.ts']
};
const diffNoPathsFallback = { mode: 'side', views: {}, unchanged: 'folded', folded: [] };
const reposFallback = { root: '', collapsed: [], commit: '', mode: 'list', reveal: '' };
const reposValid = { root: 'r', collapsed: ['c'], commit: 'k', mode: 'tree', reveal: 'branches' };

const READERS: Reader[] = [
    {
        name: 'parseDataState',
        read: parseDataState,
        valid: { search: 'q', off: ['open', 'closed'], ...OPEN_FORMS, reveal: 'r' },
        wrong: { search: 3, off: 'x', ...OPEN_FORMS_WRONG, reveal: 3 },
        edge: {
            'empty strings': { search: '', editing: '', reveal: '' },
            'blank reveal': { reveal: ' ' },
            'off with duplicates': { off: ['a', 'a', ''] },
            'off with other items': { off: [1, 'a', null, ['b']] },
            'off empty': { off: [] },
            'adding is a number': { adding: 1 },
            'no reveal': { reveal: ABSENT }
        },
        notMap: dataFallback,
        answers: {
            'empty map': dataFallback,
            'search 3, reveal empty': dataFallback,
            'search s, reveal r, lead space': {
                search: 's',
                off: [],
                adding: false,
                editing: '',
                reveal: 'r'
            },
            'own __proto__ key': { search: 's', off: [], adding: true, editing: '' },
            'own __proto__ key alone': dataFallback,
            valid: dataValid,
            'wrong search': {
                search: '',
                off: ['open', 'closed'],
                adding: true,
                editing: 'e',
                reveal: 'r'
            },
            'wrong off': { search: 'q', off: [], adding: true, editing: 'e', reveal: 'r' },
            'wrong adding': { ...dataValid, adding: false },
            'wrong editing': {
                search: 'q',
                off: ['open', 'closed'],
                adding: true,
                editing: '',
                reveal: 'r'
            },
            'wrong reveal': { search: 'q', off: ['open', 'closed'], adding: true, editing: 'e' },
            'all wrong': dataFallback,
            'empty strings': { search: '', off: ['open', 'closed'], adding: true, editing: '' },
            'blank reveal': { ...dataValid, reveal: ' ' },
            'off with duplicates': {
                search: 'q',
                off: ['a', 'a', ''],
                adding: true,
                editing: 'e',
                reveal: 'r'
            },
            'off with other items': {
                search: 'q',
                off: ['a'],
                adding: true,
                editing: 'e',
                reveal: 'r'
            },
            'off empty': { search: 'q', off: [], adding: true, editing: 'e', reveal: 'r' },
            'adding is a number': { ...dataValid, adding: false },
            'no reveal': { search: 'q', off: ['open', 'closed'], adding: true, editing: 'e' }
        }
    },
    {
        name: 'parseVenuesState',
        read: parseVenuesState,
        valid: {
            search: 'q',
            off: ['a'],
            journalsOpen: false,
            conferencesOpen: false,
            ...OPEN_FORMS,
            reveal: 'r'
        },
        wrong: {
            search: 3,
            off: 'x',
            journalsOpen: 'no',
            conferencesOpen: 0,
            ...OPEN_FORMS_WRONG,
            reveal: 3
        },
        edge: {
            'empty strings': { search: '', editing: '', reveal: '' },
            'blank reveal': { reveal: ' ' },
            'off with duplicates': { off: ['a', 'a', ''] },
            'off with other items': { off: [1, 'a', null, ['b']] },
            'journals and conferences open': { journalsOpen: true, conferencesOpen: true },
            'journals null': { journalsOpen: null },
            'no journals and no conferences': { journalsOpen: ABSENT, conferencesOpen: ABSENT },
            'adding is a number': { adding: 1 },
            'no reveal': { reveal: ABSENT }
        },
        notMap: venuesFallback,
        answers: {
            'empty map': venuesFallback,
            'search 3, reveal empty': venuesFallback,
            'search s, reveal r, lead space': {
                search: 's',
                off: [],
                journalsOpen: true,
                conferencesOpen: true,
                adding: false,
                editing: '',
                reveal: 'r'
            },
            'own __proto__ key': { ...venuesFallback, search: 's', adding: true },
            'own __proto__ key alone': venuesFallback,
            valid: venuesValid,
            'wrong search': { ...venuesValid, search: '' },
            'wrong off': { ...venuesValid, off: [] },
            'wrong journalsOpen': { ...venuesValid, journalsOpen: true },
            'wrong conferencesOpen': { ...venuesValid, conferencesOpen: true },
            'wrong adding': { ...venuesValid, adding: false },
            'wrong editing': { ...venuesValid, editing: '' },
            'wrong reveal': {
                search: 'q',
                off: ['a'],
                journalsOpen: false,
                conferencesOpen: false,
                adding: true,
                editing: 'e'
            },
            'all wrong': venuesFallback,
            'empty strings': {
                ...venuesFallback,
                off: ['a'],
                journalsOpen: false,
                conferencesOpen: false,
                adding: true
            },
            'blank reveal': { ...venuesValid, reveal: ' ' },
            'off with duplicates': { ...venuesValid, off: ['a', 'a', ''] },
            'off with other items': venuesValid,
            'journals and conferences open': {
                ...venuesValid,
                journalsOpen: true,
                conferencesOpen: true
            },
            'journals null': { ...venuesValid, journalsOpen: true },
            'no journals and no conferences': {
                ...venuesValid,
                journalsOpen: true,
                conferencesOpen: true
            },
            'adding is a number': { ...venuesValid, adding: false },
            'no reveal': {
                search: 'q',
                off: ['a'],
                journalsOpen: false,
                conferencesOpen: false,
                adding: true,
                editing: 'e'
            }
        }
    },
    {
        name: 'heldDiff',
        read: heldDiff,
        valid: {
            id: 'i',
            label: 'l',
            root: 'r',
            path: 'p',
            staged: true,
            worktree: true,
            commit: 'c',
            save: 'v',
            stash: 's',
            group: 'staged',
            against: { root: 'a', path: 'b' },
            line: 4,
            session: 's-1'
        },
        wrong: {
            id: 3,
            label: 3,
            root: 3,
            path: 3,
            staged: 'yes',
            worktree: 1,
            commit: 3,
            save: 3,
            stash: 3,
            group: 'both',
            against: 3,
            line: '4',
            session: 3
        },
        edge: {
            'group changed': { group: 'changed' },
            'group empty': { group: '' },
            'group null': { group: null },
            'line zero': { line: 0 },
            'line NaN': { line: NaN },
            'line Infinity': { line: Infinity },
            'line negative': { line: -1 },
            'line fractional': { line: 1.5 },
            'empty strings': {
                id: '',
                label: '',
                root: '',
                path: '',
                commit: '',
                save: '',
                stash: '',
                session: ''
            },
            'no booleans': { staged: ABSENT, worktree: ABSENT }
        },
        notMap: heldDiffFallback,
        answers: {
            'empty map': heldDiffFallback,
            'search 3, reveal empty': heldDiffFallback,
            'search s, reveal r, lead space': heldDiffFallback,
            'own __proto__ key': heldDiffFallback,
            'own __proto__ key alone': heldDiffFallback,
            valid: heldDiffValid,
            'wrong id': { ...heldDiffValid, id: '' },
            'wrong label': { ...heldDiffValid, label: '' },
            'wrong root': { ...heldDiffValid, root: '' },
            'wrong path': { ...heldDiffValid, path: '' },
            'wrong staged': { ...heldDiffValid, staged: false },
            'wrong worktree': { ...heldDiffValid, worktree: false },
            'wrong commit': { ...heldDiffValid, commit: '' },
            'wrong save': { ...heldDiffValid, save: '' },
            'wrong stash': { ...heldDiffValid, stash: '' },
            'wrong group': { ...heldDiffValid, group: undefined },
            'wrong against': { ...heldDiffValid, against: undefined },
            'wrong line': { ...heldDiffValid, line: 0 },
            'wrong session': { ...heldDiffValid, session: '' },
            'all wrong': heldDiffFallback,
            'group changed': { ...heldDiffValid, group: 'changed' },
            'group empty': { ...heldDiffValid, group: undefined },
            'group null': { ...heldDiffValid, group: undefined },
            'line zero': { ...heldDiffValid, line: 0 },
            'line NaN': { ...heldDiffValid, line: NaN },
            'line Infinity': { ...heldDiffValid, line: Infinity },
            'line negative': { ...heldDiffValid, line: -1 },
            'line fractional': { ...heldDiffValid, line: 1.5 },
            'empty strings': {
                ...heldDiffFallback,
                staged: true,
                worktree: true,
                group: 'staged',
                against: { root: 'a', path: 'b' },
                line: 4
            },
            'no booleans': { ...heldDiffValid, staged: false, worktree: false }
        }
    },
    {
        name: 'diffViewOf',
        read: (raw) => diffViewOf(raw),
        valid: {
            mode: 'inline',
            views: { 'a.ts': { scroll: 1 }, 'b.ts': {} },
            unchanged: 'shown',
            folded: ['a.ts']
        },
        wrong: { mode: 3, views: [], unchanged: 3, folded: 'x' },
        edge: {
            'mode side': { mode: 'side' },
            'mode in capitals': { mode: 'Inline' },
            'unchanged folded': { unchanged: 'folded' },
            'views with other values': { views: { a: 3, b: null, c: [], d: 'x', e: { k: 1 } } },
            'views empty': { views: {} },
            'views null': { views: null },
            'views with an own __proto__ key': {
                views: JSON.parse('{"__proto__":{"a":1},"b":{"c":2}}')
            },
            'folded with duplicates': { folded: ['a.ts', 'a.ts'] },
            'folded with other items': { folded: [1, 'a.ts', null, ['b']] },
            'folded empty': { folded: [] }
        },
        notMap: diffViewFallback,
        answers: {
            'empty map': diffViewFallback,
            'search 3, reveal empty': diffViewFallback,
            'search s, reveal r, lead space': diffViewFallback,
            'own __proto__ key': diffViewFallback,
            'own __proto__ key alone': diffViewFallback,
            valid: diffViewValid,
            'wrong mode': { ...diffViewValid, mode: 'side' },
            'wrong views': { mode: 'inline', views: {}, unchanged: 'shown', folded: ['a.ts'] },
            'wrong unchanged': { ...diffViewValid, unchanged: 'folded' },
            'wrong folded': { ...diffViewValid, folded: [] },
            'all wrong': diffViewFallback,
            'mode side': { ...diffViewValid, mode: 'side' },
            'mode in capitals': { ...diffViewValid, mode: 'side' },
            'unchanged folded': { ...diffViewValid, unchanged: 'folded' },
            'views with other values': {
                mode: 'inline',
                views: { e: { k: 1 } },
                unchanged: 'shown',
                folded: ['a.ts']
            },
            'views empty': { mode: 'inline', views: {}, unchanged: 'shown', folded: ['a.ts'] },
            'views null': { mode: 'inline', views: {}, unchanged: 'shown', folded: ['a.ts'] },
            'views with an own __proto__ key': {
                mode: 'inline',
                views: { b: { c: 2 } },
                unchanged: 'shown',
                folded: ['a.ts']
            },
            'folded with duplicates': { ...diffViewValid, folded: ['a.ts', 'a.ts'] },
            'folded with other items': diffViewValid,
            'folded empty': { ...diffViewValid, folded: [] }
        }
    },
    {
        name: 'diffViewOf over the paths of the diff',
        read: (raw) => diffViewOf(raw, ['a.ts', 'c.ts']),
        valid: {
            mode: 'inline',
            views: { 'a.ts': { scroll: 1 }, 'b.ts': {}, 'c.ts': { scroll: 2 } },
            unchanged: 'shown',
            folded: ['a.ts', 'b.ts']
        },
        wrong: { views: 'x', folded: {} },
        edge: {
            'views of other paths only': { views: { 'b.ts': {} } },
            'folded of other paths only': { folded: ['b.ts', 'd.ts'] },
            'folded with duplicates': { folded: ['a.ts', 'a.ts'] }
        },
        notMap: diffPathsFallback,
        answers: {
            'empty map': diffPathsFallback,
            'search 3, reveal empty': diffPathsFallback,
            'search s, reveal r, lead space': diffPathsFallback,
            'own __proto__ key': diffPathsFallback,
            'own __proto__ key alone': diffPathsFallback,
            valid: diffPathsValid,
            'wrong views': { mode: 'inline', views: {}, unchanged: 'shown', folded: ['a.ts'] },
            'wrong folded': { ...diffPathsValid, folded: [] },
            'all wrong': diffPathsFallback,
            'views of other paths only': {
                mode: 'inline',
                views: {},
                unchanged: 'shown',
                folded: ['a.ts']
            },
            'folded of other paths only': { ...diffPathsValid, folded: [] },
            'folded with duplicates': { ...diffPathsValid, folded: ['a.ts', 'a.ts'] }
        }
    },
    {
        name: 'diffViewOf over no paths',
        read: (raw) => diffViewOf(raw, []),
        valid: {
            views: { 'a.ts': { scroll: 1 } },
            folded: ['a.ts']
        },
        wrong: { views: 'x', folded: {} },
        notMap: diffNoPathsFallback,
        answers: {
            'empty map': diffNoPathsFallback,
            'search 3, reveal empty': diffNoPathsFallback,
            'search s, reveal r, lead space': diffNoPathsFallback,
            'own __proto__ key': diffNoPathsFallback,
            'own __proto__ key alone': diffNoPathsFallback,
            valid: diffNoPathsFallback,
            'wrong views': diffNoPathsFallback,
            'wrong folded': diffNoPathsFallback,
            'all wrong': diffNoPathsFallback
        }
    },
    {
        name: 'repositoriesViewOf',
        read: repositoriesViewOf,
        valid: { root: 'r', collapsed: ['c'], commit: 'k', mode: 'tree', reveal: 'branches' },
        wrong: { root: 3, collapsed: 'x', commit: 3, mode: 'grid', reveal: 'tags' },
        edge: {
            'mode list': { mode: 'list' },
            'mode in capitals': { mode: 'Tree' },
            'reveal empty': { reveal: '' },
            'reveal in capitals': { reveal: 'Branches' },
            'empty strings': { root: '', commit: '' },
            'collapsed with duplicates': { collapsed: ['c', 'c', ''] },
            'collapsed with other items': { collapsed: [1, 'c', null, ['d']] },
            'collapsed empty': { collapsed: [] },
            'no mode and no reveal': { mode: ABSENT, reveal: ABSENT }
        },
        notMap: reposFallback,
        answers: {
            'empty map': reposFallback,
            'search 3, reveal empty': reposFallback,
            'search s, reveal r, lead space': reposFallback,
            'own __proto__ key': reposFallback,
            'own __proto__ key alone': reposFallback,
            valid: reposValid,
            'wrong root': {
                root: '',
                collapsed: ['c'],
                commit: 'k',
                mode: 'tree',
                reveal: 'branches'
            },
            'wrong collapsed': {
                root: 'r',
                collapsed: [],
                commit: 'k',
                mode: 'tree',
                reveal: 'branches'
            },
            'wrong commit': {
                root: 'r',
                collapsed: ['c'],
                commit: '',
                mode: 'tree',
                reveal: 'branches'
            },
            'wrong mode': {
                root: 'r',
                collapsed: ['c'],
                commit: 'k',
                mode: 'list',
                reveal: 'branches'
            },
            'wrong reveal': { root: 'r', collapsed: ['c'], commit: 'k', mode: 'tree', reveal: '' },
            'all wrong': reposFallback,
            'mode list': {
                root: 'r',
                collapsed: ['c'],
                commit: 'k',
                mode: 'list',
                reveal: 'branches'
            },
            'mode in capitals': {
                root: 'r',
                collapsed: ['c'],
                commit: 'k',
                mode: 'list',
                reveal: 'branches'
            },
            'reveal empty': { root: 'r', collapsed: ['c'], commit: 'k', mode: 'tree', reveal: '' },
            'reveal in capitals': {
                root: 'r',
                collapsed: ['c'],
                commit: 'k',
                mode: 'tree',
                reveal: ''
            },
            'empty strings': {
                root: '',
                collapsed: ['c'],
                commit: '',
                mode: 'tree',
                reveal: 'branches'
            },
            'collapsed with duplicates': { ...reposValid, collapsed: ['c', 'c', ''] },
            'collapsed with other items': reposValid,
            'collapsed empty': {
                root: 'r',
                collapsed: [],
                commit: 'k',
                mode: 'tree',
                reveal: 'branches'
            },
            'no mode and no reveal': {
                root: 'r',
                collapsed: ['c'],
                commit: 'k',
                mode: 'list',
                reveal: ''
            }
        }
    }
];

describe('the objects a diff pane reader hands on', () => {
    it('hands on the view states of the paths it keeps, and a list and map of its own', () => {
        const scroll = { scroll: 1 };
        const input = { views: { 'a.ts': scroll }, folded: ['a.ts'] };
        const view = diffViewOf(input);
        expect(view.views).not.toBe(input.views);
        expect(view.views['a.ts']).toBe(scroll);
        expect(view.folded).not.toBe(input.folded);
    });
});

checkReaders(READERS);
