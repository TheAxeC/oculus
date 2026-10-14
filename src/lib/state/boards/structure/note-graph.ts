// Layer 2, client state. The Notes Graph's graph: every note of the hubs shown a node, drawn as the
// Map's graph is (graph.ts's `Graph`), and every link from one note to another an edge, read from
// the note index the Notes section keeps (sources/explorer/notes/note-index.ts).

import type { HubNotes } from '../../../data/model/index.ts';
import { noteTitle } from '../../../data/prose/markdown/note-names.ts';
import { notesOf, type NotePlace } from '../../sources/explorer/notes/note-index.ts';
import type { Graph, GraphEdge, GraphNode } from './graph.ts';

/** The radius a note's node is drawn at. */
const NOTE_RADIUS = 7;

/** The id a note is a node by: its hub's root key and its path inside the notes folder. */
function nodeId(root: string, path: string): string {
    return `${root}/${path}`;
}

/** The note a node of the Notes Graph stands for: its hub's root key and its path in the folder. */
export function nodePlace(node: Pick<GraphNode, 'id' | 'entityId'>): NotePlace {
    return {
        root: node.id.slice(0, node.id.length - node.entityId.length - 1),
        path: node.entityId
    };
}

/**
 * The Notes Graph of the hubs `shown` names (every hub when it is null or names none the notes
 * hold), as the Map's graph is drawn: every note a node of the kind `note` labelled by its name,
 * its `entityId` its path inside its hub's notes folder; every link from one note to another an
 * edge with an arrow at the note it names, once per pair, and two notes linking each other one
 * edge with an arrow at each end.
 */
export function noteGraph(hubs: readonly HubNotes[], shown: string | null): Graph {
    const held = shown !== null && hubs.some((one) => one.root === shown) ? shown : null;
    const nodes: GraphNode[] = [];
    const pairs = new Map<string, { source: string; target: string; both: boolean }>();
    for (const hub of hubs) {
        if (held !== null && hub.root !== held) continue;
        const notes = notesOf(hub);
        const paths = new Set(notes.map((one) => one.path));
        for (const note of notes) {
            const id = nodeId(hub.root, note.path);
            nodes.push({
                id,
                entityId: note.path,
                label: noteTitle(note.path),
                kind: 'note',
                degree: 0,
                radius: NOTE_RADIUS
            });
            for (const link of note.links ?? []) {
                if (!paths.has(link.to) || link.to === note.path) continue;
                const to = nodeId(hub.root, link.to);
                const back = pairs.get(`${to}\n${id}`);
                if (back !== undefined) back.both = true;
                else if (!pairs.has(`${id}\n${to}`)) {
                    pairs.set(`${id}\n${to}`, { source: id, target: to, both: false });
                }
            }
        }
    }
    const edges: GraphEdge[] = [...pairs.values()].map((pair) => ({
        id: `${pair.source}\n${pair.target}`,
        source: pair.source,
        target: pair.target,
        kind: 'related',
        direction: pair.both ? 'mutual' : 'one',
        archived: false
    }));
    for (const edge of edges) {
        for (const node of nodes) {
            if (node.id === edge.source || node.id === edge.target) node.degree += 1;
        }
    }
    return { nodes, edges };
}

/** The hubs the graph's filter offers: every hub whose notes folder read. */
export function graphHubs(hubs: readonly HubNotes[]): string[] {
    return hubs.filter((one) => one.state === 'ok').map((one) => one.root);
}
