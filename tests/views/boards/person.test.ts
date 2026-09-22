// One person as their own tab, rendered on the server: the fact strip, the joint work, the projects
// and a student's supervision folder, and what the tab says when it was opened for nobody.
//
// The catalog and the glyphs are the real config; the folder listing comes from the fs store, whose
// `fetch` is a stub, so the folder block is checked with a real answer behind it rather than with a
// spinner. Pressing a row is a DOM event no server render fires; opening the tab from a card end to
// end is tests/browser/boards/person.spec.ts.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Person from '../../../src/lib/views/boards/person/Person.svelte';
import { NO_CAREER, NO_FEEDS } from '../../fixtures/entities-fixture.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/words/text.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import type {
    Collection,
    Organisation,
    Person as PersonEntity,
    Project,
    Relations,
    Snapshot
} from '../../../src/lib/data/model.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    install(client);
});

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

function person(id: string, over: Partial<PersonEntity> = {}): PersonEntity {
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
    return {
        id,
        tier: 'manuscripts',
        ghost: false,
        title: `Project ${id}`,
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
        folder: `projects/manuscripts/${id}`,
        file: `/hub/projects/manuscripts/${id}/project.yml`,
        ...over
    };
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
            }
        ]
    };
}

function snapshot(): Snapshot {
    return {
        version: 1,
        entities: {
            projects: { alpha: project('alpha', { short: 'Alpha', collaborators: ['naesens'] }) },
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
                    email: 'someone@example.invalid',
                    projectIds: ['alpha'],
                    jointWorkIds: ['ecg-paper']
                }),
                axel: person('axel', { name: 'The Owner', self: true }),
                ward: person('ward', {
                    name: 'Ward',
                    role: 'student',
                    folder: 'education/student-supervision/ward-2024'
                }),
                outsider: person('outsider', {
                    name: 'Outsider',
                    role: 'student',
                    folder: 'education/../../elsewhere/thesis'
                }),
                hosted: person('hosted', {
                    name: 'Hosted',
                    role: 'student',
                    folder: 'theaxec.github.io/_data'
                })
            },
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
            jointWorkPerson: [['ecg-paper', 'naesens']],
            personOrganisation: [
                ['naesens', 'ku-leuven'],
                ['naesens', 'uz-leuven']
            ]
        },
        findings: []
    };
}

function install(fresh: ClientState): void {
    fresh.entities.receive({ channel: 'portfolio', version: 1, payload: snapshot() });
    fresh.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config, text: catalog, findings: [] }
    });
}

function instance(state: unknown): Instance {
    return { id: 'person-one', view: 'person', state };
}

function drawn(fresh: ClientState, state: unknown): string {
    return render(Person, { context: clientContext(fresh), props: { instance: instance(state) } })
        .body;
}

async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

/** The student's tab, with the file store answering one listing of the supervision folder. */
async function listed(entries: Record<string, unknown>[]): Promise<string> {
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', () =>
        Promise.resolve(
            new Response(JSON.stringify({ entries }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            })
        )
    );
    const fresh = createClientState();
    install(fresh);
    fresh.fs.listing('hub', 'education/student-supervision/ward-2024');
    await settle();
    const body = drawn(fresh, { key: 'ward' });
    vi.unstubAllGlobals();
    return body;
}

