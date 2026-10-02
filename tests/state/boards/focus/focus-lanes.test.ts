// Layer 2, state tests. Collection dates, configured colours and manifest lag are derived solely
// from arguments, without installing a vocabulary or using a browser.

import { describe, expect, it } from 'vitest';
import {
    collectionLanes,
    entryDate,
    entryDeadline,
    manifestsBehind,
    stageItemCount
} from '../../../../src/lib/state/boards/focus-lanes.ts';
import { focusLabel } from '../../../../src/lib/state/boards/focus.ts';
import { ticker, type TickerItem } from '../../../../src/lib/state/boards/ticker.ts';
import type { Entry, Project, Snapshot } from '../../../../src/lib/data/model/index.ts';
import { NO_FEEDS } from '../../../fixtures/entities-fixture.ts';
import { bandHasCards } from '../../../../src/lib/state/boards/focus-lanes.ts';

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
            personal: {},
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

describe('the items of the band stages', () => {
    it('are counted over every stage together', () => {
        const stages = [
            { label: 'a', color: '', items: [{}, {}] },
            { label: 'b', color: '', items: [{}] }
        ] as unknown as Parameters<typeof stageItemCount>[0];
        expect(stageItemCount(stages)).toBe(3);
    });
});

describe('whether the band holds a card', () => {
    it('is whether any of its three rows holds one', () => {
        const band = (funding: number, applications: number, education: number) =>
            ({
                tones: { funding: '', jobs: '', teaching: '' },
                funding: Array.from({ length: funding }, () => ({})),
                applications: Array.from({ length: applications }, () => ({})),
                education: Array.from({ length: education }, () => ({}))
            }) as unknown as Parameters<typeof bandHasCards>[0];
        expect(bandHasCards(band(0, 0, 1))).toBe(true);
        expect(bandHasCards(band(0, 0, 0))).toBe(false);
    });
});

describe('focusLabel', () => {
    const titled = {
        ...project('hcc', 0),
        title: 'Hepatocellular carcinoma network',
        short: 'HCC'
    };
    const plain = { ...project('plain', 0), title: 'Plain title' };

    it('gives the short name under short and the whole title under full', () => {
        expect(focusLabel(titled, 'short')).toBe('HCC');
        expect(focusLabel(titled, 'full')).toBe('Hepatocellular carcinoma network');
    });

    it('gives the short name for a mode that is missing or unknown', () => {
        expect(focusLabel(titled, undefined)).toBe('HCC');
        expect(focusLabel(titled, 'wide')).toBe('HCC');
    });

    it('gives the title under every mode for a project with no short name', () => {
        expect(focusLabel(plain, 'short')).toBe('Plain title');
        expect(focusLabel(plain, 'full')).toBe('Plain title');
    });
});

describe('the project labels of the ticker', () => {
    const title = 'Hepatocellular carcinoma network';
    const titled: Project = {
        ...project('hcc', 0),
        title,
        short: 'HCC',
        deadline: '2026-09-20',
        followups: [{ do: 'chase', after: '2026-09-01' }],
        subtasks: [{ key: 'a', do: 'redraw', deadline: '2026-09-15', done: false }]
    };
    const held = snapshot();
    held.entities.projects = { hcc: titled };

    function labels(mode: string): (string | undefined)[] {
        const week = ticker(held, { focus_label_mode: mode }, Date.UTC(2026, 8, 11, 12));
        return [
            week.deadlines.find((one) => one.kind === 'paper')?.label,
            week.followups[0]?.label,
            week.subtasks[0]?.label
        ];
    }

    it('names a project by its short name in the paper, follow-up and subtask lines under short', () => {
        expect(labels('short')).toEqual(['HCC', 'HCC - chase', 'HCC: redraw']);
    });

    it('names it by the whole title in the same three lines under full', () => {
        expect(labels('full')).toEqual([title, `${title} - chase`, `${title}: redraw`]);
    });
});

/** A funding collection of the given entries, held under its own key. */
function fundingOf(...entries: Entry[]): Snapshot {
    const snap = snapshot();
    snap.entities.collections.funding = { id: 'funding', title: '', file: '', entries };
    return snap;
}

