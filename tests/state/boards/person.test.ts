// Layer 2, client-state tests. The five joins one person is drawn from, over a hand-built snapshot:
// the registry entry, the organisations, the joint work, the projects and the supervision folder.
// The joins read the relation tables data/snapshot/normalise.ts wrote, so the fixture writes those
// tables the way a snapshot carries them.

import { describe, expect, it } from 'vitest';
import { NO_CAREER, NO_FEEDS, fixtureProject } from '../../fixtures/entities-fixture.ts';
import { personJoin, personNames } from '../../../src/lib/state/boards/person.ts';
import type {
    Collection,
    Organisation,
    Person,
    Project,
    Relations,
    Snapshot
} from '../../../src/lib/data/model/index.ts';

const NO_RELATIONS: Relations = {
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

function person(id: string, over: Partial<Person> = {}): Person {
    return {
        id,
        name: id,
        affiliations: [],
        links: [],
        projectIds: [],
        jointWorkIds: [],
        ...over
    };
}

function organisation(id: string, over: Partial<Organisation> = {}): Organisation {
    return { id, name: id, links: [], personIds: [], fundingIds: [], ...over };
}

function project(id: string, over: Partial<Project> = {}): Project {
    return fixtureProject({
        id,
        tier: 'manuscripts',
        title: `Project ${id}`,
        folder: `projects/manuscripts/${id}`,
        file: `/hub/projects/manuscripts/${id}/project.yml`,
        ...over
    });
}

function jointWork(): Collection {
    const file = '/hub/network/joint-work.yml';
    return {
        id: 'joint-work',
        title: 'Joint work',
        file,
        entries: [
            {
                id: 'ecg-paper',
                title: 'The ECG paper',
                fields: { key: 'ecg-paper', person: 'naesens', status: 'active' },
                file,
                index: 0
            },
            {
                id: 'other-work',
                title: 'Somebody else entirely',
                fields: { key: 'other-work', person: 'moreau' },
                file,
                index: 1
            }
        ]
    };
}

function snapshot(): Snapshot {
    return {
        version: 1,
        entities: {
            personal: {},
            projects: {
                alpha: project('alpha', { collaborators: ['naesens'], short: 'Alpha' }),
                beta: project('beta')
            },
            venues: {},
            datasets: {},
            pillars: {},
            domains: {},
            funding: {},
            people: {
                naesens: person('naesens', {
                    name: 'Maarten Naesens',
                    affiliations: ['ku-leuven', 'uz-leuven'],
                    role: 'host candidate',
                    projectIds: ['alpha'],
                    jointWorkIds: ['ecg-paper']
                }),
                moreau: person('moreau', { name: 'Yves Moreau', jointWorkIds: ['other-work'] }),
                ward: person('ward', {
                    name: 'Ward',
                    role: 'student',
                    folder: 'education/student-supervision/ward-2024'
                })
            },
            resources: {},
            organisations: {
                'ku-leuven': organisation('ku-leuven', {
                    name: 'KU Leuven',
                    kind: 'university',
                    country: 'BE',
                    personIds: ['naesens']
                }),
                'uz-leuven': organisation('uz-leuven', {
                    name: 'UZ Leuven',
                    kind: 'hospital',
                    country: 'BE',
                    personIds: ['naesens']
                })
            },
            collections: { 'joint-work': jointWork() },
            feeds: NO_FEEDS,
            career: NO_CAREER
        },
        relations: {
            ...NO_RELATIONS,
            projectPerson: [['alpha', 'naesens']],
            jointWorkPerson: [
                ['ecg-paper', 'naesens'],
                ['other-work', 'moreau']
            ],
            personOrganisation: [['naesens', 'ku-leuven']]
        },
        findings: []
    };
}

describe('personNames', () => {
    it('answers every person by their key, and the key itself for a nameless entry', () => {
        const held = snapshot();
        held.entities.people.moreau.name = '';
        expect(personNames(held)).toEqual({
            naesens: 'Maarten Naesens',
            moreau: 'moreau',
            ward: 'Ward'
        });
    });

    it('answers nothing at all before the snapshot has arrived', () => {
        expect(personNames(null)).toEqual({});
    });
});

describe('personJoin', () => {
    it('joins the entry, the organisations, the joint work and the projects', () => {
        const join = personJoin(snapshot(), 'naesens');
        expect(join.person?.name).toBe('Maarten Naesens');
        expect(join.organisations.map((one) => one.name)).toEqual(['KU Leuven', 'UZ Leuven']);
        expect(join.jointWork.map((entry) => entry.id)).toEqual(['ecg-paper']);
        expect(join.projects.map((one) => one.id)).toEqual(['alpha']);
        expect(join.folder).toBe('');
    });

    it('draws a student by their supervision folder and by nothing else', () => {
        const join = personJoin(snapshot(), 'ward');
        expect(join.folder).toBe('education/student-supervision/ward-2024');
        expect(join.organisations).toEqual([]);
        expect(join.jointWork).toEqual([]);
        expect(join.projects).toEqual([]);
    });

    it('answers an empty join for a key the registry does not hold, and before the snapshot', () => {
        expect(personJoin(snapshot(), 'nobody')).toEqual({
            person: null,
            organisations: [],
            jointWork: [],
            projects: [],
            folder: ''
        });
        expect(personJoin(null, 'naesens').person).toBeNull();
    });

    it('leaves an affiliation the organisation registry does not hold out of the join', () => {
        const held = snapshot();
        held.entities.people.naesens.affiliations = ['nowhere', 'ku-leuven'];
        expect(personJoin(held, 'naesens').organisations.map((one) => one.id)).toEqual([
            'ku-leuven'
        ]);
    });
});
