// The Focus board's arithmetic over a synthetic portfolio: the lanes, what sits on each of them,
// the ideas backlog, what is out for an answer, the ticker's six groups and the band under it.
//
// The vocabulary is the real config, so the lanes, the clusters, the status palette, the priority
// flames and the funding stages checked here are the ones config/vocab.yml holds. The portfolio is
// synthetic and `now` is fixed, so every count and every countdown is arithmetic over this file.
//
// What this does NOT cover: anything that needs a DOM. state/focus.ts touches none, which is the
// reason the board's counting lives there; the view over it is tests/views/focus.test.ts.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, vocabCatalog } from '../../src/lib/data/sources/config.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import {
    backlog,
    band,
    holdingTone,
    laneItems,
    lanes,
    priorities,
    ticker,
    unplaced,
    venueLoad,
    waiting
} from '../../src/lib/state/focus.ts';
import type {
    Collection,
    Entry,
    Funding,
    Id,
    Project,
    Relations,
    Snapshot,
    Tier,
    Venue
} from '../../src/lib/data/model.ts';

const { config } = loadConfig(engineDir());
setVocab(vocabCatalog(config));

/** Noon on 2026-09-11, so every countdown below is whole days from that day. */
const NOW = Date.UTC(2026, 8, 11, 12);

const EMPTY_RELATIONS: Relations = {
    projectVenue: [],
    projectFunding: [],
    projectDataset: [],
    projectProgram: [],
    projectDomain: [],
    projectRelated: [],
    fundingProgram: []
};

function project(id: Id, tier: Tier, over: Partial<Project> = {}): Project {
    return {
        id,
        tier,
        title: id,
        chips: [],
        results: [],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        relatedIds: [],
        fundingIds: [],
        datasetIds: [],
        programIds: [],
        domainIds: [],
        collaborators: [],
        docs: [],
        folder: `projects/${tier}/${id}`,
        file: `/hub/projects/${tier}/${id}/project.yml`,
        ...over
    };
}

function venue(id: Id, over: Partial<Venue> = {}): Venue {
    return { id, name: id, themes: [], ...over };
}

function scheme(id: Id, over: Partial<Funding> = {}): Funding {
    return {
        id,
        title: id,
        followups: [],
        subtasks: [],
        tags: [],
        projectIds: [],
        programIds: [],
        ...over
    };
}

function collection(id: string, rows: Record<string, unknown>[]): Collection {
    const file = `/hub/${id}.yml`;
    const entries: Entry[] = rows.map((fields, index) => ({
        id: String(fields.key ?? fields.title ?? index),
        title: String(fields.title ?? ''),
        fields,
        file,
        index
    }));
    return { id, title: id, file, entries };
}

/**
 * One project per case the board has to answer for: a lane with two cards to sort, a past deadline,
 * a deadline ten days out on a conference venue, a snooze, two follow-ups, a checklist, a person
 * waited on, a paper at a venue, a parked idea, a loose idea and a manuscript on no lane.
 */
