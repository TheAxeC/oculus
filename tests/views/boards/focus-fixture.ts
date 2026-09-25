// Layer 4, view test support. The Focus board's fixture: the real config's catalog, glyphs and
// vocabulary installed, a synthetic portfolio of projects, schemes, collections and venues, the
// career file, and the render of the board into one case's own client. `focus.test.ts` builds its
// client from here, each case afresh.

import { scalar } from '../../../src/lib/data/helpers/guards.ts';
import { NO_FEEDS } from '../../fixtures/entities-fixture.ts';
import { render } from 'svelte/server';
import Focus from '../../../src/lib/views/boards/focus/Focus.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';

import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import type {
    Career,
    Collection,
    Funding,
    Id,
    Project,
    Relations,
    Snapshot,
    Tier,
    Venue
} from '../../../src/lib/data/model/index.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';

import { clientContext, type ClientState } from '../../fixtures/client.ts';

export const { config } = loadConfig(engineDir());
export const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

export const INSTANCE = 'focus-one';

export const EMPTY_RELATIONS: Relations = {
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

export function project(id: Id, tier: Tier, over: Partial<Project> = {}): Project {
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

export function scheme(id: Id, over: Partial<Funding> = {}): Funding {
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

export function collection(
    id: string,
    rows: Record<string, unknown>[],
    statuses: string[] = []
): Collection {
    const file = `/hub/${id}.yml`;
    const held: Collection = {
        id,
        title: id,
        file,
        entries: rows.map((fields, index) => ({
            id: scalar(fields.key ?? fields.title, String(index)),
            title: scalar(fields.title),
            fields,
            file,
            index
        }))
    };
    if (statuses.length > 0) {
        held.schema = [
            { field: 'title', type: 'text' },
            { field: 'status', type: 'select', options: statuses }
        ];
    }
    return held;
}

export function venue(id: Id, over: Partial<Venue> = {}): Venue {
    return { id, name: id, themes: [], ...over };
}

/** Two cards on the Run lane, a parked idea, a paper out for review, and a deadline long gone. */
export function snapshot(): Snapshot {
    const projects = [
        project('alpha', 'active', {
            type: 'active',
            title: 'Alpha, the whole title',
            short: 'Alpha',
            focus: 'run',
            priority: 'high',
            chips: ['lead'],
            next: 'Run the sweep. Then write it up.',
            waitingOn: ['someone'],
            followups: [{ do: 'chase the coauthor' }],
            subtasks: [
                { key: 'fig', do: 'redraw figure 2', deadline: daysOff(6), done: false },
                { key: 'note', do: 'write the cover letter', done: false }
            ]
        }),
        project('foxtrot', 'active', {
            type: 'active',
            title: 'Foxtrot',
            focus: 'run',
            staleDays: 4,
            deadline: daysOff(4),
            snooze: daysOff(40)
        }),
        project('bravo', 'manuscripts', {
            type: 'manuscript',
            title: 'Bravo',
            focus: 'run',
            deadline: '2000-01-01'
        }),
        project('charlie', 'manuscripts', {
            type: 'manuscript',
            title: 'Charlie',
            focus: 'review',
            chips: ['submitted'],
            venueId: 'jbi',
            followups: [{ do: 'ping the editor', after: daysOff(-2) }]
        }),
        project('golf', 'manuscripts', {
            type: 'manuscript',
            title: 'Golf',
            focus: 'review',
            venueId: 'jbi'
        }),
        project('hotel', 'manuscripts', {
            type: 'manuscript',
            title: 'Hotel',
            focus: 'review',
            venueId: 'jbi'
        }),
        project('india', 'manuscripts', {
            type: 'manuscript',
            title: 'India',
            focus: 'review',
            venueId: 'jbi'
        }),
        project('delta', 'ideas', { type: 'idea', title: 'Delta', focus: 'holding' }),
        project('echo', 'manuscripts', { type: 'manuscript', title: 'Echo' })
    ];
    const byId: Record<Id, Project> = {};
    for (const one of projects) byId[one.id] = one;
    return {
        version: 1,
        entities: {
            feeds: {
                leads: [{ title: 'A lead', deadline: daysOff(8), status: 'open', fit: 'strong' }],
                radar: { lastRun: '2020-01-01' },
                scout: { lastRun: '2020-01-01' },
                linkedin: { lastPost: '2020-01-01' }
            },
            career: CAREER,
            projects: byId,
            venues: {
                jbi: venue('jbi', { name: 'Journal of Biomedical Informatics', short: 'JBI' })
            },
            datasets: {},
            pillars: {},
            domains: {},
            funding: {
                prep: scheme('prep', {
                    title: 'A grant in prep',
                    status: 'in-prep',
                    deadline: daysOff(10),
                    note: 'The concept is written. The budget is not.',
                    followups: [{ do: 'ask the officer' }]
                })
            },
            people: {
                someone: {
                    id: 'someone',
                    name: 'Some One',
                    affiliations: [],
                    links: [],
                    projectIds: [],
                    jointWorkIds: []
                }
            },
            organisations: {},
            collections: {
                funding: collection('funding', [
                    {
                        key: 'prep',
                        title: 'A grant in prep',
                        status: 'in-prep',
                        deadline: daysOff(10),
                        note: 'The concept is written. The budget is not.'
                    }
                ]),
                applications: collection('applications', [
                    { title: 'A live position', status: 'active' },
                    { title: 'An applied position', status: 'applied' }
                ]),
                'joint-work': collection('joint-work', [
                    { key: 'someone', title: 'A shared paper', person: 'someone', status: 'active' }
                ]),
                events: collection(
                    'events',
                    [{ title: 'A coming talk', status: 'upcoming', date: daysOff(9) }],
                    ['upcoming', 'planned', 'not-attending', 'past']
                ),
                education: collection('education', [{ title: 'A course', status: 'ongoing' }]),
                tasks: collection(
                    'tasks',
                    [
                        { title: 'A standing chore', status: 'todo' },
                        { title: 'A dated chore', status: 'todo', deadline: daysOff(5) }
                    ],
                    ['todo', 'doing', 'done']
                )
            }
        },
        relations: EMPTY_RELATIONS,
        findings: []
    };
}

/** One host in flight, one dropped candidate, and a milestone whose brackets the summary drops. */
export const CAREER: Career = {
    title: 'Career strategy',
    milestone: 'FWO Senior - 2 shots left (Nov 2026 and Nov 2027).',
    situation: [{ label: 'PhD', value: 'May 2023, KU Leuven' }],
    order: [{ task: 'Veni pre-proposal', when: '1 Sep' }],
    hosts: [
        {
            name: 'Naesens',
            inst: 'KU Leuven',
            tag: 'transplant',
            status: 'awaiting',
            scores: { proposal: 'Strong', backing: 'High' },
            note: 'Federated outcome prediction across consortia.'
        }
    ],
    hostCriteria: ['Clinic-embedded'],
    notHosts: [{ who: 'Peeters', why: 'former advisor' }],
    eligibility: { rule: ['PhD 3-6 yr before the start'], shots: ['Nov 2026'], caveat: 'a caveat' },
    dropped: [{ what: 'MSCA-PF 2026' }]
};

/**
 * A date the given number of days from the run date. The deadline window is counted from the real
 * clock here, so a date meant to be inside it is written relative to today rather than pinned.
 */
export function daysOff(days: number): string {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Nothing at all: the portfolio a fresh hub would publish. */
export function bare(): Snapshot {
    return {
        version: 2,
        entities: {
            feeds: NO_FEEDS,
            career: null,
            projects: {},
            venues: {},
            datasets: {},
            pillars: {},
            domains: {},
            funding: {},
            people: {
                someone: {
                    id: 'someone',
                    name: 'Some One',
                    affiliations: [],
                    links: [],
                    projectIds: [],
                    jointWorkIds: []
                }
            },
            organisations: {},
            collections: {}
        },
        relations: EMPTY_RELATIONS,
        findings: []
    };
}

/**
 * A catalog string as the rendered page carries it: Svelte escapes the ampersand and nothing else
 * here.
 */
export function escaped(key: string): string {
    return catalog[key].replace(/&/g, '&amp;');
}

export function html(client: ClientState): string {
    const instance: Instance = { id: INSTANCE, view: 'focus', state: {} };
    return render(Focus, { context: clientContext(client), props: { instance } }).body;
}

/** What every case starts from, installed into the case's own client. */
export function installFixture(receive: ClientState['entities']['receive']): void {
    receive({ channel: 'config', version: 1, payload: { config, text: catalog, findings: [] } });
    receive({ channel: 'portfolio', version: 1, payload: snapshot() });
    // The inbox count and the triage-notes nudge are the `inbox` channel's, not the snapshot's.
    receive({
        channel: 'inbox',
        version: 1,
        payload: {
            status: 'ok',
            accounts: [],
            threads: ['one', 'two', 'three'].map((id) => ({
                id,
                account: 'google-work',
                provider: 'google',
                sender: 'Someone',
                subject: id,
                received: '2026-09-11T09:00:00.000Z',
                snippet: '',
                messages: 1,
                triage: { kind: 'reply', triaged: false }
            })),
            updated: '2026-09-11T12:00:00.000Z',
            pollMin: 10,
            retryMin: 2,
            notesRun: '2020-01-01'
        }
    });
}
