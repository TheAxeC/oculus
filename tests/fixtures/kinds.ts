// Layer 4, test helper. The body kinds of the write endpoint, read out of the parsers themselves.
//
// Two gates are made over it: every kind has a word in the catalog for the History view to draw,
// and the view draws that word rather than the wire's own. Reading the kinds from the source is
// what makes a kind added to writes/bodies.ts fail those gates instead of quietly drawing its wire
// word.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { engineDir } from '../../src/lib/data/sources/config.ts';

/**
 * Every body kind the write endpoint knows, except `undo`, which records as the kind it took back.
 */
export function recordedKinds(): string[] {
    const source = readFileSync(
        join(engineDir(), 'src', 'lib', 'server', 'edit', 'writes', 'bodies.ts'),
        'utf8'
    );
    const found = [...source.matchAll(/body\.kind !== '([a-z-]+)'/g)].map((one) => one[1]);
    return [...new Set(found)].filter((kind) => kind !== 'undo');
}
