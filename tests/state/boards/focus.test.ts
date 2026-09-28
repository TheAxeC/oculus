// The Focus board's arithmetic over a synthetic portfolio: the lanes, what sits on each of them,
// the ideas backlog, what is out for an answer, the ticker's six groups and the band under it.
//
// The vocabulary is the real config, so the lanes, the clusters, the status palette, the priority
// flames and the funding stages checked here are the ones config/catalogs/vocab.yml holds. The
// portfolio is synthetic and `now` is fixed, so every count and every countdown is arithmetic over
// this file.
//
// What this does NOT cover: anything that needs a DOM. state/boards/focus.ts touches none, which is
// the reason the board's counting lives there; the view over it is
// tests/views/boards/focus.test.ts.

import { describe, expect, it } from 'vitest';
import { NO_FEEDS } from '../../fixtures/entities-fixture.ts';
import { attention, refresh, staleAfter } from '../../../src/lib/state/feeds/feeds.ts';
import { engineDir, loadConfig, vocabCatalog } from '../../../src/lib/data/sources/config.ts';
import { scalar } from '../../../src/lib/data/helpers/guards.ts';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import {
    backlog,
    holdingTone,
    laneItems,
    movable,
    lanes,
    priorities,
    unplaced,
    waiting,
    lanesIn,
    liveProjects,
    nextPriority,
    type Lane,
    type Priority
} from '../../../src/lib/state/boards/focus.ts';
import {
    ticker,
    venueLoad,
    deadlinesByCategory,
    runsByKind,
    type TickerItem
} from '../../../src/lib/state/boards/ticker.ts';
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
} from '../../../src/lib/data/model/index.ts';

const { config } = loadConfig(engineDir());
setVocab(vocabCatalog(config));

/** Noon of the day NOW names, so every countdown below is whole days from that day. */
const NOW = Date.UTC(2026, 8, 11, 12);

const EMPTY_RELATIONS: Relations = {
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
};

function project(id: Id, tier: Tier, over: Partial<Project> = {}): Project {
    return {
        id,
        tier,
        ghost: false,
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
        pillarIds: [],
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
        pillarIds: [],
        ...over
    };
}

