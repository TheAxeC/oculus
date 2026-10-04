// Layer 2, client-state tests. The board's presets over a hand-built snapshot: which projects each
// preset shows, how they sort, and what they are joined with. Everything here is pure, so nothing
// reads a file and nothing renders.

import { describe, expect, it } from 'vitest';
import {
    boardItems,
    presetFor,
    stats,
    typeCounts,
    waitingLine
} from '../../../../src/lib/state/boards/board/index.ts';
import {
    CONFIG,
    project,
    venue,
    snapshot,
    SNAPSHOT,
    PROJECTS,
    ITEMS,
    ids,
    item,
    over
} from './board-fixture.ts';

describe('waitingLine', () => {
    it('uses a held venue name when its short name is empty', () => {
        const held = project('review', 'manuscripts', { venueId: 'jbi', chips: ['submitted'] });
        expect(
            waitingLine(
                held,
                {
                    jbi: {
                        id: 'jbi',
                        name: 'Journal of Biomedical Informatics',
                        short: '',
                        themes: []
                    }
                },
                {}
            )
        ).toEqual({ kind: 'review', text: 'under review at Journal of Biomedical Informatics' });
        expect(waitingLine(held, {}, {})).toEqual({
            kind: 'review',
            text: 'under review (venue unset)'
        });
    });

    const venues = { jbi: venue('jbi', { name: 'Journal', short: 'JBI' }) };
    const people = { someone: 'Someone Else' };

    it('uses people before submission review and blocking, resolving known collaborator ids', () => {
        const held = project('held', 'active', {
            waitingOn: ['someone', 'Free Name'],
            chips: ['submitted', 'blocked'],
            venueId: 'jbi'
        });
        expect(waitingLine(held, venues, people)).toEqual({
            kind: 'people',
            text: 'waiting on Someone Else, Free Name'
        });
    });

    it('uses the venue for submission review, then the unset and blocked fallbacks', () => {
        expect(
            waitingLine(
                project('review', 'manuscripts', { chips: ['submitted'], venueId: 'jbi' }),
                venues,
                people
            )
        ).toEqual({ kind: 'review', text: 'under review at JBI' });
        expect(
            waitingLine(project('unset', 'manuscripts', { chips: ['submitted'] }), venues, people)
        ).toEqual({ kind: 'review', text: 'under review (venue unset)' });
        expect(
            waitingLine(project('blocked', 'active', { chips: ['blocked'] }), venues, people)
        ).toEqual({ kind: 'blocked', text: 'blocked (external)' });
        expect(waitingLine(project('free', 'active'), venues, people)).toBeNull();
    });

    it('names a project waited on by its short name, through the one rule the strip uses', () => {
        const other = project('other', 'active', { title: 'The Other One', short: 'Other' });
        const held = project('waits', 'active', { waitingOn: ['other', 'someone'] });
        expect(waitingLine(held, venues, people, { other })).toEqual({
            kind: 'people',
            text: 'waiting on Other, Someone Else'
        });
    });
});

