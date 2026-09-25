// The command palette's pure index, ranking and command vocabulary over a synthetic snapshot and
// feed entries, including the state adapter over one complete socket message.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    buildIndex,
    commands,
    kindWord,
    match,
    lineQuery,
    parseCommand
} from '../../../src/lib/state/workbench/palette.ts';
import type { Snapshot } from '../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../src/lib/state/words/text.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

let client: ClientState;
let receive: ClientState['entities']['receive'];
let paletteSource: ClientState['paletteSource']['paletteSource'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
    ({ paletteSource } = client.paletteSource);
});

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
    linkedin: {
        entries: [{ file: 'xx-idea.md', title: 'Public methods', body: 'Explain the result' }]
    }
};

const index = buildIndex(snapshot, feeds, [{ id: 'focus', label: 'Focus' }]);

describe('paletteSource', () => {
    it('indexes all three feeds from their first socket message', () => {
        receive({ channel: 'feeds', version: 1, payload: feeds });
        const fromChannel = buildIndex(null, paletteSource().feeds, []);
        expect(fromChannel.map((item) => item.id)).toEqual([
            'feed:leads:Chair opening',
            'feed:radar:A paper',
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
        expect(state('feed:linkedin:xx-idea.md')).toEqual({ reveal: 'xx-idea.md' });
    });

    it('indexes views, projects, every collection entry and every socket feed entry', () => {
        expect(index.map((item) => item.id)).toEqual([
            'view:focus',
            'project:alpha',
            'project:beta',
            'collection:events:talk',
            'feed:leads:Chair opening',
            'feed:radar:A paper',
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
        expect(match(index, 'Public methods').map((item) => item.id)).toEqual([
            'feed:linkedin:xx-idea.md'
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

    it('lists the views alone for an empty query and for one of spaces only', () => {
        expect(match(index, '').map((item) => item.id)).toEqual(['view:focus']);
        expect(match(index, '   ').map((item) => item.id)).toEqual(['view:focus']);
    });

    it('lists nothing for an empty query over an index that holds no view', () => {
        expect(match(buildIndex(snapshot, feeds, []), '')).toEqual([]);
    });

    it('lets a word reach every kind again once one is typed', () => {
        expect(new Set(match(index, 'a').map((item) => item.kind))).toEqual(
            new Set(['view', 'project', 'collection', 'feed'])
        );
    });
});

describe('the kind a result row draws', () => {
    it('names each of the four kinds in its own catalog word', () => {
        expect(
            ['view', 'project', 'collection', 'feed'].map((kind) => kindWord(kind as never, t))
        ).toEqual([
            t('app.palette.kind_view'),
            t('app.palette.kind_project'),
            t('app.palette.kind_collection'),
            t('app.palette.kind_feed')
        ]);
        expect(new Set(index.map((item) => kindWord(item.kind, t))).size).toBe(4);
    });
});

describe('commands', () => {
    const list = commands({ themes: [{ name: 'light' }, { name: 'nord' }] });

    it('lists the eight commands, theme names and the three unavailable with no source tab', () => {
        // revert: src/lib/state/workbench/palette.ts:192 => delete
        expect(list.map((command) => command.name)).toEqual([
            'theme',
            'crt',
            'accent',
            'tab',
            'goto',
            'language',
            'help',
            'update'
        ]);
        expect(list[0].hint).toContain('light | nord');
        expect(list.filter((command) => !command.available).map((command) => command.name)).toEqual(
            ['accent', 'language', 'help']
        );
    });

    it('offers the language list only while a source tab is on screen', () => {
        // revert: src/lib/state/workbench/palette.ts:192 => { name: 'language', hint: '<language>', available: true },
        const language = (source: boolean) =>
            commands({}, source).find((command) => command.name === 'language');
        expect(language(true)?.available).toBe(true);
        expect(language(false)?.available).toBe(false);
    });

    it('reads a colon and a whole number as a line to go to, and nothing else as one', () => {
        // revert: src/lib/state/workbench/palette.ts:169 => if (parsed === null) return null;
        expect(lineQuery(parseCommand(':12'))).toBe(12);
        expect(lineQuery(parseCommand(': 7'))).toBe(7);
        expect(lineQuery(parseCommand(':0'))).toBe(null);
        expect(lineQuery(parseCommand(':12 more'))).toBe(null);
        expect(lineQuery(parseCommand(':1e3'))).toBe(null);
        expect(lineQuery(parseCommand(':theme'))).toBe(null);
        expect(lineQuery(parseCommand(':'))).toBe(null);
        expect(lineQuery(parseCommand('12'))).toBe(null);
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
