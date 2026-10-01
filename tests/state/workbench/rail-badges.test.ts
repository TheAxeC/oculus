// Layer 2, client-state tests. View badges count configured collection states and feed urgency.
// Pure cases isolate the arithmetic; the installed-store case proves channel precedence and
// fallback.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    countText,
    leadsDue,
    linkedinOverdue,
    liveEntries,
    liveRule,
    rollup,
    typeSplit
} from '../../../src/lib/state/workbench/rail-badges.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import { badgeOf } from '../../../src/lib/state/workbench/navigation/registry.ts';
import { installBadges } from './rail-badges-fixture.ts';
import { registerAll, registerCollections } from '../../../src/routes/views.ts';
import { present } from '../../fixtures/present.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let applicationsBadge: ClientState['railBadges']['applicationsBadge'];
let inboxBadge: ClientState['railBadges']['inboxBadge'];
let leadsBadge: ClientState['railBadges']['leadsBadge'];
let linkedinBadgeGlyph: ClientState['railBadges']['linkedinBadgeGlyph'];
let receive: ClientState['entities']['receive'];
let viewFor: ClientState['registry']['viewFor'];

beforeEach(() => {
    client = createClientState();
    ({ applicationsBadge, inboxBadge, leadsBadge, linkedinBadgeGlyph } = client.railBadges);
    ({ receive } = client.entities);
    ({ viewFor } = client.registry);
    registerAll(client.registry);
});

const now = new Date(2026, 8, 12, 12).getTime();