function collection(
    id: string,
    rows: Record<string, unknown>[],
    statuses: string[] = []
): Collection {
    const file = `/hub/${id}.yml`;
    const entries: Entry[] = rows.map((fields, index) => ({
        id: scalar(fields.key ?? fields.title, String(index)),
        title: scalar(fields.title),
        fields,
        file,
        index
    }));
    const held: Collection = { id, title: id, file, entries };
    if (statuses.length > 0) {
        held.schema = [
            { field: 'title', type: 'text' },
            { field: 'status', type: 'select', options: statuses }
        ];
    }
    return held;
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
        project('run-plain', 'active', {
            type: 'active',
            title: 'Plain',
            focus: 'run',
            staleDays: 3
        }),
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
            feeds: {
                leads: [
                    { title: 'A lead', deadline: '2026-09-20', status: 'open', fit: 'strong' },
                    { title: 'A far lead', deadline: '2026-12-01', status: 'open', fit: null },
                    {
                        title: 'A dismissed lead',
                        deadline: '2026-09-20',
                        status: 'dismissed',
                        fit: 'strong'
                    }
                ],
                radar: { lastRun: '2026-08-20' },
                scout: { lastRun: '2026-09-09' },
                linkedin: { lastPost: '2026-06-01' }
            },
            career: {
                title: 'Career strategy',
                milestone: 'FWO Senior (Nov 2026)',
                situation: [],
                order: [],
                hosts: [
                    { name: 'Naesens', status: 'awaiting', scores: {} },
                    { name: 'Vermeesch', status: 'candidate', scores: {} }
                ],
                hostCriteria: [],
                notHosts: [],
                eligibility: null,
                dropped: []
            },
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
            pillars: {},
            domains: {},
            funding: {
                prep: scheme('prep', {
                    title: 'A grant in prep',
                    status: 'in-prep',
                    deadline: '2026-09-20',
                    followups: [{ do: 'ask the officer' }]
                }),
                sent: scheme('sent', { title: 'A grant sent', status: 'submitted' })
            },
            people: {},
            organisations: {},
            collections: {
                funding: collection('funding', [
                    {
                        key: 'prep',
                        title: 'A grant in prep',
                        status: 'in-prep',
                        deadline: '2026-09-20'
                    },
                    { key: 'sent', title: 'A grant sent', status: 'submitted' }
                ]),
                events: collection(
                    'events',
                    [
                        { title: 'An old talk', status: 'past', date: '2026-09-01' },
                        { title: 'A coming talk', status: 'upcoming', date: '2026-09-18' }
                    ],
                    ['upcoming', 'planned', 'not-attending', 'past']
                ),
                education: collection('education', [
                    { title: 'A course', status: 'ongoing', kind: 'teaching' }
                ]),
                applications: collection('applications', [
                    { title: 'A position', status: 'active', deadline: '2026-09-14' },
                    { title: 'One out for an answer', status: 'applied' }
                ]),
                'joint-work': collection('joint-work', [
                    { key: 'someone', title: 'A shared paper', person: 'someone', status: 'active' }
                ]),
                tasks: collection(
                    'tasks',
                    [
                        {
                            title: 'A review to write',
                            status: 'todo',
                            kind: 'review',
                            subtasks: [{ do: 'read the paper' }]
                        },
                        { title: 'A dated chore', status: 'todo', deadline: '2026-09-16' },
                        { title: 'A finished chore', status: 'done' },
                        { title: 'A chore put off', status: 'todo', snooze: '2026-10-01' }
                    ],
                    ['todo', 'doing', 'done']
                )
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

describe('laneItems over every tier', () => {
    /**
     * The fixture's projects with a coauthor and an archive paper on a lane, and two that are not.
     */
    function wider(): Project[] {
        const more = snapshot();
        const held = more.entities.projects;
        held['coauthor-lane'] = project('coauthor-lane', 'coauthor', {
            title: 'Coauthor on a lane',
            focus: 'revise',
            waitingOn: ['someone']
        });
        held['archive-lane'] = project('archive-lane', 'archive', {
            title: 'Archive on a lane',
            focus: 'review',
            chips: ['submitted'],
            venueId: 'jbi'
        });
        held['software-lane'] = project('software-lane', 'software', {
            title: 'Software on a lane',
            focus: 'build'
        });
        held['coauthor-holding'] = project('coauthor-holding', 'coauthor', { focus: 'holding' });
        held['archive-loose'] = project('archive-loose', 'archive', {});
        return Object.values(held);
    }

    // Revert: put `if (!live(project)) continue;` back at the head of laneItems' loop.
    it('draws a coauthor, an archive and a software project on the lane their focus names', () => {
        const held = laneItems(wider(), board);
        expect(held.revise.map((one) => one.id)).toEqual(['coauthor-lane']);
        expect(held.review.map((one) => one.id)).toEqual(['review-out', 'archive-lane']);
        expect(held.build.map((one) => one.id)).toEqual(['software-lane', 'build-notes']);
    });

    // Revert: return true from `movable` for every project, and a coauthor, archive or software
    // project dropped on the Ideas lane would be written to `holding` and leave the board.
    it('moves a project of any tier to a lane and only a live one to holding', () => {
        const byId = Object.fromEntries(wider().map((one) => [one.id, one]));
        for (const id of ['coauthor-lane', 'archive-lane', 'software-lane']) {
            expect(movable(byId[id], 'holding')).toBe(false);
            expect(movable(byId[id], 'run')).toBe(true);
        }
        for (const id of ['idea-loose', 'run-plain', 'unplaced-ms']) {
            expect(movable(byId[id], 'holding')).toBe(true);
            expect(movable(byId[id], 'run')).toBe(true);
        }
    });

    // Revert: let laneItems put a `holding` or an unset focus on a lane.
    it('leaves a coauthor project in holding and an archive project with no focus off every lane', () => {
        const drawn = Object.values(laneItems(wider(), board))
            .flat()
            .map((one) => one.id);
        expect(drawn).not.toContain('coauthor-holding');
        expect(drawn).not.toContain('archive-loose');
    });

    // Revert: drop `if (!live(project)) return false;` from backlog.
    it('keeps them out of the backlog and the unplaced hint', () => {
        const ids = [...backlog(wider(), board), ...unplaced(wider())].map((one) => one.id);
        expect(ids).toEqual(['idea-loose', 'idea-parked', 'unplaced-ms']);
    });

    // Revert: put `if (!live(project)) continue;` back at the head of waiting's tallies, and the
    // coauthor and archive projects on a lane leave the people and venue counts.
    it('counts the people and venues of the projects it draws on a lane, whatever their tier', () => {
        const more = snapshot();
        for (const one of wider()) more.entities.projects[one.id] = one;
        const wide = waiting(more, config, { someone: 'Some One' });
        const strip = waiting(snap, config, { someone: 'Some One' });
        expect(strip.people).toEqual([{ label: 'Some One', count: 1 }]);
        expect(wide.people).toEqual([{ label: 'Some One', count: 2 }]);
        expect(strip.venues).toEqual([{ label: 'JBI', count: 1 }]);
        expect(wide.venues).toEqual([{ label: 'JBI', count: 2 }]);
        expect(wide.blocked).toBe(strip.blocked);
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
    const strip = waiting(snap, config, { someone: 'Some One' });

    it('resolves a person, counts a paper by its venue and counts the rest as blocked', () => {
        expect(strip.people).toEqual([{ label: 'Some One', count: 1 }]);
        expect(strip.venues).toEqual([{ label: 'JBI', count: 1 }]);
        expect(strip.blocked).toBe(1);
    });

    it('counts a blocked project of every tier, not only the ones on the board', () => {
        const wider = snapshot();
        wider.entities.projects['blocked-archive'] = project('blocked-archive', 'archive', {
            chips: ['blocked']
        });
        wider.entities.projects['blocked-coauthor'] = project('blocked-coauthor', 'coauthor', {
            chips: ['blocked']
        });
        expect(waiting(wider, config, {}).blocked).toBe(strip.blocked + 2);
    });

    it('counts a blocked project once even when it is waiting on somebody as well', () => {
        const wider = snapshot();
        wider.entities.projects['blocked-waiting'] = project('blocked-waiting', 'archive', {
            chips: ['blocked'],
            waitingOn: ['someone']
        });
        wider.entities.projects['blocked-live-waiting'] = project(
            'blocked-live-waiting',
            'active',
            {
                chips: ['blocked'],
                waitingOn: ['someone']
            }
        );
        wider.entities.projects['blocked-submitted'] = project('blocked-submitted', 'archive', {
            chips: ['blocked', 'submitted']
        });
        expect(waiting(wider, config, {}).blocked).toBe(strip.blocked + 3);
    });

    // Revert: drop the tier and lane condition from waiting, so every project of every tier is
    // tallied, and the archive projects off the lanes and the coauthor in holding are counted.
    it('leaves a project of another tier that is on no lane out of the people and venue tallies', () => {
        const wider = snapshot();
        wider.entities.projects['archive-waiting'] = project('archive-waiting', 'archive', {
            waitingOn: ['someone']
        });
        wider.entities.projects['archive-submitted'] = project('archive-submitted', 'archive', {
            chips: ['submitted'],
            venueId: 'jbi'
        });
        wider.entities.projects['coauthor-holding'] = project('coauthor-holding', 'coauthor', {
            focus: 'holding',
            waitingOn: ['someone']
        });
        for (const focus of ['', 'submit', 'constructor', '__proto__']) {
            const id = `coauthor-focus-${focus}`;
            wider.entities.projects[id] = project(id, 'coauthor', {
                focus,
                chips: ['submitted'],
                venueId: 'jbi',
                waitingOn: ['someone']
            });
        }
        const wide = waiting(wider, config, { someone: 'Some One' });
        expect(wide.people).toEqual(strip.people);
        expect(wide.venues).toEqual(strip.venues);
        expect(wide.blocked).toBe(strip.blocked);
    });

    // Revert: put `if (!live(project)) continue;` back in waiting, and both coauthor projects leave
    // the tallies while the live counts stay as they were.
    it('counts a coauthor project on a lane under its person, and a submitted one under its venue', () => {
        const wider = snapshot();
        wider.entities.projects['coauthor-waits'] = project('coauthor-waits', 'coauthor', {
            focus: 'blocked',
            waitingOn: ['someone']
        });
        wider.entities.projects['coauthor-submitted'] = project('coauthor-submitted', 'coauthor', {
            focus: 'review',
            chips: ['submitted'],
            venueId: 'jbi'
        });
        const wide = waiting(wider, config, { someone: 'Some One' });
        expect(wide.people).toEqual([{ label: 'Some One', count: 2 }]);
        expect(wide.venues).toEqual([{ label: 'JBI', count: 2 }]);
        expect(wide.blocked).toBe(strip.blocked);
        delete wider.entities.projects['coauthor-waits'];
        delete wider.entities.projects['coauthor-submitted'];
        expect(waiting(wider, config, { someone: 'Some One' })).toEqual(strip);
    });

    it('draws a waiting-on value that is a project id by the label of that project', () => {
        const wider = snapshot();
        wider.entities.projects.other = project('other', 'active', {
            title: 'The Other One',
            short: 'Other'
        });
        wider.entities.projects.waits = project('waits', 'active', { waitingOn: ['other'] });
        expect(waiting(wider, config, {}).people).toEqual([
            { label: 'Other', count: 1 },
            { label: 'someone', count: 1 }
        ]);
    });

    it('names the grants whose date is met, the applications out, and the hosts emailed', () => {
        expect(strip.grants).toEqual(['A grant sent']);
        expect(strip.applications).toEqual(['One out for an answer']);
        expect(strip.hosts).toEqual(['Naesens']);
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
            ['position', 'A position', 3],
            ['position', 'A lead', 9],
            ['task', 'A dated chore', 5],
            ['conference', 'ConfY', null]
        ]);
    });

    it('takes a live lead inside the leads window, leaving one beyond it and a dismissed one', () => {
        const leads = week.deadlines.filter((one) => one.target?.kind === 'lead');
        expect(leads.map((one) => one.label)).toEqual(['A lead']);
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
        const notes = week.tasks.filter((one) => one.kind === 'followup');
        expect(notes.map((one) => one.label)).toEqual([
            'build-notes - chase the coauthor',
            'A grant in prep - ask the officer'
        ]);
        expect(week.followups).toEqual([]);
        expect([...week.followups, ...week.tasks].map((one) => one.label)).not.toContain(
            'build-notes - much later'
        );
    });

    it('takes a scheme note, which carries no target, onto the tasks as a follow-up line', () => {
        const note = week.tasks.find((one) => one.label === 'A grant in prep - ask the officer');
        expect([note?.kind, note?.days, note?.target]).toEqual(['followup', null, undefined]);
    });

    it('takes a pending subtask with its days and leaves the one already done', () => {
        expect(week.subtasks.map((one) => [one.label, one.days])).toEqual([
            ['backburner-list: redraw figure 2', 9]
        ]);
        expect(week.tasks.map((one) => one.label)).not.toContain('backburner-list: already done');
    });

    it('groups an undated subtask by the kind of the entry that holds it', () => {
        const open = week.tasks.filter((one) => one.target?.subtask !== undefined);
        expect(open.map((one) => [one.kind, one.label])).toEqual([
            ['review', 'A review to write: read the paper']
        ]);
    });
});

describe('ticker, the undated tasks the command center does not carry', () => {
    it('sends a dated note to the follow-ups and an undated one to the tasks', () => {
        const dated = { do: 'the dated note', after: '2026-09-01' };
        const week = ticker(
            {
                ...snap,
                entities: {
                    ...snap.entities,
                    projects: {
                        holder: project('holder', 'active', {
                            followups: [dated, { do: 'the open note' }]
                        })
                    }
                }
            },
            config,
            NOW
        );
        expect(week.followups.map((one) => one.label)).toEqual(['holder - the dated note']);
        const notes = week.tasks.filter((one) => one.target?.kind === 'followup');
        expect(notes.map((one) => one.label)).toEqual(['holder - the open note']);
    });

    it('keeps a dated subtask on the command center and moves an undated one to the tasks', () => {
        expect(week.subtasks.every((one) => one.days !== null)).toBe(true);
        expect(week.subtasks.map((one) => one.label)).toContain('backburner-list: redraw figure 2');
        expect(week.tasks.map((one) => one.label)).toContain('A review to write: read the paper');
    });

    it('makes an undated task entry a task line and a dated one a deadline line', () => {
        const open = week.tasks.find((one) => one.label === 'A review to write');
        expect(open?.kind).toBe('task');
        expect(open?.days).toBe(null);
        expect(open?.target).toEqual({
            kind: 'entry',
            id: 'A review to write',
            collection: 'tasks',
            statuses: ['todo', 'doing', 'done']
        });
        expect(week.deadlines.map((one) => one.label)).toContain('A dated chore');
        expect(week.tasks.map((one) => one.label)).not.toContain('A dated chore');
    });

    it('leaves a terminal entry off every list and sends a snoozed one to the snoozed group', () => {
        const every = [...week.deadlines, ...week.overdue, ...week.tasks];
        expect(every.map((one) => one.label)).not.toContain('A finished chore');
        expect(every.map((one) => one.label)).not.toContain('A chore put off');
        expect(week.snoozed.map((one) => one.label)).toContain('A chore put off');
    });
});

describe('ticker, snooze', () => {
    it('sends a project whose snooze is still ahead to the snoozed group and nowhere else', () => {
        const projects = week.snoozed.filter((one) => one.id !== undefined);
        expect(projects.map((one) => [one.id, one.snoozed])).toEqual([['derisk-snoozed', true]]);
        expect(week.deadlines.map((one) => one.id)).not.toContain('derisk-snoozed');
    });
});

describe('venueLoad', () => {
    it('warns at the threshold and keeps equal labels separate by registry id', () => {
        const venues = {
            bspc: venue('bspc', { short: 'Same' }),
            jbi: venue('jbi', { short: 'Same' })
        };
        const aimed = (id: string, count: number) =>
            Array.from({ length: count }, (_, at) =>
                project(`${id}-${at}`, 'active', { venueId: id })
            );
        expect(venueLoad(aimed('bspc', 3), venues, 4)).toEqual([]);
        expect(venueLoad([...aimed('bspc', 4), ...aimed('jbi', 4)], venues, 4)).toEqual([
            { id: 'bspc', label: 'Same', count: 4 },
            { id: 'jbi', label: 'Same', count: 4 }
        ]);
    });
});

describe('what a line can be written to', () => {
    /** The first line of the ticker whose label is the one given, wherever it sits. */
    function lineOf(label: string) {
        const every = [
            ...week.overdue,
            ...week.deadlines,
            ...week.followups,
            ...week.subtasks,
            ...week.tasks,
            ...week.snoozed
        ];
        return every.find((one) => one.label === label);
    }

    it('points a project deadline at its manifest', () => {
        expect(lineOf('Dated')?.target).toEqual({ kind: 'manifest', id: 'run-dated' });
        expect(lineOf('Late')?.target).toEqual({ kind: 'manifest', id: 'push-late' });
    });

    it('points a funding deadline at its scheme', () => {
        expect(lineOf('A grant in prep')?.target).toEqual({ kind: 'funding', id: 'prep' });
    });

    it('points an entry at its collection, with that file own lifecycle statuses', () => {
        const line = lineOf('A coming talk');
        expect(line?.target?.kind).toBe('entry');
        expect(line?.target?.collection).toBe('events');
        expect(line?.target?.statuses).toEqual(['upcoming', 'planned', 'not-attending', 'past']);
        expect(line?.status).toBe('upcoming');
    });

    it('points a subtask at its host and at the key of its own line', () => {
        expect(lineOf('backburner-list: redraw figure 2')?.target).toEqual({
            kind: 'manifest',
            id: 'backburner-list',
            subtask: 'a'
        });
        expect(lineOf('A review to write: read the paper')?.target).toEqual({
            kind: 'entry',
            id: 'A review to write',
            collection: 'tasks',
            subtask: '0'
        });
    });

    it('points a follow-up at what holds the note, and a lead at the lead', () => {
        expect(lineOf('build-notes - chase the coauthor')?.target).toEqual({
            kind: 'followup',
            id: 'build-notes'
        });
        expect(lineOf('A lead')?.target).toEqual({ kind: 'lead', id: 'A lead' });
    });

    it('gives a conference call no target, since the venue registry has no status field', () => {
        expect(lineOf('ConfY')?.target).toBeUndefined();
    });

    it('keeps the target on a line that was snoozed rather than shown', () => {
        expect(week.snoozed[0].target).toEqual({ kind: 'manifest', id: 'derisk-snoozed' });
    });
});

describe('attention and refresh', () => {
    it('counts the inbox the channel gave and the days since the last post, and warns on venue load', () => {
        expect(attention(snap, config, NOW, 2)).toEqual([
            { kind: 'inbox', count: 2 },
            { kind: 'linkedin', count: 102 }
        ]);
    });

    it('says nothing about a feed the hub does not have, nor about notes never written', () => {
        const bare = { ...snap, entities: { ...snap.entities, feeds: NO_FEEDS } };
        expect(attention(bare, config, NOW, 0)).toEqual([]);
        expect(refresh(bare, config, NOW, null)).toEqual([]);
    });

    it('nudges the feeds that are past their threshold and not the ones that are not', () => {
        expect(refresh(snap, config, NOW, '2026-09-09')).toEqual([
            { feed: 'litwatch', days: 22 },
            { feed: 'inbox', days: 2 }
        ]);
    });

    it('nudges a radar that is there and has never run', () => {
        const never = {
            ...snap,
            entities: {
                ...snap.entities,
                feeds: { ...snap.entities.feeds, radar: { lastRun: null } }
            }
        };
        expect(refresh(never, config, NOW, null)[0]).toEqual({ feed: 'litwatch', days: null });
    });

    it('reads the threshold of each feed out of refresh_stale_days over stale_days', () => {
        expect(staleAfter(config, 'litwatch')).toBe(14);
        expect(staleAfter(config, 'inbox')).toBe(2);
        expect(staleAfter(config, 'scout')).toBe(7);
    });
});

describe('the Focus board folds', () => {
    it('let quick add write to the projects of the three live tiers', () => {
        const projects = ['ideas', 'active', 'manuscripts', 'archive'].map((tier) => ({
            id: tier,
            tier
        })) as unknown as Parameters<typeof liveProjects>[0];
        expect(liveProjects(projects).map((one) => one.id)).toEqual([
            'ideas',
            'active',
            'manuscripts'
        ]);
    });

    it('cycle a priority from unset through the fewest flames to the most and back', () => {
        const levels: Priority[] = [
            { key: 'high', label: 'High', flames: 3 },
            { key: 'low', label: 'Low', flames: 1 }
        ];
        expect(nextPriority(levels, undefined)).toBe('low');
        expect(nextPriority(levels, 'low')).toBe('high');
        expect(nextPriority(levels, 'high')).toBe('');
        // A value no level holds starts the cycle over, at unset.
        expect(nextPriority(levels, 'unknown')).toBe('');
    });

    it('draw the lanes of one cluster in the board order', () => {
        const board = [
            { key: 'a', cluster: 'now' },
            { key: 'b', cluster: 'parked' },
            { key: 'c', cluster: 'now' }
        ] as Lane[];
        expect(lanesIn(board, 'now').map((one) => one.key)).toEqual(['a', 'c']);
    });
});

describe('the ticker lines the command center groups', () => {
    const line = (kind: string, label: string) =>
        ({ kind, label, glyph: '', days: null }) as TickerItem;

    it('run by kind in the order given, a kind met again opening a run of its own', () => {
        const lines = [line('a', '1'), line('a', '2'), line('b', '3'), line('a', '4')];
        expect(runsByKind(lines).map((run) => [run.kind, run.lines.length])).toEqual([
            ['a', 2],
            ['b', 1],
            ['a', 1]
        ]);
    });

    it('group the deadlines by category in the categories order, an empty category left out', () => {
        const lines = [line('funding', 'f'), line('paper', 'p'), line('funding', 'g')];
        expect(
            deadlinesByCategory(lines, ['paper', 'event', 'funding']).map((one) => [
                one.category,
                one.lines.map((held) => held.label)
            ])
        ).toEqual([
            ['paper', ['p']],
            ['funding', ['f', 'g']]
        ]);
    });
});
