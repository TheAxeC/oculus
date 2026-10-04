// Layer 1, data tests. readDoc and projectDocs against synthetic files in a temporary directory.
// Nothing outside it is read or written, and every write asserts its path is inside the temporary
// directory first.

import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import {
    PROJECT_DOCS,
    isFinding,
    projectDocs,
    readDoc
} from '../../../src/lib/data/sources/docs.ts';
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

    it('returns a document with no frontmatter whole', () => {
        const root = scratch();
        const body = ['# Loewner layers', '', 'Three dashes below are not a block.', '', '---', ''];
        const file = write(root, 'without.md', body.join('\n'));

        const doc = readDoc(file, CATALOG);
        expect(isFinding(doc)).toBe(false);
        if (isFinding(doc)) return;
        expect(doc.frontmatter).toBeNull();
        expect(doc.text).toBe(body.join('\n'));
    });

    it('reports a document that is not on disk', () => {
        const root = scratch();
        const file = join(root, 'gone.md');

        const doc = readDoc(file, CATALOG);
        expect(isFinding(doc)).toBe(true);
        expect(doc).toEqual({ file, key: '', message: 'document does not exist' });
    });

    it('reports a frontmatter block that does not parse', () => {
        const root = scratch();
        const file = write(
            root,
            'broken.md',
            ['---', 'title: "unterminated', '---', 'body'].join('\n')
        );

        const doc = readDoc(file, CATALOG);
        expect(isFinding(doc)).toBe(true);
        if (!isFinding(doc)) return;
        expect(doc.key).toBe('frontmatter');
        expect(doc.message).toMatch(/^does not parse: /);
    });

    it('splits an empty block and a block closed by three dots', () => {
        const root = scratch();
        const empty = write(root, 'empty.md', ['---', '---', 'body', ''].join('\n'));
        const dots = write(root, 'dots.md', ['---', 'title: Dots', '...', 'body', ''].join('\n'));

        const first = readDoc(empty, CATALOG);
        expect(isFinding(first)).toBe(false);
        if (isFinding(first)) return;
        expect(first.frontmatter).toEqual({});
        expect(first.text).toBe('body\n');

        const second = readDoc(dots, CATALOG);
        expect(isFinding(second)).toBe(false);
        if (isFinding(second)) return;
        expect(second.frontmatter).toEqual({ title: 'Dots' });
        expect(second.text).toBe('body\n');
    });

    it('leaves an unterminated opening block as body text', () => {
        const root = scratch();
        const body = ['---', 'title: never closed', 'body', ''].join('\n');
        const file = write(root, 'unclosed.md', body);

        const doc = readDoc(file, CATALOG);
        expect(isFinding(doc)).toBe(false);
        if (isFinding(doc)) return;
        expect(doc.frontmatter).toBeNull();
        expect(doc.text).toBe(body);
    });
});

describe('projectDocs', () => {
    it('gives each document its path, present or not', () => {
        const root = scratch();
        write(root, 'README.md', 'the one private doc\n');

        const docs = projectDocs(root);
        expect(docs[0]).toMatchObject({
            name: 'README.md',
            path: join(root, 'README.md'),
            present: true
        });
        expect(docs[1].present).toBe(false);
        expect(docs[1].path).toBe(join(root, 'code', 'README.md'));
    });

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

    it('never looks under attic', () => {
        const root = scratch();
        write(root, 'attic/README.md', 'an old copy\n');
        write(root, 'attic/manuscript/main.pdf', 'an old pdf\n');

        expect(present(projectDocs(root))).toEqual([]);
    });

    it('counts a directory named like a document as absent', () => {
        const root = scratch();
        mkdirSync(join(root, 'README.md'), { recursive: true });

        expect(present(projectDocs(root))).toEqual([]);
    });

    it('reports every name as absent for a folder that does not exist', () => {
        const root = scratch();
        const docs = projectDocs(join(root, 'nowhere'));

        expect(docs.map((d) => d.name)).toEqual(PROJECT_DOCS.map((doc) => doc.name));
        expect(present(docs)).toEqual([]);
    });

    it('carries the mtime of a document that is there and zero for one that is not', () => {
        const root = scratch();
        const file = write(root, 'README.md', 'readme\n');
        const written = statSync(file).mtimeMs;
        const docs = projectDocs(root);

        expect(docs.find((d) => d.name === 'README.md')?.mtime).toBe(written);
        expect(docs.find((d) => d.name === 'code/README.md')?.mtime).toBe(0);
    });
});

describe('readDoc over a frontmatter block of the wrong shape', () => {
    /** What readDoc answers for a document opening with a block holding `block`. */
    function readBlock(block: string) {
        const root = scratch();
        const file = write(root, 'doc.md', `---\n${block}---\nbody\n`);
        return { file, read: readDoc(file, CATALOG) };
    }

    it.each([['[]\n'], ['- one\n- two\n'], ['3\n'], ['x\n']])(
        'reads a block holding %j as one finding',
        (block) => {
            const { file, read } = readBlock(block);
            expect(read).toStrictEqual({
                file,
                key: 'frontmatter',
                message: 'is not a map of keys'
            });
        }
    );
});