/** One thread of an inbox payload, with the note the case is about. */
function thread(id: string, triage: { kind?: string; triaged?: boolean }): Record<string, unknown> {
    return {
        id,
        account: 'google-work',
        provider: 'google',
        sender: 'Someone',
        subject: id,
        received: '2026-09-12T09:00:00.000Z',
        snippet: '',
        messages: 1,
        triage: { ...triage, triaged: triage.triaged === true }
    };
}
const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('view badge counts', () => {
    it('splits project types in the supplied order and keeps zero cells', () => {
        expect(
            typeSplit(
                [
                    { type: 'idea', chips: [] },
                    { type: 'active', chips: [] },
                    { type: 'idea', chips: [] }
                ],
                ['active', 'manuscript', 'idea']
            )
        ).toEqual([
            { label: 'active', count: 1 },
            { label: 'manuscript', count: 0 },
            { label: 'idea', count: 2 }
        ]);
    });

    const buckets = [
        { label: 'first', keys: ['submitted'], color: '#16a34a' },
        { label: 'papers', keys: ['journal'], color: '#db2777' }
    ];

    it('puts a project in only the first rollup bucket it matches', () => {
        expect(rollup([{ type: 'journal', chips: ['submitted'] }], buckets)).toEqual([
            { label: 'first', count: 1, color: '#16a34a' },
            { label: 'papers', count: 0, color: '#db2777' }
        ]);
    });

    it('matches a rollup bucket through a status chip', () => {
        expect(rollup([{ type: 'other', chips: ['journal'] }], buckets)[1].count).toBe(1);
    });

    it('leaves every rollup count unchanged when no bucket matches', () => {
        expect(rollup([{ type: 'other', chips: ['unmatched'] }], buckets)).toEqual([
            { label: 'first', count: 0, color: '#16a34a' },
            { label: 'papers', count: 0, color: '#db2777' }
        ]);
    });

    it('describes the Live HPC count and its two vocabulary-coloured cells together', () => {
        receive({
            channel: 'hpc',
            version: 7000,
            payload: { status: 'ok', total: 3, running: 2, pending: 1 }
        });
        const badge = badgeOf(present(viewFor('hpc'), 'hpc view'), client);
        expect(badge).toEqual({
            text: '2 1',
            glyph: '',
            tabText: '',
            title: 'running: 2 | pending: 1',
            cells: [
                { count: 2, color: 'green', label: 'running' },
                { count: 1, color: 'amber', label: 'pending' }
            ]
        });
    });

    it('reads one collection live-status rule and counts normalised entry fields', () => {
        const config = {
            nav_live: {
                funding: { match: ['in-prep', 'submitted'], label: 'undecided', tone: 'amber' }
            }
        };
        const rule = liveRule(config, 'funding');
        expect(rule).toEqual({
            match: ['in-prep', 'submitted'],
            label: 'undecided',
            tone: 'amber'
        });
        expect(
            liveEntries(
                [
                    { fields: { status: ' In-Prep ' } },
                    { fields: { status: 'awarded' } },
                    { fields: { status: 'submitted' } }
                ],
                rule
            )
        ).toBe(2);
        expect(liveRule(config, 'events')).toBe(null);
    });

    it('suppresses the text of a zero count', () => {
        expect(countText(2)).toBe('2');
        expect(countText(0)).toBe('');
    });

    it('counts only open leads due from today through the configured window', () => {
        const entries = [
            { status: 'open', deadline: 'today 2026-09-12' },
            { status: 'open', deadline: '2026-09-26' },
            { status: 'open', deadline: '2026-09-27' },
            { status: 'applied', deadline: '2026-09-20' },
            { status: 'dismissed', deadline: '2026-09-20' },
            { status: 'open', deadline: '2026-09-11' },
            { status: 'open', deadline: 'rolling' }
        ];
        expect(leadsDue(entries, 14, now)).toBe(2);
        expect(leadsDue(entries, null, now)).toBe(0);
    });

    it('marks LinkedIn overdue only after its configured cadence', () => {
        expect(linkedinOverdue('2026-08-12', 30, now)).toBe(true);
        expect(linkedinOverdue('2026-08-13', 30, now)).toBe(false);
        expect(linkedinOverdue(null, 30, now)).toBe(false);
        expect(linkedinOverdue('2026-08-01', null, now)).toBe(false);
    });

    it('uses snapshot summaries, good socket feeds, and summaries after feed errors', () => {
        vi.spyOn(Date, 'now').mockReturnValue(now);
        receive({
            channel: 'config',
            version: 9101,
            payload: { config, text: textCatalog(config), findings: [] }
        });
        receive({
            channel: 'portfolio',
            version: 9101,
            payload: {
                version: 9101,
                entities: {
                    projects: {},
                    venues: {},
                    datasets: {},
                    pillars: {},
                    domains: {},
                    funding: {},
                    collections: {
                        applications: {
                            id: 'applications',
                            title: 'Applications',
                            file: '/tmp/applications.yml',
                            entries: [
                                {
                                    id: 'one',
                                    title: 'One',
                                    file: '/tmp/a',
                                    index: 0,
                                    fields: { status: 'active' }
                                },
                                {
                                    id: 'two',
                                    title: 'Two',
                                    file: '/tmp/a',
                                    index: 1,
                                    fields: { status: 'ACTIVE' }
                                },
                                {
                                    id: 'three',
                                    title: 'Three',
                                    file: '/tmp/a',
                                    index: 2,
                                    fields: { status: 'declined' }
                                }
                            ]
                        }
                    },
                    feeds: {
                        leads: [
                            { title: 'Soon', deadline: '2026-09-17', status: 'open', fit: null },
                            { title: 'Later', deadline: '2026-10-17', status: 'open', fit: null }
                        ],
                        radar: null,
                        scout: null,
                        linkedin: { lastPost: '2026-08-01' }
                    },
                    career: null
                },
                relations: {},
                findings: []
            }
        });

        // The plate is not in the snapshot, so the inbox badge is empty until the channel speaks.
        expect([inboxBadge(), leadsBadge(), linkedinBadgeGlyph(), applicationsBadge()]).toEqual([
            '',
            '1',
            'bang',
            '2'
        ]);

        receive({
            channel: 'feeds',
            version: 9102,
            payload: {
                radar: {
                    ok: true,
                    kind: 'radar',
                    file: 'radar.yml',
                    meta: {},
                    entries: []
                },
                leads: {
                    ok: true,
                    kind: 'leads',
                    file: 'leads.yml',
                    meta: {},
                    entries: [
                        { title: 'One', status: 'open', deadline: '2026-09-13' },
                        { title: 'Two', status: 'open', deadline: '2026-09-14' }
                    ]
                },
                linkedin: {
                    ok: true,
                    kind: 'linkedin',
                    file: 'linkedin',
                    meta: {},
                    entries: [{ file: '01-post.md', title: 'Post', date: '2026-09-10', body: '' }]
                }
            }
        });
        expect([inboxBadge(), leadsBadge(), linkedinBadgeGlyph()]).toEqual(['', '2', '']);

        // The plate itself is one channel of its own, and the badge counts what it publishes.
        receive({
            channel: 'inbox',
            version: 1,
            payload: {
                status: 'ok',
                accounts: [],
                threads: [
                    thread('one', { kind: 'reply' }),
                    thread('two', {}),
                    thread('three', { kind: 'info' }),
                    thread('four', { kind: 'action', triaged: true })
                ],
                updated: '2026-09-12T10:00:00.000Z',
                pollMin: 10,
                retryMin: 2,
                notesRun: '2026-09-12'
            }
        });
        expect(inboxBadge()).toBe('2');

        receive({
            channel: 'feeds',
            version: 9103,
            payload: Object.fromEntries(
                ['radar', 'leads', 'linkedin'].map((kind) => [
                    kind,
                    {
                        ok: true,
                        kind,
                        file: 'feed.yml',
                        meta: {},
                        entries: [],
                        error: 'bad YAML'
                    }
                ])
            )
        });
        // A broken feed file says nothing about the plate, which is not read from a file at all.
        expect([inboxBadge(), leadsBadge(), linkedinBadgeGlyph()]).toEqual(['2', '1', 'bang']);
    });
});

