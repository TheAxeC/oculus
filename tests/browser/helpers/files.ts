// The file browser's shared fixtures for the browser specs: a scratch root under the system
// temporary directory holding one file of each kind the tree opens differently, the row of the tree
// a root or a path is drawn as, and the same root added through the page's own control.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { servedHomeDir } from './hub.ts';
import { t } from './words.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

/**
 * The served run's own files a case writes through the file browser: the bookmarks the stars and
 * the bookmark form save, the workspaces file the roots it adds are kept in, and the notes the
 * Notes section writes one file each under `.oculus/notes`. A spec that writes any of them, or
 * takes a scratch root from here, calls this once at its top. Each is put back after every case as
 * it was before the case, passed or failed, so a case that stops halfway leaves no bookmark, root
 * or note for the cases after it to start from, and the scratch roots are swept when the spec is
 * done.
 *
 * The hooks are registered by the call and not by this module's first load: a worker loads a
 * module once for every spec it runs, so a hook registered at the module's top would be the first
 * spec's alone, and a later spec whose case failed would leave its roots behind when its worker is
 * replaced.
 */
export function keepServedFiles(): void {
    test.afterAll(sweepScratch);
    const before = new Map<string, string | null>();
    const notes = (): string => join(servedHomeDir(), '.oculus', 'notes');
    const noteFiles = (): string[] =>
        existsSync(notes()) ? readdirSync(notes()).map((name) => join(notes(), name)) : [];
    test.beforeEach(() => {
        before.clear();
        const held = ['.oculus/bookmarks.yml', '.oculus/workspaces.json'].map((name) =>
            join(servedHomeDir(), name)
        );
        for (const path of [...held, ...noteFiles()]) {
            before.set(path, existsSync(path) ? readFileSync(path, 'utf8') : null);
        }
    });
    test.afterEach(() => {
        for (const path of noteFiles()) if (!before.has(path)) rmSync(path, { force: true });
        for (const [path, held] of before) {
            if (held === null) rmSync(path, { force: true });
            else {
                mkdirSync(dirname(path), { recursive: true });
                writeFileSync(path, held);
            }
        }
    });
}

/** The smallest PDF with a drawable page, so the type and not the size is what is exercised. */
const PDF = [
    '%PDF-1.4',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Contents 4 0 R>>endobj',
    '4 0 obj<</Length 0>>stream',
    'endstream',
    'endobj',
    'trailer<</Root 1 0 R>>',
    ''
].join('\n');

/**
 * A folder of the calling spec's own, under the system temporary directory and asserted to be
 * inside it.
 */
export function scratch(): string {
    const dir = scratchDir('oculus-files-spec-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    writeFileSync(join(dir, 'page.html'), '<!doctype html><title>a page</title><h1>A page</h1>\n');
    writeFileSync(join(dir, 'paper.pdf'), PDF);
    writeFileSync(join(dir, 'notes.md'), '# notes\n');
    writeFileSync(join(dir, 'tool.py'), 'print("before")\n');
    // A file whose name says text and whose bytes do not: the tree must read the bytes.
    writeFileSync(join(dir, 'data.txt'), Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01, 0x02]));
    return dir;
}

/** The one row of the tree a root or a path is drawn as. */
export function row(page: Page, root: string, path = ''): ReturnType<Page['locator']> {
    return page.locator(`[data-fs-row="${root}:${path}"]`).getByRole('button').first();
}

/** A scratch root with one folder in it, added through the page, and the key the tree gives it. */
export async function nestedRoot(page: Page): Promise<{ dir: string; key: string }> {
    const dir = scratch();
    mkdirSync(join(dir, 'sub'));
    writeFileSync(join(dir, 'sub', 'inner.txt'), 'inside\n');
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    await page.getByRole('textbox', { name: t('files.root_dir') }).fill(dir);
    await page.getByRole('button', { name: t('files.add'), exact: true }).click();
    const key = dir.split(sep).at(-1) ?? '';
    await expect(row(page, key)).toBeVisible();
    return { dir, key };
}
