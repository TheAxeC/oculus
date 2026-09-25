// The software cross-link of a board item: one edge, read from either side. A software project's
// own join names the projects its `related:` holds; every other project's join names the software
// whose `related:` holds it, which is why a paper needs no manifest key of its own for the
// software.
//
// Its own fixture rather than tests/state/boards/board/board.test.ts's, which is the whole
// portfolio and says nothing about relations: what is checked here is three projects and one
// related pair.

import { describe, expect, it } from 'vitest';
import { NO_FEEDS } from '../../../fixtures/entities-fixture.ts';
import {
    BOARDS,
    boardItemFor,
    boardItems,
    presetFor,
    type BoardPreset
} from '../../../../src/lib/state/boards/board/index.ts';
import type { Id, Project, Relations, Snapshot } from '../../../../src/lib/data/model/index.ts';

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

const PRESET: BoardPreset = presetFor('projects');

function project(id: Id, tier: Project['tier'], over: Partial<Project> = {}): Project {
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

/** A library, the paper it names, and a project neither end of the link reaches. */
function snapshot(): Snapshot {
    const projects: Project[] = [
        project('kit', 'software', {
            type: 'software',
            title: 'A toolkit',
            short: 'Kit',
            relatedIds: ['paper']
        }),
        project('paper', 'manuscripts', { type: 'manuscript', title: 'The paper' }),
        project('other', 'active', { type: 'active', title: 'Something else' })
    ];
    const byId: Record<Id, Project> = {};
    for (const one of projects) byId[one.id] = one;
    return {
        version: 1,
        entities: {
            feeds: NO_FEEDS,
            career: null,
            projects: byId,
            venues: {},
            datasets: {},
            pillars: {},
            domains: {},
            funding: {},
            people: {},
            organisations: {},
            collections: {}
        },
        relations: { ...NO_RELATIONS, projectRelated: [['kit', 'paper']] },
        findings: []
    };
}

function tagsOf(snap: Snapshot, id: Id): { id: Id; label: string }[] {
    return boardItemFor(snap, snap.entities.projects[id], PRESET).software;
}

describe('the software cross-link', () => {
    it("names the software on the card of the paper the software's related list holds", () => {
        expect(tagsOf(snapshot(), 'paper')).toEqual([{ id: 'kit', label: 'Kit' }]);
    });

    it("names the papers on the software's own card, and never the software itself", () => {
        const tags = tagsOf(snapshot(), 'kit');
        expect(tags.map((tag) => tag.id)).toEqual(['paper']);
        expect(tags.map((tag) => tag.id)).not.toContain('kit');
    });

    it('names nothing on a project neither end of the link reaches', () => {
        expect(tagsOf(snapshot(), 'other')).toEqual([]);
    });

    it('names no software while the portfolio holds none', () => {
        const bare = snapshot();
        bare.relations = NO_RELATIONS;
        delete bare.entities.projects.kit;
        expect(tagsOf(bare, 'paper')).toEqual([]);
    });

    it('lists a software project named by another one on both cards', () => {
        const snap = snapshot();
        snap.entities.projects.plugin = project('plugin', 'software', {
            type: 'software',
            title: 'A plugin',
            short: 'Plug',
            relatedIds: ['kit']
        });
        snap.relations = {
            ...NO_RELATIONS,
            projectRelated: [
                ['kit', 'paper'],
                ['plugin', 'kit']
            ]
        };
        expect(tagsOf(snap, 'plugin').map((tag) => tag.id)).toEqual(['kit']);
        // The named library lists the plugin back beside its paper, by label, and neither twice.
        expect(tagsOf(snap, 'kit').map((tag) => tag.id)).toEqual(['plugin', 'paper']);
    });

    it('puts the software tags into the search text of the card', () => {
        const item = boardItemFor(snapshot(), snapshot().entities.projects.paper, PRESET);
        expect(item.haystack).toContain('kit');
    });

    it('leaves a software project off every board', () => {
        const snap = snapshot();
        for (const view of BOARDS) {
            const ids = boardItems(snap, presetFor(view)).map((item) => item.id);
            expect(ids).not.toContain('kit');
        }
    });
});