describe('registered board badge descriptors', () => {
    const expected = {
        projects: {
            text: '2',
            title: 'active: 1 | manuscript: 0 | idea: 1',
            cells: [
                { count: 1, label: 'active', color: 'green' },
                { count: 0, label: 'manuscript', color: 'amber' },
                { count: 1, label: 'idea', color: 'violet' }
            ]
        },
        archive: {
            text: '3',
            title: 'papers: 1 | outputs: 1 | dead-ends: 1',
            cells: [
                { count: 1, label: 'papers', color: 'rose' },
                { count: 1, label: 'outputs', color: 'sky' },
                { count: 1, label: 'dead-ends', color: 'grey' }
            ]
        },
        coauthor: {
            text: '4',
            title: 'in progress: 1 | papers: 1 | outputs: 1 | dead-ends: 1',
            cells: [
                { count: 1, label: 'in progress', color: 'green' },
                { count: 1, label: 'papers', color: 'rose' },
                { count: 1, label: 'outputs', color: 'sky' },
                { count: 1, label: 'dead-ends', color: 'grey' }
            ]
        }
    };

    it.each(['projects', 'archive', 'coauthor'] as const)(
        'assembles %s from the real registration hooks',
        (id) => {
            installBadges(client, config);
            expect(badgeOf(present(viewFor(id), `${id} view`), client)).toEqual({
                ...expected[id],
                glyph: '',
                tabText: expected[id].text,
                tone: undefined
            });
        }
    );

    it.each(['projects', 'archive', 'coauthor'] as const)(
        'keeps %s total and every split cell at zero',
        (id) => {
            installBadges(client, config, true);
            const badge = badgeOf(present(viewFor(id), `${id} view`), client);
            expect(badge.text).toBe('0');
            expect(badge.cells).toEqual(expected[id].cells.map((cell) => ({ ...cell, count: 0 })));
        }
    );

    it('reads split tones from config independently of type_color', () => {
        installBadges(client, {
            ...config,
            tab_split: { active: 'blue', manuscript: 'cyan', idea: 'pink' }
        });
        expect(
            badgeOf(present(viewFor('projects'), 'projects view'), client).cells?.map(
                (cell) => cell.color
            )
        ).toEqual(['blue', 'cyan', 'pink']);
    });

    it('uses the collection rule label and hides its count at zero', () => {
        registerCollections(client.registry, ['funding']);
        installBadges(client, config);
        expect(badgeOf(present(viewFor('funding'), 'funding view'), client)).toMatchObject({
            text: '1',
            title: '1 undecided',
            tone: 'violet'
        });
        installBadges(client, config, true);
        expect(badgeOf(present(viewFor('funding'), 'funding view'), client).text).toBe('');
    });
});

