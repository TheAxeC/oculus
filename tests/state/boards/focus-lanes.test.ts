// Layer 2, state tests. Collection dates, configured colours and manifest lag are derived solely from arguments, without installing a vocabulary or using a browser.

import { describe, expect, it } from 'vitest';
import {
    collectionLanes,
    entryDate,
    entryDeadline,
    manifestsBehind
} from '../../../src/lib/state/boards/focus-lanes.ts';
import { ticker } from '../../../src/lib/state/boards/ticker.ts';
import type { Entry, Project, Snapshot } from '../../../src/lib/data/model.ts';
import { NO_FEEDS } from '../../fixtures/entities-fixture.ts';

function project(id: string, days: number, type = 'active'): Project {
    return {
        id,
        title: id,
        tier: type === 'idea' ? 'ideas' : type === 'manuscript' ? 'manuscripts' : 'active',
        type,
        ghost: false,
        staleDays: days,
        chips: [],
        results: [],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        relatedIds: [],
        fundingIds: [],
        datasetIds: [],
        pillarIds: [],
        domainIds: [],
        collaborators: [],
        docs: [],
        folder: '',
        file: ''
    };
}

function entry(id: string, fields: Record<string, unknown>): Entry {
    return { id, title: id, fields, file: '', index: 0 };
}

function snapshot(): Snapshot {
    return {
        version: 1,
        entities: {
            projects: {},
            venues: {},
            datasets: {},
            pillars: {},
            domains: {},
            funding: {},
            people: {},
            organisations: {},
            collections: {},
            feeds: NO_FEEDS,
            career: null
        },
        relations: {
            projectVenue: [],
            projectFunding: [],
            projectDataset: [],
            projectPillar: [],
            projectDomain: [],
            projectRelated: [],
            fundingPillar: [],
            projectPerson: [],
            jointWorkPerson: [],
            personOrganisation: [],
            fundingOrganisation: []
        },
        findings: []
    };
}

describe('collectionLanes', () => {
    it('returns supplied stage colours and independent lane tones without an installed vocabulary', () => {
        const snap = snapshot();
        snap.entities.collections.funding = {
            id: 'funding',
            title: '',
            file: '',
            entries: [
                entry('later', { status: 'planned', deadline: '2026-11-01' }),
                entry('first', {
                    status: 'planned',
                    meta: [{ label: 'Deadline', value: '2026-10-01' }]
                }),
                entry('sent', { status: 'submitted' }),
                entry('closed', { status: 'closed' })
            ]
        };
        const config = {
            fund_stages: [
                { label: 'Planned', color: 'configured-first-colour', statuses: ['planned'] },
                { label: 'Sent', color: 'configured-second-colour', statuses: ['submitted'] }
            ],
            focus_lane_tones: { funding: 'gold', jobs: 'violet', teaching: 'teal' }
        };
        const result = collectionLanes(snap, config);
        expect(result.tones).toEqual(config.focus_lane_tones);
        expect(
            result.funding.map(({ label, color, items }) => [
                label,
                color,
                items.map((item) => item.id)
            ])
        ).toEqual([
            ['Planned', 'configured-first-colour', ['first', 'later']],
            ['Sent', 'configured-second-colour', ['sent']]
        ]);
        expect(result.funding[0].items[0]).toEqual({
            id: 'first',
            title: 'first',
            entry: 'funding',
            deadline: '2026-10-01'
        });
        expect(
            collectionLanes(snap, {
                ...config,
                focus_lane_tones: { funding: 'teal', jobs: 'gold', teaching: 'violet' }
            }).tones.funding
        ).toBe('teal');
    });

    it('takes only active applications and ongoing education and carries their reveal addresses', () => {
        const snap = snapshot();
        for (const [key, status] of [
            ['applications', 'active'],
            ['education', 'ongoing']
        ]) {
            snap.entities.collections[key] = {
                id: key,
                title: '',
                file: '',
                entries: [
                    entry('included', { status, sub: 'Descriptor', deadline: '2026-10-01' }),
                    entry('excluded', { status: 'completed' })
                ]
            };
        }
        const result = collectionLanes(snap, {});
        for (const key of ['applications', 'education'] as const) {
            expect(result[key]).toEqual([
                {
                    id: 'included',
                    title: 'included',
                    entry: key,
                    deadline: '2026-10-01',
                    note: 'Descriptor'
                }
            ]);
        }
    });
});

describe('entryDate', () => {
    it('prefers deadline, then date, then a Deadline metadata row', () => {
        const meta = [{ label: ' Deadline ', value: '2026-12-03' }];
        expect(entryDate(entry('a', { deadline: '2026-10-01', date: '2026-11-02', meta }))).toBe(
            '2026-10-01'
        );
        expect(entryDate(entry('b', { date: '2026-11-02', meta }))).toBe('2026-11-02');
        expect(entryDate(entry('c', { date: '2026', meta }))).toBe('2026-12-03');
        expect(entryDate(entry('d', { meta: [{ label: 'Where', value: '2026-12-03' }] }))).toBe('');
    });

    it('gives a lane card no countdown for a bare date, as the cockpit does', () => {
        const meta = [{ label: 'Deadline', value: '2026-12-03' }];
        expect(entryDeadline(entry('e', { date: '2026-11-02' }))).toBe('');
        expect(entryDeadline(entry('f', { date: '2026-11-02', meta }))).toBe('2026-12-03');
        expect(entryDeadline(entry('g', { deadline: '2026-10-01', meta }))).toBe('2026-10-01');
    });
});

describe('manifestsBehind', () => {
    it('names four of five eligible projects in lag order and reports one more through the ticker', () => {
        const all = [
            project('a', 2),
            project('b', 5, 'manuscript'),
            project('c', 4),
            project('d', 3),
            project('e', 6),
            project('fresh', 1),
            project('idea', 20, 'idea')
        ];
        const config = { stale_lag_days: 2 };
        const expected = {
            count: 5,
            projects: [
                { id: 'e', label: 'e', days: 6 },
                { id: 'b', label: 'b', days: 5 },
                { id: 'c', label: 'c', days: 4 },
                { id: 'd', label: 'd', days: 3 }
            ],
            more: 1
        };
        expect(manifestsBehind(all, config)).toEqual(expected);
        const snap = snapshot();
        snap.entities.projects = Object.fromEntries(all.map((item) => [item.id, item]));
        expect(ticker(snap, config, Date.UTC(2026, 8, 12)).behind).toEqual(expected);
        expect(manifestsBehind(all, { stale_lag_days: 21 })).toBeNull();
    });

    it('does not invent a grace when the required setting is absent or invalid', () => {
        expect(manifestsBehind([project('a', 10)], {})).toBeNull();
        expect(manifestsBehind([project('a', 10)], { stale_lag_days: 'bad' })).toBeNull();
    });
});
