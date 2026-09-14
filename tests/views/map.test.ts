// The Map view rendered on the server over visible relationships, controls and the empty state.

import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import MapView from '../../src/lib/views/Map.svelte';
import Graph from '../../src/lib/views/map/Graph.svelte';
import { writeRelated } from '../../src/lib/views/map/edge-write.ts';
import { buildGraph, parseMapState } from '../../src/lib/state/graph.ts';
import { setInstanceState } from '../../src/lib/state/ui.svelte.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
import { catalog, fixture, install } from './lines-fixture.ts';

const INSTANCE = 'map-one';

function html(empty = false): string {
    const snapshot = fixture();
    snapshot.entities.projects.alpha.relatedIds = ['old'];
    snapshot.entities.projects.alpha.collaborators = ['person'];
    snapshot.entities.collections.collaborations.entries = [
        {
            id: 'person',
            title: 'Person Name',
            fields: { key: 'person', title: 'Person Name' },
            file: '/hub/network/collaborations.yml',
            index: 0
        }
    ];
    if (empty) {
        for (const project of Object.values(snapshot.entities.projects)) {
            project.programIds = [];
            project.relatedIds = [];
        }
    }
    install(snapshot, empty ? 2405 : 2404);
    setInstanceState(INSTANCE, {});
    const instance: Instance = { id: INSTANCE, view: 'map', state: {} };
    return render(MapView, { props: { instance } }).body;
}

function graphFixture() {
    const snapshot = fixture();
    snapshot.entities.projects.alpha.relatedIds = ['candidate-project', 'outside-project'];
    snapshot.entities.projects.outside.relatedIds = ['alpha'];
    snapshot.entities.projects.alpha.collaborators = ['person'];
    snapshot.entities.collections.collaborations.entries = [
        {
            id: 'person',
            title: 'Person Name',
            fields: { key: 'person', title: 'Person Name' },
            file: '/hub/network/collaborations.yml',
            index: 0
        }
    ];
    return snapshot;
}

function edgeTag(body: string, id: string): string {
    return new RegExp(`<line[^>]*data-edge="${id}"[^>]*>`).exec(body)?.[0] ?? '';
}

describe('the Map view', () => {
    it('draws the catalogued edge failure when the manifest write refuses related', async () => {
        const write = () =>
            Promise.resolve({
                ok: true,
                changed: [],
                refused: [{ field: 'related', reason: 'fixture refusal' }]
            });
        await expect(writeRelated('alpha', ['beta'], write)).resolves.toBe(
            catalog['map.edge_failed'].replace('{0}', 'related: fixture refusal')
        );
    });

    it('draws the head, legend, tools, archived toggle and visible SVG graph', () => {
        const body = html();
        expect(body).toContain(catalog['map.head']);
        expect(body).toContain(catalog['map.legend_active']);
        expect(body).toContain(catalog['map.legend_manuscript']);
        expect(body).toContain(catalog['map.legend_idea']);
        expect(body).toContain(catalog['map.legend_line']);
        expect(body).toContain(catalog['map.link']);
        expect(body).toContain(catalog['map.retune']);
        expect(body).toContain(catalog['map.collaborators']);
        expect(body).toContain(catalog['map.archived']);
        expect(body).toContain('dropped');
        expect(body).toContain('data-map-graph');
        expect(body).toContain('data-node="project::alpha"');
        expect(body).toContain('data-node="line::pillar"');
        expect(body).toContain('data-edge="membership::alpha::pillar"');
        expect(body).not.toContain('data-node="project::dead"');
        expect(body).not.toContain('data-node="collaborator::person"');
    });

    it('draws the catalogued empty state without an SVG when no program or related exists', () => {
        const body = html(true);
        expect(body).toContain(catalog['map.empty']);
        expect(body).not.toContain('data-map-graph');
    });

    it('draws one-way and mutual related edges with their arrow markers', () => {
        const graph = buildGraph(graphFixture());
        const body = render(Graph, {
            props: { graph, instanceId: 'map-markers', linkMode: false }
        }).body;
        const oneWay = edgeTag(body, 'related::alpha::candidate-project');
        const mutual = edgeTag(body, 'related::alpha::outside-project');
        expect(oneWay).toContain('marker-end="url(#map-arrow-map-markers)"');
        expect(oneWay).not.toContain('marker-start=');
        expect(mutual).toContain('marker-end="url(#map-arrow-map-markers)"');
        expect(mutual).toContain('marker-start="url(#map-arrow-map-markers)"');
    });

    it('draws a collaborator only when the graph option is on', () => {
        const snapshot = graphFixture();
        const hidden = render(Graph, {
            props: {
                graph: buildGraph(snapshot),
                instanceId: 'map-collaborators-off',
                linkMode: false
            }
        }).body;
        const shown = render(Graph, {
            props: {
                graph: buildGraph(snapshot, { collaborators: true }),
                instanceId: 'map-collaborators-on',
                linkMode: false
            }
        }).body;
        expect(hidden).not.toContain('data-node="collaborator::person"');
        expect(shown).toContain('data-node="collaborator::person"');
        expect(shown).toContain('data-edge="collaborator::alpha::person"');
    });
});

describe('the Map instance state', () => {
    it('reads the three toggles back, so a reopened tab is the tab as it was left', () => {
        expect(
            parseMapState({ collaborators: true, enabled: ['published'], linkMode: true })
        ).toEqual({ collaborators: true, enabled: ['published'], linkMode: true });
    });

    it('gives a state that carries nothing the toggles off', () => {
        expect(parseMapState(null)).toEqual({
            collaborators: false,
            enabled: [],
            linkMode: false
        });
        expect(parseMapState({ enabled: 'published' })).toEqual({
            collaborators: false,
            enabled: [],
            linkMode: false
        });
        expect(parseMapState({ enabled: ['published', 7] })).toEqual({
            collaborators: false,
            enabled: ['published'],
            linkMode: false
        });
    });

    it('draws the collaborators toggle from the instance state, so a reopened tab keeps it', () => {
        const snapshot = fixture();
        install(snapshot, 2406);
        const instance: Instance = { id: INSTANCE, view: 'map', state: {} };
        setInstanceState(INSTANCE, { collaborators: false, enabled: [], linkMode: false });
        const off = render(MapView, { props: { instance } }).body;
        setInstanceState(INSTANCE, { collaborators: true, enabled: [], linkMode: false });
        const on = render(MapView, { props: { instance } }).body;
        const box = /<input[^>]*type="checkbox"[^>]*>/;
        expect(box.exec(off)?.[0]).not.toContain('checked');
        expect(box.exec(on)?.[0]).toContain('checked');
    });
});