describe('presetFor', () => {
    it('gives each board its tiers', () => {
        expect(PROJECTS.tiers).toEqual(['ideas', 'active', 'manuscripts']);
        expect(presetFor('archive', CONFIG).tiers).toEqual(['archive']);
        expect(presetFor('coauthor', CONFIG).tiers).toEqual(['coauthor']);
    });

    it('gives the projects board its own columns and the other two the archive columns', () => {
        expect(PROJECTS.columns.map((column) => column.key)).toEqual([
            'title',
            'authors',
            'venue',
            'status',
            'focus',
            'next'
        ]);
        expect(PROJECTS.columns.map((column) => column.label)).toEqual(
            (CONFIG.board as Record<string, string[]>).cols_project
        );
        expect(presetFor('coauthor', CONFIG).columns.map((column) => column.label)).toEqual(
            (CONFIG.board as Record<string, string[]>).cols_archive
        );
    });

    it('takes the label mode of its own surface from the config', () => {
        expect(PROJECTS.labels).toBe('short');
        expect(presetFor('archive', CONFIG).labels).toBe('full');
        expect(presetFor('coauthor', CONFIG).labels).toBe('full');
    });

    it('takes the search placeholder of its own board, and none where there is none', () => {
        expect(PROJECTS.search).toBe('Search title | eli5 ...');
        expect(presetFor('archive', CONFIG).search).toBe('');
    });

    it('reads the rollup buckets of its own board, by the slug of their words', () => {
        expect(PROJECTS.rollup).toEqual([
            {
                id: 'in-progress',
                label: 'in progress',
                keys: ['active', 'manuscript'],
                color: '#0d9488'
            },
            { id: 'idea', label: 'idea', keys: ['idea'], color: '' }
        ]);
    });

    it('falls back to the projects board for a view id it does not know', () => {
        expect(presetFor('nonesuch', CONFIG).id).toBe('projects');
    });

    it('survives a config that holds none of the keys it reads', () => {
        const bare = presetFor('projects');
        expect(bare.rollup).toEqual([]);
        expect(bare.typeOrder).toEqual([]);
        expect(bare.labels).toBe('short');
        expect(bare.columns.map((column) => column.label)).toEqual(
            bare.columns.map((column) => column.key)
        );
    });
});

describe('boardItems, the tier split', () => {
    it('counts a flat-tier ghost in the board total and the type split', () => {
        const snap = snapshot();
        const preset = presetFor('projects', CONFIG);
        const before = boardItems(snap, preset);
        snap.entities.projects.ghost = project('ghost', 'ideas', { type: 'idea', ghost: true });
        const after = boardItems(snap, preset);
        expect(stats(after, snap.entities.venues, CONFIG).active).toBe(
            stats(before, snap.entities.venues, CONFIG).active + 1
        );
        expect(typeCounts(after).find((row) => row.type === 'idea')?.count).toBe(
            (typeCounts(before).find((row) => row.type === 'idea')?.count ?? 0) + 1
        );
    });

    it('shows one tier on each of the other two boards', () => {
        expect(ids(boardItems(SNAPSHOT, presetFor('archive', CONFIG)))).toEqual(['zulu']);
        expect(ids(boardItems(SNAPSHOT, presetFor('coauthor', CONFIG)))).toEqual(['yankee']);
    });
});

describe('boardItems, the sort', () => {
    it('puts the pinned first, then the config type order, then the title', () => {
        expect(ids(ITEMS)).toEqual(['charlie', 'alpha', 'bravo', 'foxtrot', 'delta', 'echo']);
    });
});

describe('boardItems, the joins', () => {
    it('joins the venue and writes it as name, quartile, JIF and cost', () => {
        expect(item('alpha').venue).toEqual({
            id: 'bspc',
            text: 'BSPC | Q1 | JIF 4.9 | free',
            short: 'BSPC'
        });
    });

    it('joins no venue for an id the catalogue does not hold', () => {
        expect(item('bravo').venue).toBe(null);
    });

    it('joins the domain, its words and its hue', () => {
        expect(item('alpha').domain).toEqual({
            id: 'heart',
            label: 'Cardiology | ECG',
            tone: 'crimson'
        });
        expect(item('charlie').domain).toBe(null);
    });

    it('takes the card colour from the type', () => {
        expect(item('alpha').tone).toBe('teal');
        expect(item('bravo').tone).toBe('violet');
        expect(item('echo').tone).toBe('grey');
    });

    it('joins the pillars by title and the collaborators by name', () => {
        expect(item('alpha').pillars).toEqual([{ id: 'federated', label: 'Federated learning' }]);
        expect(item('alpha').collaborators).toEqual([{ id: 'someone', label: 'Someone Else' }]);
    });

    it('leaves funding and datasets as the keys a manifest names them by', () => {
        expect(item('alpha').funding).toEqual([{ id: 'FAIR', label: 'FAIR' }]);
        expect(item('alpha').datasets).toEqual([{ id: 'mimic', label: 'mimic' }]);
    });

    it('writes the authors as one line, from the list or from the lead', () => {
        expect(item('alpha').authors).toBe('Faes, Someone');
        expect(item('bravo').authors).toBe('Faes');
        expect(item('charlie').authors).toBe('');
    });

    it('carries the lifecycle bucket of the board it is on', () => {
        expect(item('alpha').bucket).toBe('in-progress');
        expect(item('charlie').bucket).toBe('idea');
        expect(item('echo').bucket).toBe('');
    });
});

