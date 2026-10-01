// What a node of the Map opens and the tone it is drawn in. Both are pure, so each case states a
// node and the configuration value and asserts the answer. What this does NOT cover: the pointer
// and the drawing, which are map-pointer.test.ts's and map.test.ts's.

import { describe, expect, it } from 'vitest';
import { nodeTone, viewOf } from '../../../src/lib/views/structure/map/node-view.ts';
import { toneOf, typeTone } from '../../../src/lib/state/shared/words/tones.ts';
import type { GraphNode, PointNode } from '../../../src/lib/state/boards/structure/graph.ts';

/** An archived project node whose status word is `archived`. */
function archivedNode(archived: string): GraphNode {
    return { id: 'n', archived } as unknown as GraphNode;
}

describe('the tone of an archived node', () => {
    it('audits that a node is grey when the colours are no map, or hold no text for the word', () => {
        expect(nodeTone(archivedNode('done'), null)).toBe('grey');
        expect(nodeTone(archivedNode('done'), [])).toBe('grey');
        expect(nodeTone(archivedNode('done'), { done: 3 })).toBe('grey');
        expect(nodeTone(archivedNode('constructor'), {})).toBe('grey');
    });

    it('audits that a node takes the tone of the colour the table names, an inherited one included', () => {
        const green = toneOf('green');
        expect(nodeTone(archivedNode('done'), { done: 'green' })).toBe(green);
        expect(nodeTone(archivedNode('done'), Object.create({ done: 'green' }))).toBe(green);
    });

    it('audits that an own __proto__ key is read as the word it names', () => {
        const colors: unknown = JSON.parse('{"__proto__":"green"}');
        expect(nodeTone(archivedNode('__proto__'), colors)).toBe(toneOf('green'));
    });

    it("audits that a node that is not archived takes its project type's tone", () => {
        const node = { id: 'n', type: 'active' } as unknown as GraphNode;
        expect(nodeTone(node, { active: 'green' })).toBe(typeTone('active'));
    });
});

describe('the view a node opens', () => {
    const point = (fields: Record<string, unknown>): PointNode => fields as unknown as PointNode;

    it('audits that a project opens by its id, a line as the pillars and a person by key', () => {
        expect(viewOf(point({ kind: 'project', entityId: 'p', label: 'P' }))).toStrictEqual({
            view: 'project',
            state: { id: 'p', label: 'P' }
        });
        expect(viewOf(point({ kind: 'line', entityId: 'l', label: 'L' }))).toStrictEqual({
            view: 'pillars'
        });
        expect(viewOf(point({ kind: 'collaborator', entityId: 'k', label: 'K' }))).toStrictEqual({
            view: 'person',
            state: { key: 'k', label: 'K' }
        });
    });
});
