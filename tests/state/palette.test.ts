// The command palette's pure index, ranking and command vocabulary over a synthetic snapshot and
// feed entries, including the state adapter over one complete socket message.

import { describe, expect, it } from 'vitest';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import { buildIndex, commands, match, parseCommand } from '../../src/lib/state/palette.ts';
import { paletteSource } from '../../src/lib/state/palette-source.svelte.ts';
import type { Snapshot } from '../../src/lib/data/model.ts';

const snapshot = {
    version: 1,
    entities: {
        projects: {
            alpha: {
                id: 'alpha',
                title: 'Alpha methods',
                short: 'AM',
                eli5: 'A simple account',
                results: ['Strong signal'],
                ideas: ['New objective'],
                next: 'Run cohort',
                latest: 'Encoder ready',
                venueId: 'journal',
                chips: ['keeper'],
                tier: 'active'
            },
            beta: {
                id: 'beta',
                title: 'Beta study',
                eli5: 'Alpha appears only in the body',
                results: [],
                ideas: [],
                chips: [],
                tier: 'ideas'
            }
        },
        venues: { journal: { id: 'journal', name: 'Methods Journal', short: 'MJ' } },
        collections: {
            events: {
                id: 'events',
                title: 'Events',
                file: '/tmp/events.yml',
                entries: [
                    {
                        id: 'talk',
                        title: 'Invited talk',
                        fields: { title: 'Invited talk', note: 'Leuven', tags: ['keynote'] },
                        file: '/tmp/events.yml',
                        index: 0
                    }
                ]
            }
        },
        feeds: {
            inbox: null,
            leads: null,
            radar: null,
            scout: null,
            linkedin: null
        }
    }
} as unknown as Snapshot;

const feeds = {
    leads: { entries: [{ title: 'Chair opening', inst: 'Ghent' }] },
    radar: { entries: [{ title: 'A paper', why: 'causal objective' }] },
    inbox: { entries: [{ id: 'thread-1', subject: 'Review request', sender: 'Editor' }] },
    linkedin: {
        entries: [{ file: 'xx-idea.md', title: 'Public methods', body: 'Explain the result' }]
    }
};

const index = buildIndex(snapshot, feeds, [{ id: 'focus', label: 'Focus' }]);

describe('paletteSource', () => {
    it('indexes all four feeds from their first socket message', () => {
        receive({ channel: 'feeds', version: 1, payload: feeds });
        const fromChannel = buildIndex(null, paletteSource().feeds, []);
        expect(fromChannel.map((item) => item.id)).toEqual([
            'feed:leads:Chair opening',
            'feed:radar:A paper',
            'feed:inbox:thread-1',
            'feed:linkedin:xx-idea.md'
        ]);
    });
});

describe('buildIndex', () => {
    it('opens the disclosure a feed entry may sit behind when it is revealed', () => {
        const state = (id: string) => index.find((item) => item.id === id)?.state;
        expect(state('feed:leads:Chair opening')).toEqual({
            reveal: 'Chair opening',
            expiredOpen: true
        });
        expect(state('feed:radar:A paper')).toEqual({ reveal: 'A paper', dismissedOpen: true });
        expect(state('feed:inbox:thread-1')).toEqual({ reveal: 'thread-1', triagedOpen: true });
    });

    it('indexes views, projects, every collection entry and every socket feed entry', () => {
        expect(index.map((item) => item.id)).toEqual([
            'view:focus',
            'project:alpha',
            'project:beta',
            'collection:events:talk',
            'feed:leads:Chair opening',
            'feed:radar:A paper',
            'feed:inbox:thread-1',
            'feed:linkedin:xx-idea.md'
        ]);
    });

    it('includes the requested project fields, venue and tags', () => {
        const project = index.find((item) => item.id === 'project:alpha');
        expect(project?.text).toContain('A simple account');
        expect(project?.text).toContain('Strong signal');
        expect(project?.text).toContain('New objective');
        expect(project?.text).toContain('Run cohort');
        expect(project?.text).toContain('Encoder ready');
        expect(project?.text).toContain('Methods Journal');
        expect(project?.text).toContain('keeper');
    });

    it('indexes every nested string field of collection and feed entries', () => {
        expect(match(index, 'Leuven keynote').map((item) => item.id)).toEqual([
            'collection:events:talk'
        ]);
        expect(match(index, 'Editor Review').map((item) => item.id)).toEqual([
            'feed:inbox:thread-1'
        ]);
    });
});

describe('match', () => {
    it('requires every word and ranks a title hit above a body-only hit', () => {
        expect(match(index, 'alpha').map((item) => item.id)).toEqual([
            'project:alpha',
            'project:beta'
        ]);
        expect(match(index, 'alpha missing')).toEqual([]);
    });
});

describe('commands', () => {
    const list = commands({ themes: [{ name: 'light' }, { name: 'nord' }] });

    it('lists the seven commands, theme names and the two unavailable commands', () => {
        expect(list.map((command) => command.name)).toEqual([
            'theme',
            'crt',
            'accent',
            'tab',
            'goto',
            'help',
            'update'
        ]);
        expect(list[0].hint).toContain('light | nord');
        expect(list.filter((command) => !command.available).map((command) => command.name)).toEqual(
            ['accent', 'help']
        );
    });

    it('parses a command prefix and its argument', () => {
        const parsed = parseCommand(':th nord');
        expect(parsed).toEqual({ name: 'th', argument: 'nord' });
        expect(list.filter((command) => command.name.startsWith(parsed?.name ?? ''))).toHaveLength(
            1
        );
        expect(parseCommand('theme nord')).toBe(null);
    });

    it('matches every command by two-letter prefix, rejects an unknown prefix and lists all for an empty prefix', () => {
        function names(query: string): string[] {
            const parsed = parseCommand(query);
            return list
                .filter((command) => command.name.startsWith(parsed?.name ?? ''))
                .map((command) => command.name);
        }

        for (const command of list) {
            expect(names(`:${command.name.slice(0, 2)}`)).toContain(command.name);
        }
        expect(names(':zz')).toEqual([]);
        expect(names(':')).toEqual(list.map((command) => command.name));
    });
});
