// Layer 4, test helper. The engine directory the diagram cases generate from, a copy of what the
// generator reads from it, which a case changes to see what a generation over a changed tree gives,
// a parse cache that records every path it is given, and the paths a parser wrapped in vi.fn() was
// called with, so a case sees which files a generation parsed.
//
// The copy is made in a scratch directory of the case's own (tests/fixtures/scratch.ts), checked
// to lie under the system temporary directory before anything is copied into it, so a case that
// changes a file of the copy never writes into the checkout.

import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vi } from 'vitest';
import { BOUNDARIES, ORDERING, OUT } from '../../../bin/diagrams/diagrams.mjs';
import { scratchDir } from '../../fixtures/scratch.ts';

/** The engine directory, tools/oculus. */
export const ENGINE = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..');

/** A copy of what the generator reads (src, the boundary test, the order, the diagrams). */
export function copyOfTree(): string {
    const dir = scratchDir('oculus-diagrams-tree-');
    for (const part of ['src', BOUNDARIES, ORDERING, OUT]) {
        mkdirSync(dirname(join(dir, part)), { recursive: true });
        cpSync(join(ENGINE, part), join(dir, part), { recursive: true });
    }
    return dir;
}

/** A parse cache that records the path of every entry it is given, in the order given. */
export class CountedCache<V> extends Map<string, V> {
    readonly sets: string[] = [];

    override set(path: string, value: V): this {
        this.sets.push(path);
        return super.set(path, value);
    }
}

/** The paths a parser wrapped in vi.fn() was called with from its `from`th call on, sorted. */
export function parsedSince(
    parser: (path: string, text: string) => unknown,
    from: number
): string[] {
    return vi
        .mocked(parser)
        .mock.calls.slice(from)
        .map(([path]) => path)
        .sort();
}