describe('one person as their own tab', () => {
    it('says so when the tab was opened for nobody', () => {
        expect(drawn(client, {})).toContain(catalog['person.nobody']);
    });

    it('names the key when the registry holds no such person', () => {
        expect(drawn(client, { key: 'nobody' })).toContain('nobody');
    });

    it('draws the name, one line per organisation, and the rest of the fact strip', () => {
        const body = drawn(client, { key: 'naesens' });
        expect(body).toContain('Maarten Naesens');
        expect(body).toContain('KU Leuven (university, BE)');
        expect(body).toContain('UZ Leuven (hospital, BE)');
        expect(body.indexOf('KU Leuven')).toBeLessThan(body.indexOf('UZ Leuven'));
        expect(body).toContain('host candidate');
        expect(body).toContain('someone@example.invalid');
    });

    it('draws the joint work with its status, and the projects that name the person', () => {
        const body = drawn(client, { key: 'naesens' });
        expect(body).toContain('The ECG paper');
        expect(body).toContain('active');
        expect(body).toContain('Alpha');
        expect(body).toContain('data-block="joint-work"');
        expect(body).toContain('data-block="projects"');
    });

    it('says so on each block a person has nothing under, and marks the hub owner', () => {
        const body = drawn(client, { key: 'axel' });
        expect(body).toContain(catalog['person.no_joint_work']);
        expect(body).toContain(catalog['person.no_projects']);
        expect(body).toContain(catalog['person.self']);
        // this person has no supervision folder, so the block is not drawn
        expect(body).not.toContain('data-block="folder"');
    });

    it('carries the control that opens registries/people.yml', () => {
        expect(drawn(client, { key: 'naesens' })).toContain(
            'data-source-path="registries/people.yml"'
        );
    });

    it("lists the files of a student's supervision folder and leaves a folder inside it out", async () => {
        const body = await listed([
            { name: 'thesis.pdf', kind: 'file', size: 10, mtime: 0 },
            { name: 'drafts', kind: 'dir', size: 0, mtime: 0 }
        ]);
        expect(body).toContain('data-block="folder"');
        expect(body).toContain('thesis.pdf');
        // A directory has no bytes for a source tab to hold, so it is not a row at all.
        expect(body).not.toContain('drafts');
    });

    // Revert: drop the ToolButton from the folder block's heading in
    // views/boards/person/Person.svelte.
    it('offers Show in Files for the supervision folder on its block, and no such control without one', async () => {
        const body = await listed([{ name: 'thesis.pdf', kind: 'file', size: 10, mtime: 0 }]);
        const block = body.slice(body.indexOf('data-block="folder"'));
        expect(block).toContain(`aria-label="${catalog['person.show_in_files']}"`);
        expect(block).toContain(
            catalog['person.show_in_files_tip'].replace(
                '{0}',
                'education/student-supervision/ward-2024'
            )
        );
        // this person has no supervision folder, so there is none to show in the file browser
        expect(drawn(client, { key: 'naesens' })).not.toContain(catalog['person.show_in_files']);
    });

    // Revert: draw the ToolButton whatever `folderPath` is in views/boards/person/Person.svelte.
    it('offers no Show in Files for a folder that climbs above the hub', () => {
        const body = drawn(client, { key: 'outsider' });
        expect(body).toContain('data-block="folder"');
        // the folder climbs above the hub, so there is nothing the file browser can be sent to
        expect(body).not.toContain(catalog['person.show_in_files']);
    });

    // revert: src/lib/views/boards/person/Person.svelte:217 => <!-- nothing to draw -->
    // Revert: in views/boards/person/Person.svelte, draw nothing where the folder is not one of the
    // hub, and the block is a heading over an empty space that says nothing about why.
    it('says so when the folder is not one of the hub, rather than drawing an empty block', () => {
        const body = drawn(client, { key: 'outsider' });
        expect(body).toContain(catalog['person.folder_outside']);
        // no listing was asked for, so the block never claims a read is on its way
        expect(body).not.toContain(catalog['person.folder_loading']);
    });

    // revert: src/lib/state/boards/collection.ts:311 => const HUB_ONLY_FIELDS: string[] = [];
    // Revert: in hubPathsOf of state/boards/collection.ts, read a `folder` through the address rule
    // like a link, and a folder of this hub whose name is host-shaped becomes a web address.
    it('reads a folder whose first segment is host-shaped as the folder of the hub it is', () => {
        const body = drawn(client, { key: 'hosted' });
        expect(body).toContain('data-block="folder"');
        expect(body).toContain('theaxec.github.io/_data');
        // `theaxec.github.io` is a folder of this hub, so the block selects it and reads it.
        expect(body).toContain(catalog['person.show_in_files']);
        expect(body).toContain(catalog['person.folder_loading']);
    });

    it('says the folder is empty when every entry in it is a directory', async () => {
        const body = await listed([{ name: 'drafts', kind: 'dir', size: 0, mtime: 0 }]);
        expect(body).toContain(catalog['person.folder_empty']);
        // the folder holds directories alone, and the block lists the files in it
        expect(body).not.toContain('drafts');
    });
});