describe('a badge that is a mark', () => {
    it('says on hover what the mark means, in words from the catalog, and never the mark', () => {
        const catalog = textCatalog(config);
        client.registry.registerView({
            ...present(viewFor('linkedin'), 'linkedin view'),
            id: 'probe-mark',
            badgeGlyph: () => 'bang'
        });
        const badge = badgeOf(present(viewFor('probe-mark'), 'probe view'), client);
        expect(badge.glyph).toBe('bang');
        expect(badge.title).toBe(
            `${catalog['views.linkedin']} ${catalog['views.linkedin_badge_mark']}`
        );
        expect(badge.title).not.toContain(glyphCatalog(config).bang);
    });

    it('hovers a mark whose registration names no words by the view name, and does not throw', () => {
        const catalog = textCatalog(config);
        const { badgeMark, ...unworded } = present(viewFor('linkedin'), 'linkedin view');
        expect(badgeMark).toBe('views.linkedin_badge_mark');
        client.registry.registerView({
            ...unworded,
            id: 'probe-unworded',
            badgeGlyph: () => 'bang'
        });
        const badge = badgeOf(present(viewFor('probe-unworded'), 'probe view'), client);
        expect(badge.glyph).toBe('bang');
        expect(badge.title).toBe(catalog['views.linkedin']);
    });

    it('names its words in every registration that can draw one', () => {
        const catalog = textCatalog(config);
        const marked = client.registry.views().filter((view) => view.badgeGlyph !== undefined);
        expect(marked.map((view) => view.id)).toContain('linkedin');
        for (const view of marked) {
            expect(catalog[view.badgeMark ?? ''], view.id).toBeTypeOf('string');
        }
    });
});

/** The cells of the projects badge over the shipped config with `over` laid on it, as one line. */
function projectCells(over: Record<string, unknown>): string {
    installBadges(client, { ...config, ...over });
    const cells = badgeOf(present(viewFor('projects'), 'projects view'), client).cells ?? [];
    return cells.map((cell) => `${cell.label} ${cell.count} ${cell.color}`).join(', ');
}