describe('the funding stages of the config', () => {
    const grants = fundingOf(
        entry('e1', { status: 'a' }),
        entry('e2', { status: ' B ' }),
        entry('e3', { status: 'planned' }),
        entry('e4', { status: 1 })
    );
    const card = (id: string) => ({ id, title: id, entry: 'funding', deadline: '' });

    it('gathers the entries whose status is one of the stage statuses, in the stage order', () => {
        const stages = [
            { label: 'A', color: '#7c5cff', statuses: [1, 'a', 'B', 'planned'] },
            { label: 'Z', statuses: ['planned'] }
        ];
        expect(collectionLanes(grants, { fund_stages: stages }).funding).toStrictEqual([
            { label: 'A', color: '#7c5cff', items: [card('e1'), card('e2'), card('e3')] },
            { label: 'Z', color: '', items: [card('e3')] }
        ]);
    });

    it('reads a row that is not a map as no stage and a row of the wrong types as a blank one', () => {
        const rows = [
            [],
            null,
            'x',
            3,
            { label: 3, color: 4, statuses: 'a' },
            { statuses: ['planned'] },
            { label: 'L', statuses: { 0: 'a' } }
        ];
        expect(collectionLanes(grants, { fund_stages: rows }).funding).toStrictEqual([
            { label: '', color: '', items: [card('e3')] }
        ]);
    });

    it('holds no stage when the rows are a map, a string or absent', () => {
        for (const stages of [{ a: 1 }, 'x', undefined]) {
            expect(collectionLanes(grants, { fund_stages: stages }).funding).toStrictEqual([]);
        }
    });
});

describe('the lane tones of the config', () => {
    const tones = (held: unknown) => collectionLanes(snapshot(), { focus_lane_tones: held }).tones;
    const blank = { funding: '', jobs: '', teaching: '' };

    it('are blank for a list, a string or nothing', () => {
        expect(tones([])).toStrictEqual(blank);
        expect(tones('x')).toStrictEqual(blank);
        expect(tones(undefined)).toStrictEqual(blank);
    });

    it('keep a string value and blank a value of another type', () => {
        expect(tones({ funding: 3, jobs: 'j', teaching: null })).toStrictEqual({
            funding: '',
            jobs: 'j',
            teaching: ''
        });
    });

    it('read the three names off the map itself, and not off an own key named __proto__', () => {
        const held: unknown = JSON.parse('{"__proto__":{"funding":"gold"},"jobs":"j"}');
        expect(tones(held)).toStrictEqual({ funding: '', jobs: 'j', teaching: '' });
    });
});

describe('the cards of the band', () => {
    it('take the note, else the descriptor, and a deadline only from the entry fields they name', () => {
        const snap = snapshot();
        snap.entities.collections.applications = {
            id: 'applications',
            title: '',
            file: '',
            entries: [
                entry('a1', { status: ' ACTIVE ', note: 3, sub: 'subtxt', deadline: 7 }),
                entry('a2', { status: 'active', note: 'n', sub: 's', deadline: '2026-09-30' }),
                entry('a3', { status: ['active'] }),
                entry('a4', {
                    status: 'active',
                    note: '',
                    sub: 4,
                    meta: { label: 'Deadline', value: '2026-10-02' }
                })
            ]
        };
        expect(collectionLanes(snap, {}).applications).toStrictEqual([
            { id: 'a2', title: 'a2', entry: 'applications', deadline: '2026-09-30', note: 'n' },
            { id: 'a1', title: 'a1', entry: 'applications', deadline: '', note: 'subtxt' },
            { id: 'a4', title: 'a4', entry: 'applications', deadline: '' }
        ]);
        expect(Object.keys(collectionLanes(snap, {}).applications[2])).toStrictEqual([
            'id',
            'title',
            'entry',
            'deadline'
        ]);
    });
});

describe('the dates of an entry', () => {
    const both = (fields: Record<string, unknown>) => [
        entryDate(entry('e', fields)),
        entryDeadline(entry('e', fields))
    ];
    const deadline = (value: unknown) => ({ label: 'Deadline', value });

    it('read a metadata block only when it is a list, and its rows only when they are maps', () => {
        expect(both({ meta: deadline('2026-10-02') })).toStrictEqual(['', '']);
        expect(both({ meta: 'x' })).toStrictEqual(['', '']);
        expect(both({ meta: null })).toStrictEqual(['', '']);
        expect(both({ meta: [] })).toStrictEqual(['', '']);
        expect(both({ meta: [deadline('2026-10-02')] })).toStrictEqual([
            '2026-10-02',
            '2026-10-02'
        ]);
    });

    it('skip the rows that are not a Deadline row with a whole day and take the first that is', () => {
        const rows = [
            null,
            3,
            [],
            { label: 3, value: '2026-10-01' },
            deadline(3),
            deadline('2026'),
            { label: ' DEADLINE ', value: ' 2026-10-03 ' },
            deadline('2026-10-04')
        ];
        expect(both({ meta: rows })).toStrictEqual(['2026-10-03', '2026-10-03']);
    });

    it('take a deadline that is a padded day and ignore one of another type or form', () => {
        const date = { date: '2026-11-02' };
        expect(both({ ...date, deadline: ' 2026-10-01 ' })).toStrictEqual([
            '2026-10-01',
            '2026-10-01'
        ]);
        for (const value of [3, null, [], { a: 1 }, '2026-10-01T10:00', '2026-1-1', NaN]) {
            expect(both({ ...date, deadline: value })).toStrictEqual(['2026-11-02', '']);
        }
        expect(both({ deadline: ['2026-10-01'], date: ['2026-11-02'] })).toStrictEqual(['', '']);
    });

    it('take a bare date that is a padded day and ignore one of another type', () => {
        expect(both({ date: ' 2026-11-02 ' })).toStrictEqual(['2026-11-02', '']);
        expect(both({ date: 3 })).toStrictEqual(['', '']);
        expect(both({ date: null })).toStrictEqual(['', '']);
    });
});

