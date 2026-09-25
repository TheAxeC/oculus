// Layer 4, test helper. The check that no module of src augments another module of the tree.
//
// A `declare module '<module>'` block adds declarations to the module it names from outside it, and
// a `/// <reference path>` directive pulls a file's declarations into the one that writes it.
// Either ties the two modules as an import does, but in whichever direction the writer likes: a
// module low in an order can declare an empty interface that a module above it fills, and the
// folder order and the layer rows, which read imports, would see nothing climb. So a block or a
// directive naming a module of the tree is refused wherever it sits, inside a layer or across two;
// a module that needs another's declarations imports them. A block naming a package (such as
// src/lib/highlight-languages.d.ts over highlight.js) adds to no module of the tree and stays
// allowed, and so does `declare global` in app.d.ts, which boundaries.test.ts holds.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { augmentations, sourceFiles } from './graph.ts';

/**
 * Every augmentation of a module of the tree under a source root, as `module:line augments
 * module`, sorted. `lib` is what `$lib/` stands for under that root, as target() reads it.
 */
export function findAugments(sourceRoot: string, lib = ''): string[] {
    const found: string[] = [];
    for (const fileRel of sourceFiles(sourceRoot)) {
        const text = readFileSync(join(sourceRoot, fileRel), 'utf8');
        for (const one of augmentations(fileRel, text, lib)) {
            found.push(`${fileRel}:${one.line} augments ${one.id}`);
        }
    }
    return found.sort();
}