describe('presetFor, a config of the wrong types', () => {
    it('reads board only as a map, and its search only as a map of words', () => {
        for (const board of [[], 'x', null]) {
            const bare = presetFor('projects', { board });
            expect(bare.search).toBe('');
            expect(bare.columns.map((column) => column.label)).toStrictEqual([
                'title',
                'authors',
                'venue',
                'status',
                'focus',
                'next'
            ]);
        }
        for (const search of [3, [], 'x']) {
            expect(presetFor('projects', { board: { search } }).search).toBe('');
        }
        const search = { projects: 'P', archive: 3, coauthor: 'C' };
        expect(presetFor('archive', { board: { search } }).search).toBe('');
        expect(presetFor('coauthor', { board: { search } }).search).toBe('C');
        expect(presetFor('nonesuch', { board: { search } }).search).toBe('P');
    });

    it('names a column by the string at its position among the strings of the list', () => {
        const labels = (cols: unknown) =>
            presetFor('projects', { board: { cols_project: cols } }).columns.map(
                (column) => column.label
            );
        expect(labels(['A', 3, 'C', null, 'E'])).toStrictEqual([
            'A',
            'C',
            'E',
            'status',
            'focus',
            'next'
        ]);
        expect(labels('x')).toStrictEqual(['title', 'authors', 'venue', 'status', 'focus', 'next']);
    });

    it('keeps the buckets that carry words, reads their keys as the strings of a list', () => {
        const projects = [
            [],
            null,
            'x',
            { label: 3 },
            { label: '' },
            { label: 'Hello World!', keys: ['a', 3, 'b'], color: '#fff' },
            { label: 'B', keys: 'x', color: 4 },
            { label: 'C' }
        ];
        expect(presetFor('projects', { tab_rollup: { projects } }).rollup).toStrictEqual([
            { id: 'hello-world', label: 'Hello World!', keys: ['a', 'b'], color: '#fff' },
            { id: 'b', label: 'B', keys: [], color: '' },
            { id: 'c', label: 'C', keys: [], color: '' }
        ]);
        for (const tab_rollup of [[], { projects: 'x' }, { projects: { a: 1 } }, 'x']) {
            expect(presetFor('projects', { tab_rollup }).rollup).toStrictEqual([]);
        }
    });

    it('reads the type order as the strings of a list and the label mode as the word full', () => {
        const order = (type_order: unknown) => presetFor('projects', { type_order }).typeOrder;
        expect(order(['a', 3, 'b'])).toStrictEqual(['a', 'b']);
        expect(order('x')).toStrictEqual([]);
        expect(order({ 0: 'a' })).toStrictEqual([]);
        const labels = (held: unknown) => [
            presetFor('projects', { project_label_mode: held }).labels,
            presetFor('archive', { archive_label_mode: held }).labels,
            presetFor('coauthor', { project_label_mode: held }).labels
        ];
        expect(labels('full')).toStrictEqual(['full', 'full', 'short']);
        for (const held of ['Full', 3, ['full'], undefined]) {
            expect(labels(held)).toStrictEqual(['short', 'short', 'short']);
        }
    });
});

describe('the venue concentration setting of the stats', () => {
    const rows: [string, unknown, boolean][] = [
        ['a number at the count', 2, true],
        ['zero', 0, true],
        ['a negative number', -1, true],
        ['a number written as a string', '2', false],
        ['NaN', NaN, false],
        ['Infinity', Infinity, false],
        ['null', null, false],
        ['true', true, false]
    ];

    it.each(rows)('reads %s', (_, venue_conc_warn, warn) => {
        const { snapshot: snap } = over({ bravo: { venueId: 'bspc' } });
        const { venues } = stats(boardItems(snap, PROJECTS), snap.entities.venues, {
            ...CONFIG,
            venue_conc_warn
        });
        expect(venues[0]).toMatchObject({ count: 2, warn });
    });
});
