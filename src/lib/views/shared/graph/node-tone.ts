// Layer 3, shared graph helper. The tone a node of a graph is drawn in, apart from the node layer
// (Nodes.svelte) so the rule can be read without a rendering.

import type { GraphNode } from '$lib/state/boards/structure/graph';
import { typeTone } from '$lib/state/shared/words/tones';

/**
 * The tone a project node is drawn in: the `color` of its type in the configuration's `types`, the
 * tone its board card has, archived or not. A node with no type, or a type the
 * table does not name, gets the unknown tone.
 */
export function nodeTone(node: GraphNode): string {
    return typeTone(node.type ?? '');
}
