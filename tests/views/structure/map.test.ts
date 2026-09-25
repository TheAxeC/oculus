// The Map view rendered on the server over visible relationships, controls and the empty state.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import MapView from '../../../src/lib/views/structure/map/Map.svelte';
import Graph from '../../../src/lib/views/structure/map/Graph.svelte';
import { writeRelated } from '../../../src/lib/views/structure/map/edge-write.ts';
import {
    DEFAULT_PHYSICS,
    buildGraph,
    layoutKey,
    mapLayout,
    parseMapState,
    tunedFor
} from '../../../src/lib/state/boards/structure/graph.ts';
import type {
    Graph as BuiltGraph,
    Physics
} from '../../../src/lib/state/boards/structure/graph.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { catalog, fixture, install } from './lines-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { noop } from '../../fixtures/doubles.ts';

let client: ClientState;
let setInstanceState: ClientState['ui']['setInstanceState'];

beforeEach(() => {
    client = createClientState();
    ({ setInstanceState } = client.ui);
});

const INSTANCE = 'map-one';

/** Each render installs its own portfolio version, so a later one is not taken for a stale push. */
let version = 2404;

function html(empty = false, state: Record<string, unknown> = {}): string {
    const snapshot = fixture();
    snapshot.entities.projects.alpha.relatedIds = ['old'];
    snapshot.entities.projects.alpha.collaborators = ['person'];
    snapshot.entities.people.person = {
        id: 'person',
        name: 'Person Name',
        affiliations: [],
        links: [],
        projectIds: ['alpha'],
        jointWorkIds: []
    };
    if (empty) {
        for (const project of Object.values(snapshot.entities.projects)) {
            project.pillarIds = [];
            project.relatedIds = [];
        }
    }
    version += 1;
    install(client, snapshot, version);
    setInstanceState(INSTANCE, state);
    const instance: Instance = { id: INSTANCE, view: 'map', state: {} };
    return render(MapView, { context: clientContext(client), props: { instance } }).body;
}

function graphFixture() {
    const snapshot = fixture();
    snapshot.entities.projects.alpha.relatedIds = ['candidate-project', 'outside-project'];
    snapshot.entities.projects.outside.relatedIds = ['alpha'];
    snapshot.entities.projects.alpha.collaborators = ['person'];
    snapshot.entities.people.person = {
        id: 'person',
        name: 'Person Name',
        affiliations: [],
        links: [],
        projectIds: ['alpha'],
        jointWorkIds: []
    };
    return snapshot;
}

function edgeTag(body: string, id: string): string {
    return new RegExp(`<line[^>]*data-edge="${id}"[^>]*>`).exec(body)?.[0] ?? '';
}

/** One filter's words: what it filters by, and how many projects of it the graph holds now. */
function counted(name: string, count: number): string {
    return catalog['map.count'].replace('{0}', name).replace('{1}', String(count));
}

/** The opening tag of the control carrying those words, which is where its state is written. */
function control(body: string, words: string): string {
    const at = body.indexOf(`>${words}<`);
    expect(at, words).toBeGreaterThan(-1);
    const open = body.lastIndexOf('<button', at);
    expect(open, words).toBeGreaterThan(-1);
    return body.slice(open, at);
}

/** What the control carrying those words says its own state is. */
function pressed(body: string, words: string): string {
    return /aria-pressed="(true|false)"/.exec(control(body, words))?.[1] ?? '';
}

/** The classes of that control, which is where a toolbar control says it is the one in force. */
function classes(body: string, words: string): string[] {
    return (/class="([^"]*)"/.exec(control(body, words))?.[1] ?? '').split(/\s+/);
}

/** How many nodes the drawn graph holds, which is what a filter takes down. */
function nodes(body: string): number {
    return (body.match(/data-node="/g) ?? []).length;
}

/** Where the drawn project circles sit, which is the layout the component actually ran. */
function circles(body: string): string[] {
    return [...body.matchAll(/<circle\b[^>]*>/g)].map((tag) => {
        const cx = /cx="([^"]*)"/.exec(tag[0])?.[1] ?? '';
        const cy = /cy="([^"]*)"/.exec(tag[0])?.[1] ?? '';
        return `${cx},${cy}`;
    });
}

