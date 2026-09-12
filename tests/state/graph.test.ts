// Pure relationship-graph visibility, directed-edge and seeded-layout checks.

import { describe, expect, it } from 'vitest';
import {
    DEFAULT_PHYSICS,
    bestLayout,
    buildGraph,
    crossings,
    layoutKey,
    optimize,
    placeInit,
    physics,
    score,
    seededRandom,
    settle
} from '../../src/lib/state/graph.ts';
import type { GraphEdge, PointNode } from '../../src/lib/state/graph.ts';
import type { Project, Snapshot } from '../../src/lib/data/model.ts';
import { NO_FEEDS } from '../entities-fixture.ts';

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
        programIds: [],
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
            programIds: ['one', 'two'],
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
            programs: {
                one: { id: 'one', title: 'One', fundingIds: [], projectIds: [] },
                two: { id: 'two', title: 'Two', fundingIds: [], projectIds: [] }
            },
            domains: {},
            funding: {},
            collections: {
                collaborations: {
                    id: 'collaborations',
                    title: 'Collaborations',
                    file: '/hub/network/collaborations.yml',
                    entries: [
                        {
                            id: 'person',
                            title: 'Person Name',
                            fields: { key: 'person', title: 'Person Name' },
                            file: '/hub/network/collaborations.yml',
                            index: 0
                        }
                    ]
                }
            },
            feeds: NO_FEEDS,
            career: null
        },
        relations: {
            projectVenue: [],
            projectFunding: [],
            projectDataset: [],
            projectProgram: [],
            projectDomain: [],
            projectRelated: [],
            fundingProgram: []
        },
        findings: []
    };
}

function point(id: string, x: number, y: number, velocity = 0): PointNode {
    return {
        id,
        entityId: id,
        label: id,
        kind: 'project',
        type: 'active',
        degree: 0,
        radius: 7,
        x,
        y,
        vx: velocity,
        vy: 0
    };
}

function edge(id: string, source: string, target: string): GraphEdge {
    return {
        id,
        source,
        target,
        kind: 'related',
        direction: 'one',
        archived: false
    };
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

    it('falls back from an empty short name to the full title', () => {
        const data = snapshot();
        data.entities.projects.alpha.short = '   ';
        data.entities.projects.alpha.title = 'Full title';
        expect(buildGraph(data).nodes.find((node) => node.id === 'project::alpha')?.label).toBe(
            'Full title'
        );
    });

    it('moves coincident nodes apart and pulls a linked pair toward link length', () => {
        const still = [point('a', 400, 340), point('b', 400, 340)];
        const separated = physics(still, [], 1);
        expect(Math.abs(separated[0].x - separated[1].x)).toBeGreaterThan(0);

        const linked = [point('a', 300, 340), point('b', 700, 340)];
        const params = {
            ...DEFAULT_PHYSICS,
            repulse: 0,
            collide: 0,
            center: 0,
            damping: 1,
            linkLength: 100,
            linkStrength: 0.1
        };
        const pulled = physics(linked, [edge('ab', 'a', 'b')], 1, params);
        expect(Math.abs(pulled[0].x - pulled[1].x)).toBeLessThan(400);
    });

    it('counts crossing edges and ignores parallel edges', () => {
        const nodes = [
            point('a', 100, 100),
            point('b', 200, 200),
            point('c', 100, 200),
            point('d', 200, 100)
        ];
        expect(crossings(nodes, [edge('ab', 'a', 'b'), edge('cd', 'c', 'd')])).toBe(1);
        expect(crossings(nodes, [edge('ac', 'a', 'c'), edge('bd', 'b', 'd')])).toBe(0);
    });

    it('settles velocity over repeated ticks', () => {
        const params = {
            ...DEFAULT_PHYSICS,
            repulse: 0,
            collide: 0,
            center: 0,
            damping: 0.5
        };
        const nodes = settle([point('a', 500, 340, 8)], [], 5, params);
        expect(Math.abs(nodes[0].vx)).toBeLessThan(8);
    });

    it('returns the lowest score among the requested settled starts', () => {
        const graph = buildGraph(snapshot());
        const expectedRandom = seededRandom(17);
        const scores = Array.from({ length: 4 }, (_, start) => {
            const nodes = settle(
                placeInit(graph, expectedRandom, undefined, start + expectedRandom() * 7),
                graph.edges,
                20
            );
            return score(nodes, graph.edges);
        });
        const best = bestLayout(graph, seededRandom(17), 4, 20);
        expect(best.score).toBe(Math.min(...scores));
    });

    it('is deterministic and optimization returns a settled result no worse than its settled start', () => {
        const graph = buildGraph(snapshot());
        const first = placeInit(graph, seededRandom(42));
        const second = placeInit(graph, seededRandom(42));
        expect(second).toEqual(first);
        const baseline = bestLayout(graph, seededRandom(42), 3, 150);
        const tuned = optimize(graph, seededRandom(42), 4);
        expect(tuned.nodes).not.toEqual(first);
        expect(tuned.score).toBeLessThanOrEqual(baseline.score);
        expect(layoutKey(graph.nodes)).toBe(layoutKey([...graph.nodes].reverse()));
    });
});
