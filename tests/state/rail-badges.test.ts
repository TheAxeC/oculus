// Layer 2, client-state tests. Rail badges count configured collection states and feed urgency.
// Pure cases isolate the arithmetic; the installed-store case proves feed precedence and fallback.

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    actionableEntries,
    countText,
    leadsDue,
    linkedinOverdue,
    liveEntries,
    liveRule,
    numericSetting
} from '../../src/lib/state/rail-badges.ts';
import {
    applicationsBadge,
    inboxBadge,
    leadsBadge,
    linkedinBadge
} from '../../src/lib/state/rail-badges.svelte.ts';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import { refetch } from '../../src/lib/state/feeds.svelte.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import type { Snapshot } from '../../src/lib/data/model.ts';

const now = new Date(2026, 8, 12, 12).getTime();
const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('rail badge counts', () => {
    it('reads one collection live-status rule and counts normalised entry fields', () => {
        const config = {
            nav_live: {
                funding: { match: ['in-prep', 'submitted'], tone: 'amber' }
            }
        };
        const rule = liveRule(config, 'funding');
        expect(rule).toEqual({ match: ['in-prep', 'submitted'], tone: 'amber' });
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

    it('uses snapshot summaries, good fetched feeds, and summaries after feed errors', async () => {
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
                    programs: {},
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
            } as unknown as Snapshot
        });

        expect([inboxBadge(), leadsBadge(), linkedinBadge(), applicationsBadge()]).toEqual([
            '4',
            '1',
            glyphCatalog(config).warn,
            '2'
        ]);

        vi.stubGlobal('fetch', (url: string) => {
            const kind = new URL(url, 'http://oculus.test').searchParams.get('kind');
            const entries =
                kind === 'inbox'
                    ? [
                          { kind: 'info', triaged: false },
                          { kind: 'reply', triaged: false },
                          { kind: 'action', triaged: true }
                      ]
                    : kind === 'leads'
                      ? [
                            { title: 'One', status: 'open', deadline: '2026-09-13' },
                            { title: 'Two', status: 'open', deadline: '2026-09-14' }
                        ]
                      : [{ file: '01-post.md', title: 'Post', date: '2026-09-10', body: '' }];
            return Promise.resolve(
                new Response(
                    JSON.stringify({ ok: true, kind, file: 'feed.yml', meta: {}, entries })
                )
            );
        });
        await refetch('inbox');
        await refetch('leads');
        await refetch('linkedin');
        expect([inboxBadge(), leadsBadge(), linkedinBadge()]).toEqual(['1', '2', '']);

        vi.stubGlobal('fetch', () =>
            Promise.resolve(
                new Response(JSON.stringify({ error: 'bad YAML', file: 'feed.yml' }), {
                    status: 500
                })
            )
        );
        await refetch('inbox');
        await refetch('leads');
        await refetch('linkedin');
        expect([inboxBadge(), leadsBadge(), linkedinBadge()]).toEqual([
            '4',
            '1',
            glyphCatalog(config).warn
        ]);
    });
});