/** Where the pure rule puts those same circles under the parameters the pane hands down. */
function placed(graph: BuiltGraph, tuned: Physics | null): string[] {
    return mapLayout(graph, tuned)
        .nodes.filter((node) => node.kind === 'project')
        .map((node) => `${node.x},${node.y}`);
}

/**
 * The graph drawn with the parameters a pane saved, and the callback it reports a tuning through.
 */
function drawGraph(
    client: ClientState,
    graph: BuiltGraph,
    tuned: Physics | null,
    ontuned: (params: Physics) => void = noop
): string {
    return render(Graph, {
        context: clientContext(client),
        props: { graph, instanceId: 'map-layout', linkMode: false, tuned, ontuned }
    }).body;
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
        // a dropped project is left out of the graph
        expect(body).not.toContain('data-node="project::dead"');
        // and the collaborators are off, so no person is a node
        expect(body).not.toContain('data-node="collaborator::person"');
    });

    it('draws the catalogued empty state without an SVG when no pillar or related exists', () => {
        const body = html(true);
        expect(body).toContain(catalog['map.empty']);
        // there is nothing to draw, so the empty line stands in place of the canvas
        expect(body).not.toContain('data-map-graph');
    });

    it('draws one-way and mutual related edges with their arrow markers', () => {
        const graph = buildGraph(graphFixture());
        const body = render(Graph, {
            context: clientContext(client),
            props: {
                graph,
                instanceId: 'map-markers',
                linkMode: false,
                tuned: null,
                ontuned: noop
            }
        }).body;
        const oneWay = edgeTag(body, 'related::alpha::candidate-project');
        const mutual = edgeTag(body, 'related::alpha::outside-project');
        expect(oneWay).toContain('marker-end="url(#map-arrow-map-markers)"');
        // the relation goes one way, so the line carries an arrow at one end alone
        expect(oneWay).not.toContain('marker-start=');
        expect(mutual).toContain('marker-end="url(#map-arrow-map-markers)"');
        expect(mutual).toContain('marker-start="url(#map-arrow-map-markers)"');
    });

    it('draws one filter for every type and every line the graph holds, each with its count', () => {
        const body = html();
        expect(body).toContain(catalog['map.types']);
        expect(body).toContain(catalog['map.lines']);
        expect(body).toContain(catalog['map.connected']);
        expect(body).toContain(catalog['map.all']);
        // The two active projects of the fixture, its one idea and its one manuscript; the three
        // lines an unarchived project is a member of, each with that one project.
        expect(body).toContain(counted('active', 2));
        expect(body).toContain(counted('idea', 1));
        expect(body).toContain(counted('manuscript', 1));
        expect(body).toContain(counted('pillar', 1));
        expect(body).toContain(counted('candidate', 1));
        expect(body).toContain(counted('outside', 1));
        // `dormant` is the archived project's line, which an unfiltered map does not draw.
        expect(body).not.toContain(counted('dormant', 0));
    });

    it('presses the filters the state names, recounts the rest, and draws fewer nodes', () => {
        const whole = html();
        const filtered = html(false, { types: ['idea'] });
        expect(pressed(filtered, counted('idea', 1))).toBe('true');
        expect(pressed(filtered, counted('active', 0))).toBe('false');
        expect(pressed(whole, counted('idea', 1))).toBe('true');
        expect(pressed(whole, counted('active', 2))).toBe('true');
        expect(nodes(filtered)).toBeLessThan(nodes(whole));
        expect(filtered).toContain('data-node="project::candidate-project"');
        // the type filter holds the ideas, and this project is not one
        expect(filtered).not.toContain('data-node="project::alpha"');
    });

    it('draws a line filter as a pressed toolbar control carrying the line title', () => {
        const body = html(false, { lines: ['pillar'] });
        expect(body).toContain('Pillar **One**');
        expect(body).toContain('data-node="line::pillar"');
        // the line filter holds the pillar, and this line is another one
        expect(body).not.toContain('data-node="line::outside"');
        expect(body).toContain('data-node="project::outside-project"');

        const joined = html(false, { lines: ['pillar'], connected: true });
        // the connected toggle drops a project no line in force reaches
        expect(joined).not.toContain('data-node="project::outside-project"');
        expect(joined).toContain('data-node="project::alpha"');
    });

    it('draws the whole graph for a saved filter naming a type the portfolio no longer holds', () => {
        const whole = html();
        const stale = html(false, { types: ['gone'], lines: ['vanished'] });
        expect(nodes(stale)).toBe(nodes(whole));
        expect(pressed(stale, counted('active', 2))).toBe('true');
        expect(pressed(stale, counted('idea', 1))).toBe('true');
        expect(pressed(stale, counted('pillar', 1))).toBe('true');
    });

    it('says so in place of the canvas when the filters leave nothing, and keeps the row', () => {
        const body = html(false, { types: ['idea'], lines: ['pillar'], connected: true });
        expect(body).toContain(catalog['map.empty_filtered']);
        // the filters leave nothing, so the empty line stands in place of the canvas
        expect(body).not.toContain('data-map-graph');
        expect(body).toContain('data-map-filters');
        expect(body).toContain(catalog['map.all']);
        // nothing is filtered out when no filter is in force, so that line is not drawn
        expect(html()).not.toContain(catalog['map.empty_filtered']);
    });

    it('leaves a line another filter emptied pressed, and not drawn as the one in force', () => {
        const body = html(false, { types: ['idea'] });
        expect(classes(body, counted('candidate', 1))).toContain('active');
        expect(pressed(body, counted('candidate', 1))).toBe('true');
        // another filter emptied this line, so it is not drawn as one in force
        expect(classes(body, counted('pillar', 0))).not.toContain('active');
        expect(pressed(body, counted('pillar', 0))).toBe('true');
    });

    it("dims an archived node's label with its node, and no other label", () => {
        const graph: BuiltGraph = {
            nodes: [
                {
                    id: 'project::live',
                    entityId: 'live',
                    label: 'Live',
                    kind: 'project',
                    degree: 0,
                    radius: 8
                },
                {
                    id: 'project::gone',
                    entityId: 'gone',
                    label: 'Gone',
                    kind: 'project',
                    archived: 'nogo',
                    degree: 0,
                    radius: 8
                }
            ],
            edges: []
        };
        const body = drawGraph(client, graph, null);
        const tag = (id: string): string =>
            [...body.matchAll(/<text[^>]*>/g)]
                .map((one) => one[0])
                .find((one) => one.includes(`data-label="${id}"`)) ?? '';
        expect(tag('project::gone')).toMatch(/class="[^"]*\barchived\b/);
        expect(tag('project::live')).not.toMatch(/\barchived\b/);
    });

    it('places under the parameters it is handed, and tunes its own when it is handed none', () => {
        const graph = buildGraph(graphFixture());
        const fresh = mapLayout(graph, null);

        const tuning = drawGraph(client, graph, null);
        expect(circles(tuning)).toEqual(placed(graph, null));
        expect(nodes(tuning)).toBe(graph.nodes.length);

        const held = drawGraph(client, graph, fresh.params);
        expect(circles(held)).toEqual(placed(graph, fresh.params));
        expect(nodes(held)).toBe(graph.nodes.length);
        expect(circles(held)).not.toEqual(circles(tuning));

        // There is no DOM in this suite, so onMount does not run and the callback cannot fire here:
        // what it would be handed is the rule below, and the press itself is in tests/browser.
        expect(mapLayout(graph, null).tuned).toEqual(fresh.params);
        expect(mapLayout(graph, fresh.params).tuned).toBeNull();
    });

    it('draws the saved tuning, and lays the map out again once the re-tune control clears it', () => {
        expect(html()).toContain(catalog['map.retune']);
        const graph = buildGraph(graphFixture());
        const first = mapLayout(graph, null);
        const saved = parseMapState({
            tuned: { key: layoutKey(graph.nodes), params: first.params }
        });

        const held = drawGraph(client, graph, tunedFor(saved, graph.nodes));
        expect(circles(held)).toEqual(placed(graph, first.params));

        // What the control writes: the same state with the tuning dropped, so the map tunes again.
        const cleared = parseMapState({ ...saved, tuned: undefined });
        expect(cleared.tuned).toBeUndefined();
        expect(tunedFor(cleared, graph.nodes)).toBeNull();

        const again = drawGraph(client, graph, tunedFor(cleared, graph.nodes));
        expect(circles(again)).toEqual(placed(graph, null));
        expect(circles(again)).not.toEqual(circles(held));
    });

    it('draws a collaborator only when the graph option is on', () => {
        const snapshot = graphFixture();
        const hidden = render(Graph, {
            context: clientContext(client),
            props: {
                graph: buildGraph(snapshot),
                instanceId: 'map-collaborators-off',
                linkMode: false,
                tuned: null,
                ontuned: noop
            }
        }).body;
        const shown = render(Graph, {
            context: clientContext(client),
            props: {
                graph: buildGraph(snapshot, { collaborators: true }),
                instanceId: 'map-collaborators-on',
                linkMode: false,
                tuned: null,
                ontuned: noop
            }
        }).body;
        // the collaborators toggle is off, so no person is a node
        expect(hidden).not.toContain('data-node="collaborator::person"');
        expect(shown).toContain('data-node="collaborator::person"');
        expect(shown).toContain('data-edge="collaborator::alpha::person"');
    });
});