describe('the badge rules over config and records of the wrong type', () => {
    const rows: [string, () => unknown, unknown][] = [
        ['a rule of a config with no nav_live', () => liveRule({}, 'k'), null],
        ['a rule of a nav_live that is a list', () => liveRule({ nav_live: [] }, 'k'), null],
        ['a rule of a nav_live that is a string', () => liveRule({ nav_live: 'k' }, 'k'), null],
        ['a rule of a nav_live that is null', () => liveRule({ nav_live: null }, 'k'), null],
        ['a rule of a row that is a list', () => liveRule({ nav_live: { k: [] } }, 'k'), null],
        ['a rule of a row that is null', () => liveRule({ nav_live: { k: null } }, 'k'), null],
        ['a rule of a row that is a string', () => liveRule({ nav_live: { k: 'x' } }, 'k'), null],
        [
            'a rule of a row with no match',
            () => liveRule({ nav_live: { k: { label: 'l' } } }, 'k'),
            null
        ],
        [
            'a rule of a match that is a string',
            () => liveRule({ nav_live: { k: { match: 'x' } } }, 'k'),
            null
        ],
        [
            'a rule of a match that is a map',
            () => liveRule({ nav_live: { k: { match: { a: 'x' } } } }, 'k'),
            null
        ],
        [
            'a rule of a match that is empty',
            () => liveRule({ nav_live: { k: { match: [] } } }, 'k'),
            null
        ],
        [
            'a rule of a match that holds only numbers',
            () => liveRule({ nav_live: { k: { match: [1, null] } } }, 'k'),
            null
        ],
        [
            'a rule of a match that holds numbers and words',
            () => liveRule({ nav_live: { k: { match: [1, ' In-Prep ', 'b', ''] } } }, 'k'),
            { match: ['in-prep', 'b', ''] }
        ],
        [
            'a rule of a match that holds a blank word',
            () => liveRule({ nav_live: { k: { match: ['  '] } } }, 'k'),
            { match: [''] }
        ],
        [
            'a rule of a label that is a number',
            () => liveRule({ nav_live: { k: { match: ['a'], label: 3 } } }, 'k'),
            { match: ['a'] }
        ],
        [
            'a rule of an empty label',
            () => liveRule({ nav_live: { k: { match: ['a'], label: '' } } }, 'k'),
            { match: ['a'], label: '' }
        ],
        [
            'a rule of a label',
            () => liveRule({ nav_live: { k: { match: ['a'], label: 'L' } } }, 'k'),
            { match: ['a'], label: 'L' }
        ],
        [
            'a rule of a tone that is empty',
            () => liveRule({ nav_live: { k: { match: ['a'], tone: '' } } }, 'k'),
            { match: ['a'] }
        ],
        [
            'a rule of a tone that is a number',
            () => liveRule({ nav_live: { k: { match: ['a'], tone: 3 } } }, 'k'),
            { match: ['a'] }
        ],
        [
            'a rule of a tone that is not a vocabulary tone',
            () => liveRule({ nav_live: { k: { match: ['a'], tone: 'Not A Tone' } } }, 'k'),
            { match: ['a'], tone: 'Not A Tone' }
        ],
        [
            'a rule of a tone',
            () => liveRule({ nav_live: { k: { match: ['a'], tone: 'amber' } } }, 'k'),
            { match: ['a'], tone: 'amber' }
        ],
        [
            'the keys of a rule',
            () =>
                Object.keys(
                    liveRule(
                        { nav_live: { k: { tone: 't', label: 'l', match: ['a'], extra: 1 } } },
                        'k'
                    ) ?? {}
                ),
            ['match', 'label', 'tone']
        ],
        [
            'a rule of a key that is a name of the object prototype',
            () => liveRule({ nav_live: {} }, 'constructor'),
            null
        ],
        [
            'a rule of the key __proto__ in a literal map',
            () => liveRule({ nav_live: {} }, '__proto__'),
            null
        ],
        [
            'a rule of an own __proto__ key',
            () => liveRule({ nav_live: JSON.parse('{"__proto__":{"match":["x"]}}') }, '__proto__'),
            { match: ['x'] }
        ],
        [
            'entries counted by a status that is a number',
            () => liveEntries([{ fields: { status: 3 } }], { match: ['active', '3', 'true'] }),
            1
        ],
        [
            'entries counted by a status that is a boolean',
            () => liveEntries([{ fields: { status: true } }], { match: ['active', '3', 'true'] }),
            1
        ],
        [
            'entries counted by a status that is null',
            () => liveEntries([{ fields: { status: null } }], { match: ['active', '3', 'true'] }),
            0
        ],
        [
            'entries counted by a status that is a list',
            () =>
                liveEntries([{ fields: { status: ['active'] } }], {
                    match: ['active', '3', 'true']
                }),
            0
        ],
        [
            'entries counted by a status that is a map',
            () =>
                liveEntries([{ fields: { status: { a: 1 } } }], { match: ['active', '3', 'true'] }),
            0
        ],
        [
            'entries counted by a status that is absent',
            () => liveEntries([{ fields: {} }], { match: [''] }),
            1
        ],
        [
            'entries counted by a status with spaces and capitals',
            () =>
                liveEntries([{ fields: { status: ' ACTIVE ' } }], {
                    match: ['active', '3', 'true']
                }),
            1
        ],
        [
            'entries counted with no rule',
            () => liveEntries([{ fields: { status: 'active' } }], null),
            0
        ],
        [
            'leads due with a status that is a number',
            () => leadsDue([{ status: 3, deadline: '2026-09-14' }], 14, now),
            1
        ],
        [
            'leads due with a status that is null',
            () => leadsDue([{ status: null, deadline: '2026-09-14' }], 14, now),
            1
        ],
        ['leads due with no status', () => leadsDue([{ deadline: '2026-09-14' }], 14, now), 1],
        [
            'leads due with a status that is a list',
            () => leadsDue([{ status: ['applied'], deadline: '2026-09-14' }], 14, now),
            1
        ],
        [
            'leads due with a closed status',
            () => leadsDue([{ status: 'Applied', deadline: '2026-09-14' }], 14, now),
            0
        ],
        [
            'leads due with a deadline that is a number',
            () => leadsDue([{ status: 'open', deadline: 20260914 }], 14, now),
            0
        ],
        [
            'leads due with a deadline that is a list',
            () => leadsDue([{ status: 'open', deadline: ['2026-09-14'] }], 14, now),
            0
        ],
        [
            'leads due with a deadline that is null',
            () => leadsDue([{ status: 'open', deadline: null }], 14, now),
            0
        ],
        [
            'leads due with a deadline that is a map',
            () => leadsDue([{ status: 'open', deadline: { at: '2026-09-14' } }], 14, now),
            0
        ],
        [
            'leads due with a deadline in words',
            () => leadsDue([{ status: 'open', deadline: 'by 2026-09-14 at noon' }], 14, now),
            1
        ],
        [
            'leads due over a window of zero',
            () => leadsDue([{ status: 'open', deadline: '2026-09-12' }], 0, now),
            1
        ],
        [
            'leads due over a window of NaN',
            () => leadsDue([{ status: 'open', deadline: '2026-09-14' }], Number.NaN, now),
            0
        ],
        [
            'leads due over a window of Infinity',
            () => leadsDue([{ status: 'open', deadline: '2026-09-14' }], Infinity, now),
            1
        ],
        [
            'leads due over a negative window',
            () => leadsDue([{ status: 'open', deadline: '2026-09-14' }], -1, now),
            0
        ],
        ['overdue with a post date in words', () => linkedinOverdue('last week', 30, now), false],
        ['overdue with a post date that is empty', () => linkedinOverdue('', 30, now), false],
        ['overdue with a cadence of zero', () => linkedinOverdue('2026-09-11', 0, now), true],
        [
            'overdue with a cadence of NaN',
            () => linkedinOverdue('2026-01-01', Number.NaN, now),
            false
        ],
        [
            'overdue with a cadence of Infinity',
            () => linkedinOverdue('2026-01-01', Infinity, now),
            false
        ],
        ['overdue with a negative cadence', () => linkedinOverdue('2026-09-11', -1, now), true],
        ['the text of a count that is negative', () => countText(-1), ''],
        ['the text of a count that is NaN', () => countText(Number.NaN), ''],
        ['the text of a count that is Infinity', () => countText(Infinity), 'Infinity'],
        ['the text of a count that is fractional', () => countText(1.5), '1.5']
    ];

    it.each(rows)('%s', (_name, run, expected) => {
        expect(run()).toStrictEqual(expected);
    });
});

