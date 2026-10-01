// The command palette's pure index, ranking and command vocabulary over a synthetic snapshot and
// feed entries, including the state adapter over one complete socket message.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    buildIndex,
    commands,
    kindWord,
    lineQuery,
    parseCommand,
    ranked,
    type PaletteItem
} from '../../../src/lib/state/workbench/palette.ts';
import type { Snapshot } from '../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
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
        expect(ranked(index, 'Leuven keynote').map((found) => found.item.id)).toEqual([
            'collection:events:talk'
        ]);
        expect(ranked(index, 'Public methods').map((found) => found.item.id)).toEqual([
            'feed:linkedin:xx-idea.md'
        ]);
    });
});

describe('ranked', () => {
    it('requires every word and ranks a title hit above a body-only hit', () => {
        expect(ranked(index, 'alpha').map((found) => found.item.id)).toEqual([
            'project:alpha',
            'project:beta'
        ]);
        expect(ranked(index, 'alpha missing').map((found) => found.item)).toEqual([]);
    });

    // An audit of what an empty query lists. Red when an empty or blank query lists anything but
    // the views.
    it('lists the views alone for an empty query and for one of spaces only', () => {
        expect(ranked(index, '').map((found) => found.item.id)).toEqual(['view:focus']);
        expect(ranked(index, '   ').map((found) => found.item.id)).toEqual(['view:focus']);
    });

    it('lists nothing for an empty query over an index that holds no view', () => {
        expect(ranked(buildIndex(snapshot, feeds, []), '').map((found) => found.item)).toEqual([]);
    });

    it('lets a word reach every kind again once one is typed', () => {
        expect(new Set(ranked(index, 'a').map((found) => found.item.kind))).toEqual(
            new Set(['view', 'project', 'collection', 'feed'])
        );
    });
});