describe('the Map instance state', () => {
    const OFF = {
        collaborators: false,
        enabled: [],
        linkMode: false,
        types: [],
        lines: [],
        connected: false
    };

    it('reads every toggle back, so a reopened tab is the tab as it was left', () => {
        expect(
            parseMapState({
                collaborators: true,
                enabled: ['published'],
                linkMode: true,
                types: ['idea'],
                lines: ['pillar'],
                connected: true
            })
        ).toEqual({
            collaborators: true,
            enabled: ['published'],
            linkMode: true,
            types: ['idea'],
            lines: ['pillar'],
            connected: true
        });
    });

    it('audits that gives a state that carries nothing the toggles off and every filter empty', () => {
        expect(parseMapState(null)).toEqual(OFF);
        expect(parseMapState({ enabled: 'published' })).toEqual(OFF);
        expect(parseMapState({ types: 'idea', lines: 3, connected: 'yes' })).toEqual(OFF);
        expect(parseMapState({ enabled: ['published', 7] })).toEqual({
            ...OFF,
            enabled: ['published']
        });
        expect(parseMapState({ types: ['idea', null], lines: ['pillar'] })).toEqual({
            ...OFF,
            types: ['idea'],
            lines: ['pillar']
        });
    });

    it('audits that keeps a tuning a map could be laid out from, and drops one it could not', () => {
        const params = { ...DEFAULT_PHYSICS, repulse: 7777 };
        const key = layoutKey(buildGraph(fixture()).nodes);
        expect(parseMapState({ tuned: { key, params } }).tuned).toEqual({ key, params });
        expect(parseMapState({ tuned: { key: 7, params } }).tuned).toBeUndefined();
        expect(
            parseMapState({ tuned: { key, params: { ...params, cool: 'fast' } } }).tuned
        ).toBeUndefined();
        expect(
            parseMapState({ tuned: { key, params: { ...params, repulse: Number.NaN } } }).tuned
        ).toBeUndefined();
        expect(parseMapState({ tuned: { params } }).tuned).toBeUndefined();
        expect(parseMapState({ tuned: key }).tuned).toBeUndefined();
        expect(parseMapState({}).tuned).toBeUndefined();
    });

    it('draws the collaborators toggle from the instance state, so a reopened tab keeps it', () => {
        const snapshot = fixture();
        install(client, snapshot, 2406);
        const instance: Instance = { id: INSTANCE, view: 'map', state: {} };
        setInstanceState(INSTANCE, { collaborators: false, enabled: [], linkMode: false });
        const off = render(MapView, { context: clientContext(client), props: { instance } }).body;
        setInstanceState(INSTANCE, { collaborators: true, enabled: [], linkMode: false });
        const on = render(MapView, { context: clientContext(client), props: { instance } }).body;
        const box = /<input[^>]*type="checkbox"[^>]*>/;
        // the instance says the toggle is off, so the box is not ticked
        expect(box.exec(off)?.[0]).not.toContain('checked');
        expect(box.exec(on)?.[0]).toContain('checked');
    });
});

describe('the label measuring', () => {
    // A source audit: the read is the effect's own dependency, and a page cannot isolate it, since
    // the same change rewrites the pane's state and derives the graph again through that.
    it('audits that it reads the text scale, so a change to the text size measures again', () => {
        const file = resolve(
            fileURLToPath(import.meta.url),
            '..',
            '..',
            '..',
            '..',
            'src/lib/views/structure/map/Graph.svelte'
        );
        const effect = /\$effect\(\(\) => \{([\s\S]*?)\n {4}\}\);/.exec(readFileSync(file, 'utf8'));
        expect(effect?.[1]).toContain('void textScale();');
        expect(effect?.[1]).toContain('void tick().then(measure);');
    });
});
