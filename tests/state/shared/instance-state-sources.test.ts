// Layer 2, client-state tests. What the readers of a tab's instance state in state/sources (the
// datasets, the venues and the repositories) answer for every kind of input a saved arrangement can
// hold: a list, null, a map with an own `__proto__` key, a state whose fields are each of the wrong
// type, and the edge values of the right type. The table is described in
// tests/state/shared/instance-fixture.ts.

import { describe, expect, it } from 'vitest';
import { parseDataState } from '../../../src/lib/state/sources/datasets.ts';
import {
    diffViewOf,
    heldDiff,
    repositoriesViewOf
} from '../../../src/lib/state/sources/repositories/repositories.ts';
import { parseVenuesState } from '../../../src/lib/state/sources/venues.ts';
import { checkReaders, type Reader } from './instance-fixture.ts';

const OPEN_FORMS = { adding: true, editing: 'e' };

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
const REPLACE_VALID = {
    query: { q: 'q', word: true, case: false, regex: true, under: 'src' },
    replace: 'r',
    preserveCase: true,
    hits: [{ line: 2, at: 5 }]
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
    compare: undefined,
    workspace: undefined,
    replace: undefined,
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
    compare: { from: 'f', to: 't' },
    workspace: true,
    replace: { ...REPLACE_VALID },
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
const reposFallback = {
    root: '',
    collapsed: [],
    commit: '',
    mode: 'list',
    reveal: '',
    closed: []
};
const reposValid = {
    root: 'r',
    collapsed: ['c'],
    commit: 'k',
    mode: 'tree',
    reveal: 'branches',
    closed: ['d']
};

const READERS: Reader[] = [
    {
        name: 'parseDataState',
        read: parseDataState,
        valid: { search: 'q', off: ['open', 'closed'], ...OPEN_FORMS, reveal: 'r' },
        wrong: { off: 'x' },
        notMap: dataFallback,
        answers: {
            'empty map': dataFallback,
            'own __proto__ key': { search: 's', off: [], adding: true, editing: '' },
            'own __proto__ key alone': dataFallback,
            valid: dataValid,
            'wrong off': { search: 'q', off: [], adding: true, editing: 'e', reveal: 'r' },
            'all wrong': dataFallback
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
            off: 'x',
            journalsOpen: 'no',
            conferencesOpen: 0
        },
        notMap: venuesFallback,
        answers: {
            'empty map': venuesFallback,
            'own __proto__ key': { ...venuesFallback, search: 's', adding: true },
            'own __proto__ key alone': venuesFallback,
            valid: venuesValid,
            'wrong off': { ...venuesValid, off: [] },
            'wrong journalsOpen': { ...venuesValid, journalsOpen: true },
            'wrong conferencesOpen': { ...venuesValid, conferencesOpen: true },
            'all wrong': venuesFallback
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
            compare: { from: 'f', to: 't' },
            workspace: true,
            replace: { ...REPLACE_VALID },
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
            compare: { from: '', to: 't' },
            workspace: false,
            replace: { query: 3 },
            line: '4',
            session: 3
        },
        notMap: heldDiffFallback,
        answers: {
            'empty map': heldDiffFallback,
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
            'wrong compare': { ...heldDiffValid, compare: undefined },
            'wrong workspace': { ...heldDiffValid, workspace: undefined },
            'wrong replace': { ...heldDiffValid, replace: undefined },
            'wrong line': { ...heldDiffValid, line: 0 },
            'wrong session': { ...heldDiffValid, session: '' },
            'all wrong': heldDiffFallback
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
            'views with other values': { views: { a: 3, b: null, c: [], d: 'x', e: { k: 1 } } },
            'views with an own __proto__ key': {
                views: JSON.parse('{"__proto__":{"a":1},"b":{"c":2}}')
            }
        },
        notMap: diffViewFallback,
        answers: {
            'empty map': diffViewFallback,
            'own __proto__ key': diffViewFallback,
            'own __proto__ key alone': diffViewFallback,
            valid: diffViewValid,
            'wrong mode': { ...diffViewValid, mode: 'side' },
            'wrong views': { mode: 'inline', views: {}, unchanged: 'shown', folded: ['a.ts'] },
            'wrong unchanged': { ...diffViewValid, unchanged: 'folded' },
            'wrong folded': { ...diffViewValid, folded: [] },
            'all wrong': diffViewFallback,
            'views with other values': {
                mode: 'inline',
                views: { e: { k: 1 } },
                unchanged: 'shown',
                folded: ['a.ts']
            },
            'views with an own __proto__ key': {
                mode: 'inline',
                views: { b: { c: 2 } },
                unchanged: 'shown',
                folded: ['a.ts']
            }
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
            'folded of other paths only': { folded: ['b.ts', 'd.ts'] }
        },
        notMap: diffPathsFallback,
        answers: {
            'empty map': diffPathsFallback,
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
            'folded of other paths only': { ...diffPathsValid, folded: [] }
        }
    },
    {
        name: 'repositoriesViewOf',
        read: repositoriesViewOf,
        valid: {
            root: 'r',
            collapsed: ['c'],
            commit: 'k',
            mode: 'tree',
            reveal: 'branches',
            closed: ['d']
        },
        wrong: { root: 3, collapsed: 'x', commit: 3, mode: 'grid', reveal: 'tags', closed: 'x' },
        notMap: reposFallback,
        answers: {
            'empty map': reposFallback,
            'own __proto__ key': reposFallback,
            'own __proto__ key alone': reposFallback,
            valid: reposValid,
            'wrong root': { ...reposValid, root: '' },
            'wrong collapsed': { ...reposValid, collapsed: [] },
            'wrong commit': { ...reposValid, commit: '' },
            'wrong mode': { ...reposValid, mode: 'list' },
            'wrong reveal': { ...reposValid, reveal: '' },
            'wrong closed': { ...reposValid, closed: [] },
            'all wrong': reposFallback
        }
    }
];

describe('diffViewOf over no paths', () => {
    it('keeps no view and no fold, whatever the state holds', () => {
        const held = { views: { 'a.ts': { scroll: 1 } }, folded: ['a.ts'] };
        expect(diffViewOf(held, [])).toStrictEqual(diffViewFallback);
    });
});

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