describe('the lag setting of the manifests behind', () => {
    const line = { count: 1, projects: [{ id: 'a', label: 'a', days: 5 }], more: 0 };
    const rows: [string, unknown, boolean][] = [
        ['a number', 3, true],
        ['zero', 0, true],
        ['a negative number', -1, true],
        ['a number written as a string', '3', false],
        ['NaN', NaN, false],
        ['Infinity', Infinity, false],
        ['null', null, false],
        ['true', true, false],
        ['a list', [], false],
        ['a map', {}, false]
    ];

    it.each(rows)('reads %s', (_, lag, held) => {
        expect(manifestsBehind([project('a', 5)], { stale_lag_days: lag })).toStrictEqual(
            held ? line : null
        );
    });

    it('labels a project by its short name, and by its title when the short name is empty', () => {
        const held = [
            { ...project('a', 5), short: '' },
            { ...project('b', 4), short: 'B' }
        ];
        expect(manifestsBehind(held, { stale_lag_days: 1 })?.projects).toStrictEqual([
            { id: 'a', label: 'a', days: 5 },
            { id: 'b', label: 'B', days: 4 }
        ]);
    });
});

describe('the entry fields the ticker reads', () => {
    const NOW = Date.UTC(2026, 8, 11, 12);

    /** What each group of the ticker holds for one entry, as kind, label, days, state and key. */
    function groups(fields: Record<string, unknown>, key = 'tasks', config = {}) {
        const snap = snapshot();
        snap.entities.collections[key] = {
            id: key,
            title: '',
            file: '',
            entries: [entry('e', fields)]
        };
        const week = ticker(snap, config, NOW);
        const rows = (lines: TickerItem[]) =>
            lines.map((one) => [one.kind, one.label, one.days, one.snoozed, one.target?.subtask]);
        return {
            deadlines: rows(week.deadlines),
            followups: rows(week.followups),
            subtasks: rows(week.subtasks),
            tasks: rows(week.tasks),
            snoozed: rows(week.snoozed)
        };
    }
    const own = ['task', 'e', null, false, undefined];

    it('reads a followup list item by item: a string, a map with its do and after, nothing else', () => {
        const followup = [
            'a string',
            { do: 'map', after: '2026-09-01' },
            3,
            { do: 3 },
            { after: '2026-09-01' },
            null,
            ['x'],
            { do: 'later', after: 3 },
            { do: '  ' },
            { do: 'future', after: '2026-12-01' },
            { do: 'bad', after: 'soon' }
        ];
        expect(groups({ followup })).toStrictEqual({
            deadlines: [],
            followups: [['followup', 'e - map', -10, false, undefined]],
            subtasks: [],
            tasks: [
                ['followup', 'e - a string', null, false, undefined],
                ['followup', 'e - later', null, false, undefined],
                ['followup', 'e - bad', null, false, undefined],
                own
            ],
            snoozed: []
        });
    });

    it('reads a followup written as one string or one map, and none written as another type', () => {
        const none = { deadlines: [], followups: [], subtasks: [], snoozed: [], tasks: [own] };
        expect(groups({ followup: 'one' }).tasks).toStrictEqual([
            ['followup', 'e - one', null, false, undefined],
            own
        ]);
        expect(groups({ followup: { do: 'one', after: '2026-09-02' } }).followups).toStrictEqual([
            ['followup', 'e - one', -9, false, undefined]
        ]);
        for (const followup of [3, null, { do: ['a', 'b'] }]) {
            expect(groups({ followup })).toStrictEqual(none);
        }
    });

    it('reads a subtasks list item by item and groups its lines under the entry kind', () => {
        const subtasks = [
            'str',
            { do: 'm', deadline: '2026-09-20', done: true },
            { do: 'n', deadline: '2026-09-21', done: 'true' },
            3,
            { do: 3 },
            null,
            ['x'],
            { do: 'o', deadline: 3, snooze: 4 },
            { do: 'p', snooze: true, deadline: '2026-09-22' },
            { do: 'q', snooze: '2026-12-01', deadline: '2026-09-23' },
            { do: '  ' }
        ];
        expect(groups({ subtasks, kind: 'k' })).toStrictEqual({
            deadlines: [],
            followups: [],
            subtasks: [
                ['k', 'e: n', 10, false, '2'],
                ['k', 'e: p', 11, false, '8']
            ],
            tasks: [['k', 'e: str', null, false, '0'], ['k', 'e: o', null, false, '7'], own],
            snoozed: [['k', 'e: q', 12, true, '9']]
        });
    });

    it('reads a subtasks map by its own keys, and none written as a string or a number', () => {
        const subtasks = {
            one: 'x',
            two: { do: 'y', deadline: '2026-09-15' },
            three: 3,
            four: { do: ['a'] },
            five: null
        };
        expect(groups({ subtasks })).toStrictEqual({
            deadlines: [],
            followups: [],
            subtasks: [['', 'e: y', 4, false, 'two']],
            tasks: [['', 'e: x', null, false, 'one'], own],
            snoozed: []
        });
        for (const held of ['x', 3]) {
            expect(groups({ subtasks: held }).subtasks).toStrictEqual([]);
            expect(groups({ subtasks: held }).tasks).toStrictEqual([own]);
        }
    });

    it('groups subtask lines under the kind when it is a string and under none when it is not', () => {
        const subtasks = [{ do: 'a', deadline: '2026-09-15' }];
        expect(groups({ subtasks, kind: 3 }).subtasks).toStrictEqual([['', 'e: a', 4, false, '0']]);
        expect(groups({ subtasks, kind: 'zz' }).subtasks).toStrictEqual([
            ['zz', 'e: a', 4, false, '0']
        ]);
    });

    it('carries the whole line of an entry whose status is not a string', () => {
        const snap = snapshot();
        snap.entities.collections.tasks = {
            id: 'tasks',
            title: '',
            file: '',
            entries: [entry('e', { status: 3 })]
        };
        expect(ticker(snap, {}, NOW).tasks).toStrictEqual([
            {
                kind: 'task',
                glyph: 'tasks',
                label: 'e',
                days: null,
                snoozed: false,
                entry: 'tasks',
                status: '',
                target: { kind: 'entry', id: 'e', collection: 'tasks', statuses: [] }
            }
        ]);
    });

    it('leaves out an entry whose status the palette ends, and keeps one whose status is a list', () => {
        const config = { status_palette: { done: { terminal: true } } };
        expect(groups({ status: 'done' }, 'tasks', config).tasks).toStrictEqual([]);
        expect(groups({ status: ['done'] }, 'tasks', config).tasks).toStrictEqual([own]);
    });

    it('sleeps an entry for a snooze of true, a word or a later day and not for a number', () => {
        expect(groups({ snooze: 3 }).tasks).toStrictEqual([own]);
        for (const snooze of [true, 'yes', '2026-12-01']) {
            const held = groups({ snooze });
            expect(held.tasks).toStrictEqual([]);
            expect(held.snoozed).toStrictEqual([['task', 'e', null, true, undefined]]);
        }
    });

    it('dates an event by its deadline, then its date, and by no field of another type', () => {
        const event = ['event', 'e', 9, false, undefined];
        expect(groups({ deadline: '2026-09-20', status: 3 }, 'events').deadlines).toStrictEqual([
            event
        ]);
        expect(groups({ deadline: 3, date: '2026-09-20' }, 'events').deadlines).toStrictEqual([
            event
        ]);
        expect(groups({ deadline: ['2026-09-20'] }, 'events').deadlines).toStrictEqual([]);
        expect(groups({}, 'events').deadlines).toStrictEqual([]);
    });

    it('reads the horizon as a finite number and falls back to ninety days for any other value', () => {
        const days = (deadline_horizon_days: unknown) =>
            groups({ deadline: '2026-10-30' }, 'events', { deadline_horizon_days }).deadlines
                .length;
        expect([30, 0, -1].map(days)).toStrictEqual([0, 0, 0]);
        expect(['30', NaN, Infinity].map(days)).toStrictEqual([1, 1, 1]);
    });
});
