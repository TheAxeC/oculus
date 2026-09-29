// Pure relationship-graph visibility, directed-edge, filter-chip and start-seed checks. The Map's
// forces are checked in forces.test.ts beside this file.

import { describe, expect, it } from 'vitest';
import {
    buildGraph,
    filterGraph,
    layoutKey,
    layoutSeed,
    nextStart,
    parseMapState,
    presentFilter,
    startFor,
    toggleFilter,
    typeCounts,
    archiveStatuses,
    hasRelationships,
    lineFilters,
    typeFilters,
    type Graph as MapGraph
} from '../../../../src/lib/state/boards/structure/graph.ts';
import type { Project, Snapshot } from '../../../../src/lib/data/model/index.ts';
import { NO_FEEDS } from '../../../fixtures/entities-fixture.ts';

function project(id: string, relatedIds: string[], extra: Partial<Project> = {}): Project {
    return {
        id,
        tier: 'active',
        ghost: false,
        type: 'active',
        title: id,
        short: id.toUpperCase(),
        chips: [],
        results: [],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        relatedIds,
        fundingIds: [],
        datasetIds: [],
        pillarIds: [],
        domainIds: [],
        collaborators: [],
        docs: [],
        folder: `projects/active/${id}`,
        file: `/hub/projects/active/${id}/project.yml`,
        ...extra
    };
}

