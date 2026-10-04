// Layer 1, data tests. readDoc and projectDocs against synthetic files in a temporary directory.
// Nothing outside it is read or written, and every write asserts its path is inside the temporary
// directory first.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { isFinding, projectDocs, readDoc } from '../../../src/lib/data/sources/docs.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type { DocPresence } from '../../../src/lib/data/model/index.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

function scratch(): string {
    const dir = scratchDir('oculus-docs-');
    return dir;
}

function write(root: string, rel: string, body: string): string {
    const full = join(root, rel);
    expect(resolve(full).startsWith(resolve(root) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
    return full;
}

function present(docs: DocPresence[]): string[] {
    return docs.filter((d) => d.present).map((d) => d.name);
}

/** The catalog the findings are worded from: the one oculus ships, read as the server reads it. */
const CATALOG = textCatalog(loadConfig(engineDir()).config);

describe('readDoc', () => {
    it('splits a leading frontmatter block from the body', () => {
        const root = scratch();
        const file = write(
            root,
            'with.md',
            ['---', 'title: BT-FNO', 'tags: [tensor, operator]', '---', '', '# BT-FNO', ''].join(
                '\n'
            )
        );

        const doc = readDoc(file, CATALOG);
        expect(isFinding(doc)).toBe(false);
        if (isFinding(doc)) return;
        expect(doc.frontmatter).toEqual({ title: 'BT-FNO', tags: ['tensor', 'operator'] });
        expect(doc.text).toBe('\n# BT-FNO\n');
    });
});

describe('projectDocs', () => {
    it('finds the documents that are there and no others', () => {
        const root = scratch();
        write(root, 'README.md', 'readme\n');
        write(root, 'code/README.md', 'deposit root\n');
        write(root, 'manuscript/main.tex', '\\documentclass{article}\n');

        expect(present(projectDocs(root))).toEqual([
            'README.md',
            'code/README.md',
            'manuscript/main.tex'
        ]);
    });
});