describe('the fuzzy match', () => {
    /** One index item of a kind, its label and title the same words. */
    function item(id: string, kind: PaletteItem['kind'], title: string, text = ''): PaletteItem {
        return { id, kind, label: title, title, text, view: kind };
    }

    const fuzzy = [
        item('view:focus', 'view', 'Focus', 'Focus tab'),
        item('project:raw', 'project', 'RAW-PLS', 'registration-free tensor regression'),
        item('view:status', 'view', 'Status', 'Status tab')
    ];

    // Red when ranked goes back to lowercased substrings: 'rpls' is no substring of 'raw-pls'.
    it('finds a title by letters in its order, by space-separated words, and nothing for letters it lacks', () => {
        expect(ranked(fuzzy, 'rpls').map((found) => found.item.id)).toContain('project:raw');
        expect(ranked(fuzzy, 'raw pls').map((found) => found.item.id)).toContain('project:raw');
        expect(ranked(fuzzy, 'zzzq').map((found) => found.item)).toEqual([]);
    });

    // Red when the empty query lists every item, or lists the views out of index order.
    it('lists the views alone, in index order, for no word', () => {
        expect(ranked(fuzzy, '').map((found) => found.item.id)).toEqual([
            'view:focus',
            'view:status'
        ]);
    });

    // Red when the rank drops the title-first rule: the text holds the query whole and the title
    // only its letters spread apart, so fuzzysort's score alone ranks the text match first.
    it('ranks the item whose title matches above one whose text alone does', () => {
        const two = [
            item('project:beta', 'project', 'Beta study', 'kappa'),
            item('project:spread', 'project', 'Kinetic appraisal of pain', 'nothing else')
        ];
        expect(ranked(two, 'kappa').map((found) => found.item.id)).toEqual([
            'project:spread',
            'project:beta'
        ]);
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
        const language = (source: boolean) =>
            commands({}, source).find((command) => command.name === 'language');
        expect(language(true)?.available).toBe(true);
        expect(language(false)?.available).toBe(false);
    });

    it('reads a colon and a whole number as a line to go to, and nothing else as one', () => {
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

/** The index over feed entries of one kind, and nothing else. */
function feedIndex(kind: 'leads' | 'radar' | 'linkedin', entries: Record<string, unknown>[]) {
    return buildIndex(null, { [kind]: { entries } }, []);
}

/** The index over one entry of a collection, and nothing else. */
function collectionIndex(entry: Record<string, unknown>) {
    const held = {
        entities: { projects: {}, venues: {}, collections: { c: { id: 'c', entries: [entry] } } }
    } as unknown as Snapshot;
    return buildIndex(held, {}, []);
}

describe('the palette readers over config and entries of the wrong type', () => {
    const rows: [string, () => unknown, unknown][] = [
        [
            'themes of a config with none',
            () => commands({})[0],
            { name: 'theme', hint: '<>', available: false }
        ],
        [
            'themes that are a map',
            () => commands({ themes: { name: 'a' } })[0],
            { name: 'theme', hint: '<>', available: false }
        ],
        [
            'themes that are a string',
            () => commands({ themes: 'a' })[0],
            { name: 'theme', hint: '<>', available: false }
        ],
        [
            'themes that are null',
            () => commands({ themes: null })[0],
            { name: 'theme', hint: '<>', available: false }
        ],
        [
            'themes that are empty',
            () => commands({ themes: [] })[0],
            { name: 'theme', hint: '<>', available: false }
        ],
        [
            'themes with a name that is a number and a row that is a string',
            () => commands({ themes: [{ name: 3 }, 'x'] })[0],
            { name: 'theme', hint: '<>', available: false }
        ],
        [
            'themes with rows that are not maps',
            () => commands({ themes: [null, 3, [], 'a', { name: 'b' }] })[0],
            { name: 'theme', hint: '<b>', available: true }
        ],
        [
            'themes with an empty name',
            () => commands({ themes: [{ name: '' }, { name: 'b' }] })[0],
            { name: 'theme', hint: '<b>', available: true }
        ],
        [
            'themes with a name that is a list',
            () => commands({ themes: [{ name: ['a'] }, { name: 'b' }] })[0],
            { name: 'theme', hint: '<b>', available: true }
        ],
        [
            'themes with a name that is null',
            () => commands({ themes: [{ name: null }, { name: 'b' }] })[0],
            { name: 'theme', hint: '<b>', available: true }
        ],
        [
            'themes with a blank name',
            () => commands({ themes: [{ name: ' ' }] })[0],
            { name: 'theme', hint: '< >', available: true }
        ],
        [
            'themes with extra fields',
            () => commands({ themes: [{ name: 'a', extra: 1 }, { name: 'b' }] })[0],
            { name: 'theme', hint: '<a | b>', available: true }
        ],
        [
            'themes in the order the list holds them',
            () => commands({ themes: [{ name: 'b' }, { name: 'a' }] })[0],
            { name: 'theme', hint: '<b | a>', available: true }
        ],
        [
            'the commands of a config with themes of the wrong type',
            () => commands({ themes: [{ name: 3 }] }).map((command) => command.available),
            [false, true, false, true, true, false, false, true]
        ],
        [
            'a lead with a title that is a number and a subject',
            () => feedIndex('leads', [{ title: 3, subject: 's' }]),
            [
                {
                    id: 'feed:leads:s',
                    kind: 'feed',
                    label: 's',
                    title: 's',
                    text: 's',
                    view: 'leads',
                    state: { reveal: 's', expiredOpen: true }
                }
            ]
        ],
        [
            'a lead with a title and a subject',
            () => feedIndex('leads', [{ title: 'T', subject: 'S' }]),
            [
                {
                    id: 'feed:leads:T',
                    kind: 'feed',
                    label: 'T',
                    title: 'T',
                    text: 'T S',
                    view: 'leads',
                    state: { reveal: 'T', expiredOpen: true }
                }
            ]
        ],
        [
            'a lead with an empty title and a subject',
            () => feedIndex('leads', [{ title: '', subject: 'S' }]),
            [
                {
                    id: 'feed:leads:S',
                    kind: 'feed',
                    label: 'S',
                    title: 'S',
                    text: 'S',
                    view: 'leads',
                    state: { reveal: 'S', expiredOpen: true }
                }
            ]
        ],
        [
            'a lead with a title that is a number and a subject that is a number',
            () => feedIndex('leads', [{ title: 3, subject: 3, company: 'c' }]),
            [
                {
                    id: 'feed:leads:c',
                    kind: 'feed',
                    label: 'c',
                    title: 'c',
                    text: 'c',
                    view: 'leads',
                    state: { reveal: 'c', expiredOpen: true }
                }
            ]
        ],
        [
            'a lead with an empty title and an empty subject',
            () => feedIndex('leads', [{ title: '', subject: '', company: 'c' }]),
            [
                {
                    id: 'feed:leads:c',
                    kind: 'feed',
                    label: 'c',
                    title: 'c',
                    text: 'c',
                    view: 'leads',
                    state: { reveal: 'c', expiredOpen: true }
                }
            ]
        ],
        [
            'a lead with a title that is null and a subject that is a list',
            () => feedIndex('leads', [{ title: null, subject: ['x'], company: 'c' }]),
            [
                {
                    id: 'feed:leads:x',
                    kind: 'feed',
                    label: 'x',
                    title: 'x',
                    text: 'x c',
                    view: 'leads',
                    state: { reveal: 'x', expiredOpen: true }
                }
            ]
        ],
        [
            'a lead with no title and a subject',
            () => feedIndex('leads', [{ subject: 'S' }]),
            [
                {
                    id: 'feed:leads:S',
                    kind: 'feed',
                    label: 'S',
                    title: 'S',
                    text: 'S',
                    view: 'leads',
                    state: { reveal: 'S', expiredOpen: true }
                }
            ]
        ],
        [
            'a lead with nothing a string',
            () => feedIndex('leads', [{ title: 3, subject: 4 }]),
            [
                {
                    id: 'feed:leads:leads#0',
                    kind: 'feed',
                    label: 'leads#0',
                    title: 'leads#0',
                    text: '',
                    view: 'leads',
                    state: { reveal: 'leads#0', expiredOpen: true }
                }
            ]
        ],
        [
            'a lead that is empty',
            () => feedIndex('leads', [{}]),
            [
                {
                    id: 'feed:leads:leads#0',
                    kind: 'feed',
                    label: 'leads#0',
                    title: 'leads#0',
                    text: '',
                    view: 'leads',
                    state: { reveal: 'leads#0', expiredOpen: true }
                }
            ]
        ],
        [
            'two leads with one title',
            () => feedIndex('leads', [{ title: 'T' }, { title: 'T', subject: 'S' }]),
            [
                {
                    id: 'feed:leads:T#0',
                    kind: 'feed',
                    label: 'T',
                    title: 'T',
                    text: 'T',
                    view: 'leads',
                    state: { reveal: 'T#0', expiredOpen: true }
                },
                {
                    id: 'feed:leads:T#1',
                    kind: 'feed',
                    label: 'T',
                    title: 'T',
                    text: 'T S',
                    view: 'leads',
                    state: { reveal: 'T#1', expiredOpen: true }
                }
            ]
        ],
        [
            'a lead whose fields nest strings',
            () =>
                feedIndex('leads', [{ title: 'T', fit: { why: ['a', 3, null, { deeper: 'b' }] } }]),
            [
                {
                    id: 'feed:leads:T',
                    kind: 'feed',
                    label: 'T',
                    title: 'T',
                    text: 'T a b',
                    view: 'leads',
                    state: { reveal: 'T', expiredOpen: true }
                }
            ]
        ],
        [
            'a radar entry with a title that is a number and a subject',
            () => feedIndex('radar', [{ title: 3, subject: 's' }]),
            [
                {
                    id: 'feed:radar:s',
                    kind: 'feed',
                    label: 's',
                    title: 's',
                    text: 's',
                    view: 'radar',
                    state: { reveal: 's', dismissedOpen: true }
                }
            ]
        ],
        [
            'a radar entry with a title',
            () => feedIndex('radar', [{ title: 'R', subject: 'S' }]),
            [
                {
                    id: 'feed:radar:R',
                    kind: 'feed',
                    label: 'R',
                    title: 'R',
                    text: 'R S',
                    view: 'radar',
                    state: { reveal: 'R', dismissedOpen: true }
                }
            ]
        ],
        [
            'a linkedin entry with a file that is a number and a title',
            () => feedIndex('linkedin', [{ file: 3, title: 't' }]),
            [
                {
                    id: 'feed:linkedin:t',
                    kind: 'feed',
                    label: 't',
                    title: 't',
                    text: 't',
                    view: 'linkedin',
                    state: { reveal: 't' }
                }
            ]
        ],
        [
            'a linkedin entry with a file and a subject that is a number',
            () => feedIndex('linkedin', [{ file: 'f.md', title: 3, subject: 4 }]),
            [
                {
                    id: 'feed:linkedin:f.md',
                    kind: 'feed',
                    label: 'f.md',
                    title: 'f.md',
                    text: 'f.md',
                    view: 'linkedin',
                    state: { reveal: 'f.md' }
                }
            ]
        ],
        [
            'a linkedin entry with an empty file and a title',
            () => feedIndex('linkedin', [{ file: '', title: 't' }]),
            [
                {
                    id: 'feed:linkedin:t',
                    kind: 'feed',
                    label: 't',
                    title: 't',
                    text: 't',
                    view: 'linkedin',
                    state: { reveal: 't' }
                }
            ]
        ],
        [
            'a feed entry with an own __proto__ key',
            () =>
                feedIndex('leads', [
                    JSON.parse('{"__proto__":{"title":"P"},"title":"T"}') as Record<string, unknown>
                ]),
            [
                {
                    id: 'feed:leads:T',
                    kind: 'feed',
                    label: 'T',
                    title: 'T',
                    text: 'P T',
                    view: 'leads',
                    state: { reveal: 'T', expiredOpen: true }
                }
            ]
        ],
        [
            'a collection entry with an empty title',
            () => collectionIndex({ id: 'e', title: '', fields: { note: 'n' } }),
            [
                {
                    id: 'collection:c:e',
                    kind: 'collection',
                    label: 'e',
                    title: 'e',
                    text: 'n',
                    view: 'c',
                    state: { reveal: 'e' }
                }
            ]
        ],
        [
            'a collection entry with fields of every type',
            () =>
                collectionIndex({
                    id: 'e',
                    title: 'E',
                    fields: { a: 1, b: null, c: ['x', 2, { d: 'y' }], e: true, f: '' }
                }),
            [
                {
                    id: 'collection:c:e',
                    kind: 'collection',
                    label: 'E',
                    title: 'E',
                    text: 'x y',
                    view: 'c',
                    state: { reveal: 'e' }
                }
            ]
        ]
    ];

    it.each(rows)('%s', (_name, run, expected) => {
        expect(run()).toStrictEqual(expected);
    });
});
