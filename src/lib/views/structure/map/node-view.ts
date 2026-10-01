// Layer 3, Map partial helper. What a node of the graph opens and the tone it is drawn in. Both are
// pure, so the graph component keeps the drawing and the pointer and this module keeps the rules.

import { z } from 'zod';
import { mapShape, readAs } from '$lib/data/shapes/shapes';
import type { GraphNode, PointNode } from '$lib/state/boards/structure/graph';
import { toneOf, typeTone } from '$lib/state/shared/words/tones';

/** A colour word of the configuration's `arch_color` table. */
const colorShape = z.string();

/** The view a node opens, with the state it opens it with: a project, a pillar line or a person. */
export function viewOf(node: PointNode): { view: string; state?: Record<string, string> } {
    if (node.kind === 'project') {
        return { view: 'project', state: { id: node.entityId, label: node.label } };
    }
    if (node.kind === 'line') return { view: 'pillars' };
    return { view: 'person', state: { key: node.entityId, label: node.label } };
}

/**
 * The tone a node is drawn in: its project type's, or, for an archived project, the colour the
 * configuration's `arch_color` table gives its status, grey when it names none.
 */
export function nodeTone(node: GraphNode, archColors: unknown): string {
    if (node.archived === undefined) return typeTone(node.type ?? '');
    const color = readAs(colorShape, readAs(mapShape, archColors)?.[node.archived]);
    return color === null ? 'grey' : toneOf(color);
}
