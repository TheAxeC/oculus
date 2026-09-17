// The file browser's shared fixtures for the browser specs: a scratch root under the system temporary
// directory holding one file of each kind the tree opens differently, the row of the tree a root or a
// path is drawn as, and the same root added through the page's own control.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { expect, type Page } from '@playwright/test';
import { t } from './words.ts';

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

/** A folder of the calling spec's own, under the system temporary directory and asserted to be inside it. */
export function scratch(): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-files-spec-'));
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