function snapshot(): Snapshot {
    const projects = {
        alpha: project('alpha', ['beta', 'gamma'], {
            pillarIds: ['one', 'two'],
            collaborators: ['person']
        }),
        beta: project('beta', ['alpha']),
        gamma: project('gamma', []),
        old: project('old', ['alpha'], { tier: 'archive', type: 'dropped' })
    };
    return {
        version: 1,
        entities: {
            projects,
            venues: {},
            datasets: {},
            pillars: {
                one: { id: 'one', title: 'One', fundingIds: [], projectIds: [] },
                two: { id: 'two', title: 'Two', fundingIds: [], projectIds: [] }
            },
            domains: {},
            funding: {},
            people: {
                person: {
                    id: 'person',
                    name: 'Person Name',
                    affiliations: [],
                    links: [],
                    projectIds: [],
                    jointWorkIds: []
                }
            },
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

/** The ids of one kind of node in a graph, sorted, which is what a filter is read off. */
function ids(graph: { nodes: { id: string; kind: string }[] }, kind: string): string[] {
    return graph.nodes
        .filter((node) => node.kind === kind)
        .map((node) => node.id)
        .sort();
}

describe('relationship graph', () => {
    it('applies visibility and emits each directed relationship shape once', () => {
        const base = buildGraph(snapshot());
        expect(base.nodes.filter((node) => node.kind === 'line')).toHaveLength(2);
        expect(base.nodes.some((node) => node.id === 'project::old')).toBe(false);
        expect(base.nodes.some((node) => node.kind === 'collaborator')).toBe(false);
        expect(
            base.edges.filter((edge) => edge.kind === 'related').map((edge) => edge.direction)
        ).toEqual(['mutual', 'one']);

        const expanded = buildGraph(snapshot(), { archived: ['dropped'], collaborators: true });
        expect(expanded.nodes.some((node) => node.id === 'project::old')).toBe(true);
        expect(expanded.nodes.find((node) => node.id === 'collaborator::person')?.label).toBe(
            'Person Name'
        );
        expect(expanded.edges.some((edge) => edge.source === 'project::old')).toBe(true);
    });

    it('draws only the types named, and takes a line no drawn project is a member of with them', () => {
        const data = snapshot();
        data.entities.projects.beta.type = 'idea';
        const whole = buildGraph(data, { collaborators: true });
        expect(ids(whole, 'project')).toEqual([
            'project::alpha',
            'project::beta',
            'project::gamma'
        ]);

        const typed = filterGraph(whole, { types: ['idea'] });
        expect(ids(typed, 'project')).toEqual(['project::beta']);
        expect(ids(typed, 'line')).toEqual([]);
        expect(ids(typed, 'collaborator')).toEqual([]);
        expect(buildGraph(data, { collaborators: true, types: ['idea'] })).toEqual(typed);
    });

    it('draws only the lines named, keeps their projects, and drops the membership edges of the rest', () => {
        const whole = buildGraph(snapshot());
        const lined = filterGraph(whole, { lines: ['one'] });
        expect(ids(lined, 'line')).toEqual(['line::one']);
        expect(lined.edges.map((edge) => edge.id)).not.toContain('membership::alpha::two');
        expect(lined.edges.map((edge) => edge.id)).toContain('membership::alpha::one');
        expect(ids(lined, 'project')).toEqual([
            'project::alpha',
            'project::beta',
            'project::gamma'
        ]);
        const before = whole.nodes.find((node) => node.id === 'project::alpha')?.degree ?? 0;
        expect(before).toBeGreaterThan(0);
        expect(lined.nodes.find((node) => node.id === 'project::alpha')?.degree).toBe(before - 1);
    });

    it('drops a project with no membership of a drawn line, and the collaborator left behind', () => {
        const data = snapshot();
        data.entities.projects.alpha.pillarIds = ['one'];
        data.entities.projects.gamma.pillarIds = ['two'];
        const whole = buildGraph(data, { collaborators: true });
        expect(ids(whole, 'collaborator')).toEqual(['collaborator::person']);

        const joined = filterGraph(whole, { connected: true });
        expect(ids(joined, 'project')).toEqual(['project::alpha', 'project::gamma']);
        expect(ids(joined, 'collaborator')).toEqual(['collaborator::person']);

        const narrowed = filterGraph(whole, { lines: ['two'], connected: true });
        expect(ids(narrowed, 'project')).toEqual(['project::gamma']);
        expect(ids(narrowed, 'collaborator')).toEqual([]);
        expect(narrowed.edges.map((edge) => edge.id)).toEqual(['membership::gamma::two']);
    });

    it('draws the whole graph for an empty list, which is what a state naming no filter holds', () => {
        const whole = buildGraph(snapshot(), { collaborators: true });
        expect(filterGraph(whole, {})).toEqual(whole);
        expect(filterGraph(whole, { types: [], lines: [], connected: false })).toEqual(whole);
    });

    it('leaves a project whose manifest names no type outside the type filter', () => {
        const data = snapshot();
        delete data.entities.projects.gamma.type;
        data.entities.projects.beta.type = 'idea';
        const whole = buildGraph(data);
        expect(ids(filterGraph(whole, { types: ['idea'] }), 'project')).toEqual([
            'project::beta',
            'project::gamma'
        ]);
        expect(typeCounts(whole)).toEqual({ active: 1, idea: 1 });
    });

    it('keeps a collaborator two projects share when one of them goes, at the degree it has left', () => {
        const data = snapshot();
        data.entities.projects.beta.collaborators = ['person'];
        data.entities.projects.beta.type = 'idea';
        const whole = buildGraph(data, { collaborators: true });
        expect(whole.nodes.find((node) => node.id === 'collaborator::person')?.degree).toBe(2);

        const typed = filterGraph(whole, { types: ['idea'] });
        expect(ids(typed, 'collaborator')).toEqual(['collaborator::person']);
        expect(typed.nodes.find((node) => node.id === 'collaborator::person')?.degree).toBe(1);
        expect(typed.edges.map((edge) => edge.id)).toEqual(['collaborator::beta::person']);
    });

    it('drops a related edge whose other end the filter took out', () => {
        const data = snapshot();
        data.entities.projects.beta.type = 'idea';
        const whole = buildGraph(data);
        expect(whole.edges.map((edge) => edge.id)).toContain('related::alpha::beta');

        const typed = filterGraph(whole, { types: ['idea'] });
        expect(typed.edges.map((edge) => edge.id)).not.toContain('related::alpha::beta');
        expect(ids(typed, 'project')).toEqual(['project::beta']);
    });

    it('narrows a saved filter to what the graph holds, and an emptied list filters nothing', () => {
        const whole = buildGraph(snapshot());
        expect(presentFilter(whole, { types: ['gone'], lines: ['nowhere'] })).toEqual({
            types: [],
            lines: [],
            connected: false
        });
        expect(
            presentFilter(whole, { types: ['active', 'gone'], lines: ['one'], connected: true })
        ).toEqual({ types: ['active'], lines: ['one'], connected: true });
        const narrowed = presentFilter(whole, { types: ['gone'] });
        expect(filterGraph(whole, narrowed)).toEqual(whole);
    });

    it('narrows the first press to the one pressed, then adds and removes', () => {
        expect(toggleFilter([], 'idea')).toEqual(['idea']);
        expect(toggleFilter(['idea'], 'active')).toEqual(['idea', 'active']);
        expect(toggleFilter(['idea', 'active'], 'idea')).toEqual(['active']);
        expect(toggleFilter(['active'], 'active')).toEqual([]);
    });

    it('keys a filtered layout by the nodes it left, so two filters do not share one layout', () => {
        const data = snapshot();
        data.entities.projects.beta.type = 'idea';
        const whole = buildGraph(data);
        const ideas = layoutKey(filterGraph(whole, { types: ['idea'] }).nodes);
        const active = layoutKey(filterGraph(whole, { types: ['active'] }).nodes);
        expect(ideas).not.toBe(active);
        expect(layoutKey(filterGraph(whole, {}).nodes)).toBe(layoutKey(whole.nodes));
    });

    it('falls back from an empty short name to the full title', () => {
        const data = snapshot();
        data.entities.projects.alpha.short = '   ';
        data.entities.projects.alpha.title = 'Full title';
        expect(buildGraph(data).nodes.find((node) => node.id === 'project::alpha')?.label).toBe(
            'Full title'
        );
    });

    it('keeps a saved start seed and drops a malformed one or an old tuning', () => {
        expect(parseMapState({ start: { key: 'k', seed: 3 } }).start).toEqual({
            key: 'k',
            seed: 3
        });
        expect(parseMapState({ start: { key: 'k', seed: 'x' } })).not.toHaveProperty('start');
        const old = parseMapState({ tuned: { key: 'k', params: { linkLength: 107 } } });
        expect(old).not.toHaveProperty('tuned');
        expect(old).not.toHaveProperty('start');
    });

    it('answers the saved seed for the node set drawn now, and the default for another set', () => {
        const data = snapshot();
        data.entities.projects.beta.type = 'idea';
        const whole = buildGraph(data);
        const ideas = filterGraph(whole, { types: ['idea'] });
        const saved = parseMapState({ start: { key: layoutKey(whole.nodes), seed: 41 } });
        expect(startFor(saved, whole.nodes)).toBe(41);
        expect(startFor(saved, ideas.nodes)).toBe(layoutSeed(ideas.nodes));
        expect(startFor(parseMapState({}), whole.nodes)).toBe(layoutSeed(whole.nodes));
    });

    it('re-tunes to the seed one above the one in force, under this node set', () => {
        const graph = buildGraph(snapshot());
        const key = layoutKey(graph.nodes);
        expect(nextStart(parseMapState({ start: { key, seed: 41 } }), graph.nodes)).toEqual({
            key,
            seed: 42
        });
        expect(nextStart(parseMapState({}), graph.nodes)).toEqual({
            key,
            seed: layoutSeed(graph.nodes) + 1
        });
    });
});

describe('the Map chips over a graph', () => {
    const node = (id: string, kind: string, extra: Record<string, unknown> = {}) => ({
        id,
        kind,
        entityId: id,
        label: id.toUpperCase(),
        ...extra
    });
    const base = {
        nodes: [
            node('p1', 'project', { type: 'active' }),
            node('p2', 'project', { type: 'idea' }),
            node('p3', 'project', { type: 'accepted' }),
            node('L2', 'line'),
            node('L1', 'line')
        ],
        edges: [
            { source: 'p1', target: 'L1', kind: 'membership' },
            { source: 'p2', target: 'L2', kind: 'membership' }
        ]
    } as unknown as MapGraph;
    const drawn = {
        nodes: base.nodes.slice(0, 1).concat(base.nodes.slice(3)),
        edges: base.edges.slice(0, 1)
    };

    it('list the configured types first, then the rest by name, each counted over the drawn graph', () => {
        expect(typeFilters(base, drawn, ['idea', 'none', 3], [])).toEqual([
            { type: 'idea', count: 0, shown: true },
            { type: 'accepted', count: 0, shown: true },
            { type: 'active', count: 1, shown: true }
        ]);
        // The types the configuration does not order come by name, not in the order the graph
        // meets them.
        expect(typeFilters(base, drawn, undefined, ['active']).map((one) => one.type)).toEqual([
            'accepted',
            'active',
            'idea'
        ]);
        expect(typeFilters(base, drawn, undefined, ['active']).map((one) => one.shown)).toEqual([
            false,
            true,
            false
        ]);
    });

    it('list the lines in registry order, each counted over the drawn graph', () => {
        const snapshot = {
            entities: { pillars: { L1: {}, L2: {} }, projects: {} }
        } as unknown as Parameters<typeof lineFilters>[2];
        expect(lineFilters(base, drawn, snapshot, ['L2'])).toEqual([
            { id: 'L1', title: 'L1', count: 1, shown: false },
            { id: 'L2', title: 'L2', count: 0, shown: true }
        ]);
    });

    it('offer a toggle per archived or coauthor type, with the colour the config gives it', () => {
        const snapshot = {
            entities: {
                projects: {
                    a: { tier: 'archive', type: 'dropped' },
                    b: { tier: 'coauthor', type: 'coauthor' },
                    c: { tier: 'active', type: 'active' }
                }
            }
        } as unknown as Parameters<typeof archiveStatuses>[0];
        expect(archiveStatuses(snapshot, { dropped: '#ff0000', coauthor: 3 })).toEqual([
            { status: 'dropped', color: '#ff0000' },
            { status: 'coauthor' }
        ]);
        expect(archiveStatuses(null, null)).toEqual([]);
    });

    it('say the graph has an edge when any project names a line or a related project', () => {
        const of = (projects: Record<string, unknown>) =>
            ({ entities: { projects } }) as unknown as Parameters<typeof hasRelationships>[0];
        expect(hasRelationships(of({ a: { pillarIds: [], relatedIds: ['b'] } }))).toBe(true);
        expect(hasRelationships(of({ a: { pillarIds: [], relatedIds: [] } }))).toBe(false);
        expect(hasRelationships(null)).toBe(false);
    });
});