function snapshot(): Snapshot {
    const projects = [
        project('run-dated', 'active', {
            type: 'active',
            title: 'Dated',
            focus: 'run',
            deadline: '2026-09-21',
            venueId: 'confx'
        }),
        project('run-plain', 'active', { type: 'active', title: 'Plain', focus: 'run' }),
        project('push-late', 'manuscripts', {
            type: 'manuscript',
            title: 'Late',
            focus: 'push',
            deadline: '2026-09-01'
        }),
        project('review-out', 'manuscripts', {
            type: 'manuscript',
            focus: 'review',
            chips: ['submitted'],
            venueId: 'jbi',
            deadline: '2026-09-05'
        }),
        project('blocked-one', 'active', { type: 'active', focus: 'blocked', chips: ['blocked'] }),
        project('scope-wait', 'active', { type: 'active', focus: 'scope', waitingOn: ['someone'] }),
        project('derisk-snoozed', 'active', {
            type: 'active',
            focus: 'derisk',
            deadline: '2026-09-15',
            snooze: '2026-10-01'
        }),
        project('build-notes', 'active', {
            type: 'active',
            focus: 'build',
            followups: [{ do: 'chase the coauthor' }, { do: 'much later', after: '2026-12-01' }]
        }),
        project('backburner-list', 'active', {
            type: 'active',
            focus: 'backburner',
            subtasks: [
                { key: 'a', do: 'redraw figure 2', deadline: '2026-09-20', done: false },
                { key: 'b', do: 'already done', done: true }
            ]
        }),
        project('idea-parked', 'ideas', { type: 'idea', focus: 'holding' }),
        project('idea-loose', 'ideas', { type: 'idea' }),
        project('unplaced-ms', 'manuscripts', { type: 'manuscript' })
    ];
    return {
        version: 1,
        entities: {
            projects: Object.fromEntries(projects.map((one) => [one.id, one])),
            venues: {
                confx: venue('confx', {
                    name: 'Conference X',
                    short: 'ConfX',
                    deadline: '2026-09-25'
                }),
                confy: venue('confy', {
                    name: 'Conference Y',
                    short: 'ConfY',
                    deadlineMonth: 'Oct'
                }),
                jbi: venue('jbi', { name: 'Journal of Biomedical Informatics', short: 'JBI' })
            },
            datasets: {},
            programs: {},
            domains: {},
            funding: {
                prep: scheme('prep', {
                    title: 'A grant in prep',
                    status: 'in-prep',
                    deadline: '2026-09-20'
                }),
                sent: scheme('sent', { title: 'A grant sent', status: 'submitted' })
            },
            collections: {
                events: collection('events', [
                    { title: 'An old talk', status: 'past', date: '2026-09-01' },
                    { title: 'A coming talk', status: 'upcoming', date: '2026-09-18' }
                ]),
                education: collection('education', [
                    { title: 'A course', status: 'ongoing', kind: 'teaching' }
                ]),
                applications: collection('applications', [
                    { title: 'A position', status: 'active', deadline: '2026-09-14' }
                ]),
                collaborations: collection('collaborations', [
                    { key: 'someone', title: 'Some One', status: 'active' }
                ]),
                tasks: collection('tasks', [
                    {
                        title: 'A review to write',
                        status: 'todo',
                        kind: 'review',
                        subtasks: [{ do: 'read the paper' }]
                    }
                ])
            }
        },
        relations: EMPTY_RELATIONS,
        findings: []
    };
}

const snap = snapshot();
const all = Object.values(snap.entities.projects);
const board = lanes(config);
const week = ticker(snap, config, NOW);

describe('lanes', () => {
    it('reads the nine lanes of vocab.yml in three clusters, each hue already a tone', () => {
        expect(board.map((one) => one.key)).toEqual([
            'run',
            'push',
            'revise',
            'review',
            'blocked',
            'backburner',
            'scope',
            'derisk',
            'build'
        ]);
        expect(board[0]).toEqual({
            key: 'run',
            label: 'Run',
            sub: 'experiments / getting the numbers',
            tone: 'green',
            cluster: 'now'
        });
        expect(board.filter((one) => one.cluster === 'now')).toHaveLength(3);
    });

    it('reads the ideas colour and the priority levels out of the same file', () => {
        expect(holdingTone(config)).not.toBe('');
        expect(priorities(config).map((one) => [one.key, one.flames])).toEqual([
            ['high', 3],
            ['med', 2],
            ['low', 1]
        ]);
    });
});

describe('laneItems', () => {
    it('puts a project on the lane its focus names, deadline first then title', () => {
        const held = laneItems(all, board);
        expect(held.run.map((one) => one.id)).toEqual(['run-dated', 'run-plain']);
        expect(held.push.map((one) => one.id)).toEqual(['push-late']);
    });

    it('leaves holding and an unset focus off every lane', () => {
        const held = laneItems(all, board);
        expect(
            Object.values(held)
                .flat()
                .map((one) => one.id)
        ).not.toContain('idea-parked');
        expect(
            Object.values(held)
                .flat()
                .map((one) => one.id)
        ).not.toContain('unplaced-ms');
    });
});

describe('backlog and unplaced', () => {
    it('takes the parked idea and the idea on no lane', () => {
        expect(backlog(all, board).map((one) => one.id)).toEqual(['idea-loose', 'idea-parked']);
    });

    it('names the manuscript that belongs on a lane and has none', () => {
        expect(unplaced(all).map((one) => one.id)).toEqual(['unplaced-ms']);
    });
});

