// The Map view rendered on the server over visible relationships, controls, the empty state and
// the placement neato gives from the pane's start seed, settled under the Map's forces.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Viz } from '@viz-js/viz';
import MapView from '../../../src/lib/views/structure/map/Map.svelte';
import Graph from '../../../src/lib/views/structure/map/Graph.svelte';
import { writeRelated } from '../../../src/lib/views/structure/map/edge-write.ts';
import {
    buildGraph,
    layoutKey,
    layoutSeed,
    nextStart,
    parseMapState,
    startFor
} from '../../../src/lib/state/boards/structure/graph.ts';
import type { Graph as BuiltGraph } from '../../../src/lib/state/boards/structure/graph.ts';
import { placeGraph } from '../../../src/lib/state/boards/structure/layout.ts';
import { createForces, settleForces } from '../../../src/lib/state/boards/structure/forces.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { catalog, fixture, install } from './lines-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let setInstanceState: ClientState['ui']['setInstanceState'];
let viz: Viz;

/** A new client with its Graphviz loaded, so a render draws the placed nodes at once. */
beforeEach(async () => {
    client = createClientState();
    ({ setInstanceState } = client.ui);
    viz = await client.graphviz.ready();
});

/** A client's Graphviz as a case holds it: not loaded yet, or refusing every graph. */
function holding(loaded: Viz | null): ClientState['graphviz'] {
    return { ...client.graphviz, loaded: () => loaded };
}

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

/** Where those same circles rest: neato's placement from the pane's seed, settled by the forces. */
function placed(graph: BuiltGraph, seed: number): string[] {
    return settleForces(createForces(placeGraph(viz, graph, seed).nodes, graph.edges))
        .filter((node) => node.kind === 'project')
        .map((node) => `${node.x},${node.y}`);
}

