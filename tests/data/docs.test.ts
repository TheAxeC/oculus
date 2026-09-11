// readDoc and projectDocs against synthetic files in a temporary directory. Nothing outside it is
// read or written, and every write asserts its path is inside the temporary directory first.

import { mkdirSync, mkdtempSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PROJECT_DOCS, isFinding, projectDocs, readDoc } from '../../src/lib/data/sources/docs.ts';
import type { DocPresence } from '../../src/lib/data/model.ts';

function scratch(): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-docs-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
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

        const doc = readDoc(file);
        expect(isFinding(doc)).toBe(false);
        if (isFinding(doc)) return;
        expect(doc.frontmatter).toEqual({ title: 'BT-FNO', tags: ['tensor', 'operator'] });
        expect(doc.text).toBe('\n# BT-FNO\n');
    });

    it('returns a document with no frontmatter whole', () => {
        const root = scratch();
        const body = ['# Loewner layers', '', 'Three dashes below are not a block.', '', '---', ''];
        const file = write(root, 'without.md', body.join('\n'));

        const doc = readDoc(file);
        expect(isFinding(doc)).toBe(false);
        if (isFinding(doc)) return;
        expect(doc.frontmatter).toBeNull();
        expect(doc.text).toBe(body.join('\n'));
    });

    it('reports a document that is not on disk', () => {
        const root = scratch();
        const file = join(root, 'gone.md');

        const doc = readDoc(file);
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

        const doc = readDoc(file);
        expect(isFinding(doc)).toBe(true);
        if (!isFinding(doc)) return;
        expect(doc.key).toBe('frontmatter');
        expect(doc.message).toMatch(/^does not parse: /);
    });

    it('reports a frontmatter block that is not a map', () => {
        const root = scratch();
        const file = write(
            root,
            'listy.md',
            ['---', '- one', '- two', '---', 'body', ''].join('\n')
        );

        expect(readDoc(file)).toEqual({
            file,
            key: 'frontmatter',
            message: 'is not a map of keys'
        });
    });

    it('splits an empty block and a block closed by three dots', () => {
        const root = scratch();
        const empty = write(root, 'empty.md', ['---', '---', 'body', ''].join('\n'));
        const dots = write(root, 'dots.md', ['---', 'title: Dots', '...', 'body', ''].join('\n'));

        const first = readDoc(empty);
        expect(isFinding(first)).toBe(false);
        if (isFinding(first)) return;
        expect(first.frontmatter).toEqual({});
        expect(first.text).toBe('body\n');

        const second = readDoc(dots);
        expect(isFinding(second)).toBe(false);
        if (isFinding(second)) return;
        expect(second.frontmatter).toEqual({ title: 'Dots' });
        expect(second.text).toBe('body\n');
    });

    it('leaves an unterminated opening block as body text', () => {
        const root = scratch();
        const body = ['---', 'title: never closed', 'body', ''].join('\n');
        const file = write(root, 'unclosed.md', body);

        const doc = readDoc(file);
        expect(isFinding(doc)).toBe(false);
        if (isFinding(doc)) return;
        expect(doc.frontmatter).toBeNull();
        expect(doc.text).toBe(body);
    });
});

describe('projectDocs', () => {
    it('reports every name in the fixed order, present or not', () => {
        const root = scratch();
        write(root, 'README.md', 'the one private doc\n');

        const docs = projectDocs(root);
        expect(docs.map((d) => d.name)).toEqual(PROJECT_DOCS);
        expect(docs[0]).toMatchObject({
            name: 'README.md',
            path: join(root, 'README.md'),
            present: true
        });
        expect(docs[1].present).toBe(false);
        expect(docs[1].path).toBe(join(root, 'PRESENT.md'));
    });

    it('finds the documents that are there and no others', () => {
        const root = scratch();
        write(root, 'README.md', 'readme\n');
        write(root, 'PRESENT.md', 'slides\n');
        write(root, 'code/README.md', 'deposit root\n');
        write(root, 'manuscript/main.tex', '\\documentclass{article}\n');

        expect(present(projectDocs(root))).toEqual([
            'README.md',
            'PRESENT.md',
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
        mkdirSync(join(root, 'RESULTS.md'), { recursive: true });

        expect(present(projectDocs(root))).toEqual([]);
    });

    it('reports every name as absent for a folder that does not exist', () => {
        const root = scratch();
        const docs = projectDocs(join(root, 'nowhere'));

        expect(docs.map((d) => d.name)).toEqual(PROJECT_DOCS);
        expect(present(docs)).toEqual([]);
    });

    it('carries the mtime of a document that is there and zero for one that is not', () => {
        const root = scratch();
        const file = write(root, 'README.md', 'readme\n');
        const written = statSync(file).mtimeMs;
        const docs = projectDocs(root);

        expect(docs.find((d) => d.name === 'README.md')?.mtime).toBe(written);
        expect(docs.find((d) => d.name === 'PRESENT.md')?.mtime).toBe(0);
    });

    it('reports the mtime a later write gave a document', () => {
        const root = scratch();
        const file = write(root, 'README.md', 'readme\n');
        const later = new Date('2030-01-02T03:04:05Z');
        utimesSync(file, later, later);

        expect(projectDocs(root).find((d) => d.name === 'README.md')?.mtime).toBe(later.getTime());
    });
});