describe('the projects badge over scan rows and a split of the wrong type', () => {
    const rows: [string, () => unknown, unknown][] = [
        [
            'the shipped config',
            () => projectCells({}),
            'active 1 green, manuscript 0 amber, idea 1 violet'
        ],
        ['a scan that is empty', () => projectCells({ scan: [] }), ''],
        ['a scan that is a string', () => projectCells({ scan: 'projects' }), ''],
        [
            'a scan that is a map',
            () => projectCells({ scan: { tier: 'projects', type: 'active' } }),
            ''
        ],
        ['a scan that is null', () => projectCells({ scan: null }), ''],
        [
            'a scan of rows that are not maps',
            () => projectCells({ scan: [[], 'x', null, 3, { tier: 'projects', type: 'active' }] }),
            'active 1 green'
        ],
        [
            'a scan of rows whose type is a number',
            () =>
                projectCells({
                    scan: [
                        { tier: 'projects', type: 3 },
                        { tier: 'projects', type: 'idea' }
                    ]
                }),
            'idea 1 violet'
        ],
        [
            'a scan of rows whose type is a list',
            () => projectCells({ scan: [{ tier: 'projects', type: ['idea'] }] }),
            ''
        ],
        [
            'a scan of rows of another tier',
            () =>
                projectCells({
                    scan: [
                        { tier: 'archive', type: 'active' },
                        { tier: 'projects', type: 'idea' }
                    ]
                }),
            'idea 1 violet'
        ],
        [
            'a scan of rows with a tier that is a list',
            () => projectCells({ scan: [{ tier: ['projects'], type: 'active' }] }),
            ''
        ],
        ['a scan of rows with no tier', () => projectCells({ scan: [{ type: 'active' }] }), ''],
        [
            'a scan of rows with no type',
            () => projectCells({ scan: [{ tier: 'projects', dir: 'x' }] }),
            ''
        ],
        [
            'a scan of rows with a type no preset lists',
            () => projectCells({ scan: [{ tier: 'projects', type: 'unlisted' }] }),
            ''
        ],
        [
            'a scan of rows with a type twice',
            () =>
                projectCells({
                    scan: [
                        { tier: 'projects', type: 'idea' },
                        { tier: 'projects', type: 'idea' }
                    ]
                }),
            'idea 1 violet'
        ],
        [
            'a split that is a list',
            () => projectCells({ tab_split: ['green', 'amber', 'violet'] }),
            'active 1 grey, manuscript 0 grey, idea 1 grey'
        ],
        [
            'a split that is a string',
            () => projectCells({ tab_split: 'green' }),
            'active 1 grey, manuscript 0 grey, idea 1 grey'
        ],
        [
            'a split that is null',
            () => projectCells({ tab_split: null }),
            'active 1 grey, manuscript 0 grey, idea 1 grey'
        ],
        [
            'a split that is empty',
            () => projectCells({ tab_split: {} }),
            'active 1 grey, manuscript 0 grey, idea 1 grey'
        ],
        [
            'a split of tones that are not strings',
            () => projectCells({ tab_split: { active: 3, manuscript: null, idea: ['violet'] } }),
            'active 1 grey, manuscript 0 grey, idea 1 grey'
        ],
        [
            'a split of tones that are empty',
            () => projectCells({ tab_split: { active: '', manuscript: '', idea: '' } }),
            'active 1 grey, manuscript 0 grey, idea 1 grey'
        ],
        [
            'a split of tones with a capital',
            () => projectCells({ tab_split: { active: 'Blue', manuscript: 'cyan', idea: 'pink' } }),
            'active 1 grey, manuscript 0 cyan, idea 1 pink'
        ],
        [
            'a split of tones that start with a digit',
            () => projectCells({ tab_split: { active: '1a', manuscript: 'a-1', idea: 'a b' } }),
            'active 1 grey, manuscript 0 a-1, idea 1 grey'
        ],
        [
            'a split of tones with a hyphen',
            () => projectCells({ tab_split: { active: 'a-b-c', manuscript: '-a', idea: 'a_b' } }),
            'active 1 a-b-c, manuscript 0 grey, idea 1 grey'
        ],
        [
            'a split of tones',
            () => projectCells({ tab_split: { active: 'blue', manuscript: 'cyan', idea: 'pink' } }),
            'active 1 blue, manuscript 0 cyan, idea 1 pink'
        ],
        [
            'a split with an own __proto__ key beside the tones',
            () => projectCells({ tab_split: JSON.parse('{"__proto__":"blue","active":"red"}') }),
            'active 1 red, manuscript 0 grey, idea 1 grey'
        ]
    ];

    it.each(rows)('%s', (_name, run, expected) => {
        expect(run()).toStrictEqual(expected);
    });
});
