// Layer 3, Map partial helper. What a node of the graph opens, pure, so the Map keeps the rule and
// the shared drawing (views/shared/graph/Graph.svelte) only hands the press back.

import type { PointNode } from '$lib/state/boards/structure/graph';
import { recordState } from '$lib/state/shared/page/records';

/** The view a node opens, with the state it opens it with: a project, a pillar line or a person. */
export function viewOf(node: PointNode): { view: string; state?: Record<string, string> } {
    if (node.kind === 'project') {
        return { view: 'project', state: recordState(node.entityId, node.label) };
    }
    if (node.kind === 'line') return { view: 'pillars' };
    return { view: 'person', state: recordState(node.entityId, node.label) };
}
