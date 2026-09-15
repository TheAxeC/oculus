// The file browser in Chrome: the rail opens it, a root reads its first level from the server, and a
// file in that level opens as the tab its own name asks for.
//
// This is the one check that the fetches actually reach the server, which no server rendering runs:
// the workspaces, one directory listing, the file's own bytes, and the add-root write. The hub is the
// run's copy of demo/, and the second root is a folder this spec makes under the system temporary
// directory and adds through the page's own control.
//
// What this does NOT cover: a PDF drawn. Playwright's Chrome aborts its own PDF viewer extension
// (net::ERR_ABORTED on chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/index.html), so the
// frame ends on Chrome's error page here whatever oculus does; the case below asserts the frame's
// address, that it carries no sandbox (the installed Chrome refuses its viewer inside a sandboxed
// frame with net::ERR_BLOCKED_BY_CLIENT and draws the file without one) and that the server answers
// it, which is everything up to the viewer.

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { boot, openView } from './rail.ts';
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

/** A folder of the spec's own, under the system temporary directory and asserted to be inside it. */
function scratch(): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-files-spec-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    writeFileSync(join(dir, 'page.html'), '<!doctype html><title>a page</title><h1>A page</h1>\n');
    writeFileSync(join(dir, 'paper.pdf'), PDF);
    writeFileSync(join(dir, 'notes.md'), '# notes\n');
    return dir;
}

/** The one row of the tree a root or a path is drawn as. */
function row(page: Page, root: string, path = ''): ReturnType<Page['locator']> {
    return page.locator(`[data-fs-row="${root}:${path}"]`).getByRole('button').first();
}

test('the rail opens the file browser, a root expands, and a text file opens as a tab', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));

    const hub = row(page, 'hub');
    await expect(hub).toBeVisible();
    await expect(page.locator('[data-fs-row="hub:README.md"]')).toHaveCount(0);

    await hub.click();
    await expect(row(page, 'hub', 'README.md')).toBeVisible();
    await expect(page.locator('[data-fs-row="hub:projects"]')).toBeVisible();

    await row(page, 'hub', 'README.md').click();
    await expect(page.getByRole('tab', { name: 'README.md' })).toBeVisible();
    const code = page.locator('[data-fs-code="README.md"]');
    await expect(code).toBeVisible();
    await expect(code).toHaveAttribute('data-language', 'markdown');
    await expect(code.locator('.gutter')).toContainText('1');

    // The open folders belong to the instance, so the tree comes back as it was left.
    await page.getByRole('tab', { name: t('views.files') }).click();
    await expect(row(page, 'hub', 'README.md')).toBeVisible();
});

test('a root added in the page serves its own files, each in the view its name asks for', async ({
    page
}) => {
    const dir = scratch();
    const key = dir.split(sep).at(-1) ?? '';

    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    await page.getByRole('textbox', { name: t('files.root_dir') }).fill(dir);
    await page.getByRole('button', { name: t('files.add'), exact: true }).click();

    // The write lands, the roots are read again, and the tree holds the folder that was typed in.
    await expect(row(page, key)).toBeVisible();
    await row(page, key).click();
    await expect(row(page, key, 'notes.md')).toBeVisible();

    // An HTML file is a document of its own, with its assets resolving against its own address.
    await row(page, key, 'page.html').click();
    await expect(page.getByRole('tab', { name: 'page.html' })).toBeVisible();
    await expect(page.locator(`iframe[src="/api/file/${key}/page.html"]`)).toBeVisible();

    await page.getByRole('tab', { name: t('views.files') }).click();
    await row(page, key, 'notes.md').click();
    await expect(page.locator('[data-fs-code="notes.md"]')).toHaveAttribute(
        'data-language',
        'markdown'
    );

    // The PDF: the frame addresses the file route, and the route answers the page's own request with
    // the bytes and the type. What the browser's viewer then does with them is the browser's.
    await page.getByRole('tab', { name: t('views.files') }).click();
    await row(page, key, 'paper.pdf').click();
    const frame = page.locator(`iframe[src="/api/file/${key}/paper.pdf"]`);
    await expect(frame).toBeVisible();
    await expect(frame).not.toHaveAttribute('sandbox');
    const served = await page.evaluate(async (address) => {
        const answer = await fetch(address);
        return { status: answer.status, type: answer.headers.get('content-type') };
    }, `/api/file/${key}/paper.pdf`);
    expect(served).toEqual({ status: 200, type: 'application/pdf' });

    // The root the spec added is the reader's own, so the tree offers its removal.
    await page.getByRole('tab', { name: t('views.files') }).click();
    await expect(
        page
            .locator(`[data-fs-row="${key}:"]`)
            .getByRole('button', { name: t('files.remove_root') })
    ).toBeVisible();
    await expect(
        page.locator('[data-fs-row="hub:"]').getByRole('button', { name: t('files.remove_root') })
    ).toHaveCount(0);
});