/** The graph drawn from the start seed a pane hands down. */
function drawGraph(client: ClientState, graph: BuiltGraph, seed: number): string {
    return render(Graph, {
        context: clientContext(client),
        props: { graph, instanceId: 'map-layout', linkMode: false, seed }
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
                seed: 1
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
        const body = drawGraph(client, graph, 1);
        const tag = (id: string): string =>
            [...body.matchAll(/<text[^>]*>/g)]
                .map((one) => one[0])
                .find((one) => one.includes(`data-label="${id}"`)) ?? '';
        expect(tag('project::gone')).toMatch(/class="[^"]*\barchived\b/);
        expect(tag('project::live')).not.toMatch(/\barchived\b/);
    });

    it('draws every node where it rests from the seed it is handed', () => {
        const graph = buildGraph(graphFixture());
        const first = drawGraph(client, graph, 3);
        expect(circles(first)).toEqual(placed(graph, 3));
        expect(nodes(first)).toBe(graph.nodes.length);
        const other = drawGraph(client, graph, 4);
        expect(circles(other)).toEqual(placed(graph, 4));
        expect(circles(other)).not.toEqual(circles(first));
    });

    it('draws no node before Graphviz has loaded, and keeps the canvas', () => {
        client.graphviz = holding(null);
        const body = drawGraph(client, buildGraph(graphFixture()), 3);
        expect(body).toContain('data-map-graph');
        expect(nodes(body)).toBe(0);
    });

    it('says in one catalogued line why the engine refused the graph, and draws no node', () => {
        const refusing = {
            renderJSON: () => {
                throw new Error('syntax error in line 1');
            }
        } as unknown as Viz;
        client.graphviz = holding(refusing);
        const body = drawGraph(client, buildGraph(graphFixture()), 3);
        expect(body).toContain(
            catalog['map.layout_failed'].replace('{0}', 'syntax error in line 1')
        );
        expect(nodes(body)).toBe(0);
    });

    it('draws the saved start, and re-tune lays the map out from the next seed', () => {
        expect(html()).toContain(catalog['map.retune']);
        const graph = buildGraph(graphFixture());
        const saved = parseMapState({ start: { key: layoutKey(graph.nodes), seed: 5 } });

        const kept = drawGraph(client, graph, startFor(saved, graph.nodes));
        expect(circles(kept)).toEqual(placed(graph, 5));

        // What the control writes: the seed one above the one in force, under this node set.
        const next = nextStart(saved, graph.nodes);
        expect(next).toEqual({ key: layoutKey(graph.nodes), seed: 6 });
        const again = drawGraph(
            client,
            graph,
            startFor(parseMapState({ start: next }), graph.nodes)
        );
        expect(circles(again)).toEqual(placed(graph, 6));
        expect(circles(again)).not.toEqual(circles(kept));
    });

    it('lays a pane saved with an old tuning out from its default seed', () => {
        const fresh = html();
        const old = html(false, { tuned: { key: 'oculus-map-v1-x', params: { repulse: 1 } } });
        expect(circles(old)).toEqual(circles(fresh));
        expect(circles(fresh).length).toBeGreaterThan(0);
    });

    it('draws the picture of the seed a pane saved for the node set it shows, and no other', () => {
        const fresh = html();
        // The graph html() draws: the fixture with alpha's one related project, no filter.
        const snapshot = fixture();
        snapshot.entities.projects.alpha.relatedIds = ['old'];
        const graph = buildGraph(snapshot);
        const seed = layoutSeed(graph.nodes) + 9;
        const saved = html(false, { start: { key: layoutKey(graph.nodes), seed } });
        expect(circles(saved)).toEqual(placed(graph, seed));
        expect(circles(saved)).not.toEqual(circles(fresh));
        // A seed saved for another node set leaves this one on its default.
        const other = html(false, { start: { key: 'oculus-map-v1-other', seed } });
        expect(circles(other)).toEqual(circles(fresh));
    });

    it('draws a collaborator only when the graph option is on', () => {
        const snapshot = graphFixture();
        const hidden = render(Graph, {
            context: clientContext(client),
            props: {
                graph: buildGraph(snapshot),
                instanceId: 'map-collaborators-off',
                linkMode: false,
                seed: 1
            }
        }).body;
        const shown = render(Graph, {
            context: clientContext(client),
            props: {
                graph: buildGraph(snapshot, { collaborators: true }),
                instanceId: 'map-collaborators-on',
                linkMode: false,
                seed: 1
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

    it('audits that keeps a start seed a map could be laid out from, and drops one it could not', () => {
        const key = layoutKey(buildGraph(fixture()).nodes);
        expect(parseMapState({ start: { key, seed: 12 } }).start).toEqual({ key, seed: 12 });
        expect(parseMapState({ start: { key, seed: 0 } }).start).toEqual({ key, seed: 0 });
        expect(parseMapState({ start: { key: 7, seed: 12 } }).start).toBeUndefined();
        expect(parseMapState({ start: { key, seed: '12' } }).start).toBeUndefined();
        expect(parseMapState({ start: { key, seed: Number.NaN } }).start).toBeUndefined();
        expect(parseMapState({ start: { key, seed: 1.5 } }).start).toBeUndefined();
        expect(parseMapState({ start: { key, seed: -1 } }).start).toBeUndefined();
        expect(parseMapState({ start: { seed: 12 } }).start).toBeUndefined();
        expect(parseMapState({ start: key }).start).toBeUndefined();
        expect(parseMapState({}).start).toBeUndefined();
        expect(parseMapState({ tuned: { key, params: {} } })).toEqual(OFF);
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
    it('audits that it reads the text scale and the placement, so a change to the text size, and the nodes drawn once Graphviz has loaded, measure again', () => {
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
        expect(effect?.[1]).toContain("void chosen.nodes.map((node) => node.id).join('\\n');");
        expect(effect?.[1]).toContain('void tick().then(measure);');
    });
});

describe('the drag on the settled forces', () => {
    // Source audits: the press, the release and the effect run only against a page, which the
    // unit suite does not draw, so each reads the handler's own text in Graph.svelte.
    const source = readFileSync(
        resolve(
            fileURLToPath(import.meta.url),
            '..',
            '..',
            '..',
            '..',
            'src/lib/views/structure/map/Graph.svelte'
        ),
        'utf8'
    );

    /** The body of one function of the component's script, up to its closing brace. */
    function body(name: string): string {
        return (
            new RegExp(
                `\\n {4}function ${name}\\([^)]*\\): [^{\\n]+ \\{([\\s\\S]*?)\\n {4}\\}`
            ).exec(source)?.[1] ?? ''
        );
    }

    /** The effect that registers the tick listener on the settled simulation. */
    function tickEffect(): string {
        return (
            [...source.matchAll(/\n {4}\$effect\(\(\) => \{([\s\S]*?)\n {4}\}\);/g)]
                .map((one) => one[1])
                .find((one) => one.includes("on('tick'")) ?? ''
        );
    }

    it('audits that a press fixes the node through press() and never restarts the simulation', () => {
        expect(body('nodeDown')).toMatch(/\bpress\(/);
        // A press moves nothing, and a simulation run again at the press would move every node
        // that is still cooling from the last drag, so only the first pointer move starts it.
        expect(body('nodeDown')).not.toContain('restart(');
    });

    it('audits that a release frees the held node whatever the branch, a click and a cancel included', () => {
        // The release is a statement of pointerUp's own, after the branches, so the click that
        // opens a node and a cancel, which pointerup and pointercancel both reach, free it too.
        expect(body('pointerUp')).toMatch(/\n {8}if \(drag !== null[^\n]*\) release\(/);
        expect(source).toContain('onpointercancel={pointerUp}');
    });

    it('audits that the placement is made again only when its key changes, not for a graph built anew', () => {
        expect(source).toContain('const shape = $derived(placementKey(graph, seed));');
        expect(source).toContain('const chosen = $derived(placedFor(shape, viz));');
        expect(body('placedFor')).toContain(
            'return untrack(() => mapPlacement(answer, graph, seed));'
        );
    });

    it("audits that the simulation's effect clears the drawn positions and stops it in its cleanup", () => {
        const effect = tickEffect();
        expect(effect).toContain('placed = null;');
        expect(effect).toMatch(/return \(\) => \{[\s\S]*\.stop\(\);[\s\S]*on\('tick', null\)/);
    });
});
