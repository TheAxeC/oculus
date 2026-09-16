// Layer 2, client-state tests. Rail badges count configured collection states and feed urgency.
// Pure cases isolate the arithmetic; the installed-store case proves channel precedence and fallback.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    actionableEntries,
    countText,
    leadsDue,
    linkedinOverdue,
    liveEntries,
    liveRule,
    numericSetting,
    rollup,
    typeSplit
} from '../../src/lib/state/rail-badges.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import { badgeOf } from '../../src/lib/views/registry.ts';
import { installBadges } from './rail-badges-fixture.ts';
import { registerAll, registerCollections } from '../../src/routes/views.ts';
import { present } from '../present.ts';
import { createClientState, type ClientState } from '../client.ts';

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
const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('rail badge counts', () => {
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

    it('counts actionable untriaged Inbox records and suppresses zero text', () => {
        expect(
            actionableEntries([
                { kind: 'reply', triaged: true },
                { kind: 'reply', triaged: false },
                { kind: 'info', triaged: false },
                { kind: 'action' }
            ])
        ).toBe(2);
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

    it('requires a finite configured threshold', () => {
        expect(numericSetting({ leads_badge_days: 14 }, 'leads_badge_days')).toBe(14);
        expect(numericSetting({}, 'leads_badge_days')).toBe(null);
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
                        inbox: { run: '2026-09-12', actionable: 4 },
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

        expect([inboxBadge(), leadsBadge(), linkedinBadgeGlyph(), applicationsBadge()]).toEqual([
            '4',
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
                inbox: {
                    ok: true,
                    kind: 'inbox',
                    file: 'inbox.yml',
                    meta: {},
                    entries: [
                        { kind: 'info', triaged: false },
                        { kind: 'reply', triaged: false },
                        { kind: 'action', triaged: true }
                    ]
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
        expect([inboxBadge(), leadsBadge(), linkedinBadgeGlyph()]).toEqual(['1', '2', '']);

        receive({
            channel: 'feeds',
            version: 9103,
            payload: Object.fromEntries(
                ['radar', 'inbox', 'leads', 'linkedin'].map((kind) => [
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
        expect([inboxBadge(), leadsBadge(), linkedinBadgeGlyph()]).toEqual(['4', '1', 'bang']);
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
