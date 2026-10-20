// Layer 1, data. A value of the merged config at a dotted key path, read and set: the one walk the
// layers of the merge (the hub's settings file, the workspace file) and the options folder share,
// so a path means the same map in each.

import { isMap } from '../../../helpers/guards.ts';

/** The value at a dotted path of a map, through its own keys, or undefined where there is none. */
export function valueAt(tree: Record<string, unknown>, path: string): unknown {
    let node: unknown = tree;
    for (const step of path.split('.')) {
        if (!isMap(node) || !Object.hasOwn(node, step)) return undefined;
        node = node[step];
    }
    return node;
}

/**
 * Set a value at a dotted path of a map, making the maps on the way. A map on the way is copied
 * before it is changed, so a value read out of the tree earlier (an option's default) keeps what it
 * held.
 */
export function setAt(tree: Record<string, unknown>, path: string, value: unknown): void {
    const steps = path.split('.');
    const last = steps.pop() ?? path;
    let node = tree;
    for (const step of steps) {
        const next = node[step];
        node[step] = isMap(next) ? { ...next } : {};
        node = node[step] as Record<string, unknown>;
    }
    node[last] = value;
}
