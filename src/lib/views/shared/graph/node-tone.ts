// Layer 3, shared graph helper. The tone a node of a graph is drawn in, apart from the node layer
// (Nodes.svelte) so the rule can be read without a rendering.

import type { GraphNode } from '$lib/state/boards/structure/graph';
import { addressOfId } from '$lib/state/shared/page/hubs';
import { stageTone } from '$lib/state/shared/words/tones';

/**
 * The tone a project node is drawn in: the `color` of its stage in the `stages` of its project's
 * hub, the hub its id names, the tone its board card has, archived or not. A node with no stage,
 * or a stage the table does not name, gets the unknown tone.
 */
export function nodeTone(node: GraphNode): string {
    return stageTone(node.stage ?? '', addressOfId(node.entityId).hub);
}