describe('waiting', () => {
    it('resolves a person, counts a paper by its venue and counts the rest as blocked', () => {
        const strip = waiting(all, snap.entities.venues, { someone: 'Some One' });
        expect(strip.people).toEqual([{ label: 'Some One', count: 1 }]);
        expect(strip.venues).toEqual([{ label: 'JBI', count: 1 }]);
        expect(strip.blocked).toBe(1);
    });
});

describe('ticker, overdue', () => {
    it('takes a project deadline that has passed and leaves a terminal entry alone', () => {
        expect(week.overdue.map((one) => [one.kind, one.label, one.days])).toEqual([
            ['paper', 'Late', -10]
        ]);
    });
});

describe('ticker, deadlines', () => {
    it('groups by category in the order of CATEGORIES, soonest first inside each', () => {
        expect(week.deadlines.map((one) => [one.kind, one.label, one.days])).toEqual([
            ['paper', 'Dated', 10],
            ['funding', 'A grant in prep', 9],
            ['event', 'A coming talk', 7],
            ['conference', 'ConfY', null]
        ]);
    });

    it('folds a conference into the paper aimed at it and drops that call of its own', () => {
        const paper = week.deadlines.find((one) => one.kind === 'paper');
        expect(paper?.venue).toBe('ConfX');
        expect(week.deadlines.map((one) => one.label)).not.toContain('ConfX');
    });

    it('dates a call with no exact deadline by the months to its usual one', () => {
        expect(week.deadlines.find((one) => one.label === 'ConfY')?.months).toBe(1);
    });

    it('leaves a submitted paper off, since its own deadline is met', () => {
        expect(week.deadlines.map((one) => one.id)).not.toContain('review-out');
        expect(week.overdue.map((one) => one.id)).not.toContain('review-out');
    });
});

describe('ticker, follow-ups and subtasks', () => {
    it('takes a note with no after and leaves one whose after has not passed', () => {
        expect(week.followups.map((one) => one.label)).toEqual([
            'build-notes - chase the coauthor'
        ]);
    });

    it('takes a pending subtask with its days and leaves the one already done', () => {
        const dated = week.subtasks.filter((one) => one.days !== null);
        expect(dated.map((one) => [one.label, one.days])).toEqual([
            ['backburner-list: redraw figure 2', 9]
        ]);
    });

    it('groups an undated subtask by the kind of the entry that holds it', () => {
        const open = week.subtasks.filter((one) => one.days === null);
        expect(open.map((one) => [one.kind, one.label])).toEqual([
            ['review', 'A review to write: read the paper']
        ]);
    });
});

describe('ticker, snooze', () => {
    it('sends a project whose snooze is still ahead to the snoozed group and nowhere else', () => {
        expect(week.snoozed.map((one) => [one.id, one.snoozed])).toEqual([
            ['derisk-snoozed', true]
        ]);
        expect(week.deadlines.map((one) => one.id)).not.toContain('derisk-snoozed');
    });
});

describe('venueLoad', () => {
    it('warns at the threshold and not one below it', () => {
        const venues = { bspc: venue('bspc', { short: 'BSPC' }) };
        const aimed = (count: number) =>
            Array.from({ length: count }, (_, at) =>
                project(`p${at}`, 'active', { venueId: 'bspc' })
            );
        expect(venueLoad(aimed(3), venues, 4)).toEqual([]);
        expect(venueLoad(aimed(4), venues, 4)).toEqual([{ label: 'BSPC', count: 4 }]);
    });
});

describe('band', () => {
    it('stacks the grants by the stage their status names, with the days to each', () => {
        const cards = band(snap, config, NOW);
        expect(cards.funding.map((stage) => [stage.label, stage.items.length])).toEqual([
            ['In prep', 1],
            ['Submitted', 1]
        ]);
        expect(cards.funding[0].items[0]).toEqual({ title: 'A grant in prep', days: 9 });
    });

    it('takes the positions still out and the teaching of this academic year', () => {
        const cards = band(snap, config, NOW);
        expect(cards.applications.map((one) => one.title)).toEqual(['A position']);
        expect(cards.education.map((one) => one.title)).toEqual(['A course']);
    });
});
