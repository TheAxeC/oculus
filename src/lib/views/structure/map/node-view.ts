// Layer 3, Map partial helper. What a node of the graph opens and the tone it is drawn in. Both are
// pure, so the graph component keeps the drawing and the pointer and this module keeps the rules.

import type { GraphNode, PointNode } from '$lib/state/boards/structure/graph';
import { typeTone } from '$lib/state/shared/words/tones';

/** The view a node opens, with the state it opens it with: a project, a pillar line or a person. */
export function viewOf(node: PointNode): { view: string; state?: Record<string, string> } {
    if (node.kind === 'project') {
        return { view: 'project', state: { id: node.entityId, label: node.label } };
    }
    if (node.kind === 'line') return { view: 'pillars' };
    return { view: 'person', state: { key: node.entityId, label: node.label } };
}

/**
 * The tone a node is drawn in: its project type's through the configuration's `type_color`, the
 * tone its board card has, archived or not. A node with no type, or a type the table does not
 * name, gets the unknown tone.
 */
export function nodeTone(node: GraphNode): string {
    return typeTone(node.type ?? '');
}
