// The file browser in Chrome: the rail opens it, a root reads its first level from the server, and a
// file in that level opens as the tab its own bytes ask for.
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

import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { alphaOf } from './style.ts';
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
    writeFileSync(join(dir, 'tool.py'), 'print("before")\n');
    // A file whose name says text and whose bytes do not: the tree must read the bytes.
    writeFileSync(join(dir, 'data.txt'), Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01, 0x02]));
    return dir;
}

/** The alpha a locator's background is painted at. */
async function backgroundAlpha(target: ReturnType<Page['locator']>): Promise<number> {
    return alphaOf(await target.evaluate((el) => getComputedStyle(el).backgroundColor));
}

/** The one row of the tree a root or a path is drawn as. */
function row(page: Page, root: string, path = ''): ReturnType<Page['locator']> {
    return page.locator(`[data-fs-row="${root}:${path}"]`).getByRole('button').first();
}

test('the rail opens the file browser, a root expands, and a text file opens for editing', async ({
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

    // Every text file of the tree opens in the source tab, which is where it is read and written.
    await row(page, 'hub', 'README.md').click();
    await expect(page.getByRole('tab', { name: 'README.md' })).toBeVisible();
    await expect(page.locator('[data-source-editor="README.md"]')).toBeVisible();
    await expect(page.locator('[data-source-preview="README.md"]')).toBeVisible();

    // The open folders belong to the instance, so the tree comes back as it was left.
    await page.getByRole('tab', { name: t('views.files') }).click();
    await expect(row(page, 'hub', 'README.md')).toBeVisible();
});

test('a script opens for editing from the tree, and the save it makes lands on disk', async ({
    page
}) => {
    const dir = scratch();
    const key = dir.split(sep).at(-1) ?? '';

    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    await page.getByRole('textbox', { name: t('files.root_dir') }).fill(dir);
    await page.getByRole('button', { name: t('files.add'), exact: true }).click();
    await expect(row(page, key)).toBeVisible();
    await row(page, key).click();

    // No list of extensions says which files open: a .py is text because its bytes are.
    await row(page, key, 'tool.py').click();
    const editor = page.locator('[data-source-editor="tool.py"]');
    await expect(editor).toBeVisible();
    const area = editor.getByRole('textbox');
    await expect(area).toHaveValue('print("before")\n');
    await area.fill('print("after")\n');
    await page.getByRole('button', { name: t('editor.save'), exact: true }).click();
    await expect(page.getByText(t('source.saved'))).toBeVisible();
    expect(readFileSync(join(dir, 'tool.py'), 'utf8')).toBe('print("after")\n');

    // A .md from the same tree opens the same way, and the two are two tabs.
    await page.getByRole('tab', { name: t('views.files') }).click();
    await row(page, key, 'notes.md').click();
    await expect(page.locator('[data-source-editor="notes.md"]')).toBeVisible();

    // An archive somebody called a text file is a download, since its first bytes say so.
    await page.getByRole('tab', { name: t('views.files') }).click();
    await row(page, key, 'data.txt').click();
    await expect(page.getByRole('link', { name: t('file.download') })).toBeVisible();
    await expect(page.locator('[data-source-editor="data.txt"]')).toHaveCount(0);
});

test('a single click previews one file after another and a double click keeps the tab', async ({
    page
}) => {
    const dir = scratch();
    const key = dir.split(sep).at(-1) ?? '';

    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    await page.getByRole('textbox', { name: t('files.root_dir') }).fill(dir);
    await page.getByRole('button', { name: t('files.add'), exact: true }).click();
    await expect(row(page, key)).toBeVisible();
    await row(page, key).click();

    // One click is a preview tab, drawn in italics.
    await row(page, key, 'tool.py').click();
    const first = page.getByRole('tab', { name: 'tool.py' });
    await expect(first).toBeVisible();
    await expect(first).toHaveAttribute('data-tab-preview', '');
    expect(await first.locator('.label').evaluate((el) => getComputedStyle(el).fontStyle)).toBe(
        'italic'
    );

    // The tab holds the file it was opened on, which is what the editor in it shows.
    await expect(page.locator('[data-source-editor="tool.py"]').getByRole('textbox')).toHaveValue(
        'print("before")\n'
    );

    // The next single click is pointed at the same tab: one tab, the other file in it, and the
    // editor holding that other file's text rather than the one the tab was opened on.
    await page.getByRole('tab', { name: t('views.files') }).click();
    await row(page, key, 'notes.md').click();
    await expect(page.getByRole('tab', { name: 'tool.py' })).toHaveCount(0);
    const second = page.getByRole('tab', { name: 'notes.md' });
    await expect(second).toHaveAttribute('data-tab-preview', '');
    const editor = page.locator('[data-source-editor="notes.md"]');
    await expect(editor.getByRole('textbox')).toHaveValue('# notes\n');

    // A keystroke in it keeps the tab: a reader typing into a file is working in it.
    await editor.getByRole('textbox').fill('# notes typed in the spec\n');
    await expect(page.getByRole('tab', { name: 'notes.md' })).not.toHaveAttribute(
        'data-tab-preview',
        ''
    );
    await page.getByRole('button', { name: t('editor.revert'), exact: true }).click();

    // Asking for the same file a second time keeps its tab, which is what the two clicks of a double
    // click on the row are. The file browser is a tab of this pane, so the file it opens takes the
    // pane from it and the tree has to be brought back between the two clicks; where the tree is
    // drawn beside the file the two clicks land on the row as one double click.
    await page.getByRole('tab', { name: t('views.files') }).click();
    await row(page, key, 'tool.py').click();
    await expect(page.getByRole('tab', { name: 'tool.py' })).toHaveAttribute(
        'data-tab-preview',
        ''
    );
    await page.getByRole('tab', { name: t('views.files') }).click();
    await row(page, key, 'tool.py').click();
    await expect(page.getByRole('tab', { name: 'tool.py' })).not.toHaveAttribute(
        'data-tab-preview',
        ''
    );

    // The tab it kept stays, and the next file opens beside it rather than over it.
    await page.getByRole('tab', { name: t('views.files') }).click();
    await row(page, key, 'data.txt').click();
    await expect(page.getByRole('tab', { name: 'tool.py' })).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'notes.md' })).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'data.txt' })).toHaveAttribute(
        'data-tab-preview',
        ''
    );

    // A double click on the tab face keeps it as a double click on its row does.
    await page.getByRole('tab', { name: 'data.txt' }).dblclick();
    await expect(page.getByRole('tab', { name: 'data.txt' })).not.toHaveAttribute(
        'data-tab-preview',
        ''
    );
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
    await expect(page.locator('[data-source-editor="notes.md"]')).toBeVisible();

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

test("a file is bookmarked from its own tab, and the rail draws the reader's own bookmark", async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    await row(page, 'hub').click();
    await row(page, 'hub', 'README.md').click();

    // The star writes ~/.oculus/bookmarks.yml under this run's own HOME, creating the file.
    await page.getByRole('button', { name: t('file.bookmark'), exact: true }).click();
    await expect(
        page.getByRole('button', { name: t('file.unbookmark'), exact: true })
    ).toBeVisible();

    // The rail draws it after the configured documents, and it opens the file as its own tab. It
    // opens the file view, which hands a text file to the source tab and takes its own tab with it,
    // so a bookmark and the tree reach one file in one place. The identity is on the button itself,
    // which is what shell/ActivityRail.svelte hands ToolButton.
    const mark = page.locator('nav button[data-bookmark="hub/README.md"]');
    await expect(mark).toBeVisible();
    await page.getByRole('tab', { name: t('views.files') }).click();
    await expect(page.locator('[data-source-editor="README.md"]')).toBeHidden();
    await mark.click();
    await expect(page.locator('[data-source-editor="README.md"]')).toBeVisible();

    // The Files view lists it too, which is where it is renamed.
    await page.getByRole('tab', { name: t('views.files') }).click();
    await expect(page.locator('[data-fs-bookmark="README.md"]')).toBeVisible();

    // Taking it out again empties both.
    await page.getByRole('tab', { name: 'README.md' }).click();
    await page.getByRole('button', { name: t('file.unbookmark'), exact: true }).click();
    await expect(page.locator('nav button[data-bookmark="hub/README.md"]')).toHaveCount(0);
});

test('a note is opened from the toolbar, typed into, saved on its own, and deleted', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));

    await page.getByRole('button', { name: t('files.add_note'), exact: true }).click();
    const body = page.getByRole('textbox', { name: t('note.body_label') });
    await expect(body).toBeVisible();

    // Typing saves on its own: the first keystroke writes the file and the ones after it go behind
    // the wait config/behavior.yml names. What proves it is the file the server reads back.
    await page.getByRole('textbox', { name: t('note.title_label') }).fill('a browser note');
    await body.fill('the body of it\n');
    await expect
        .poll(
            async () =>
                page.evaluate(async () => {
                    const answer = await fetch('/api/fs?notes=1');
                    const held = (await answer.json()) as { notes: { title: string }[] };
                    return held.notes.map((one) => one.title).join('|');
                }),
            { timeout: 10_000 }
        )
        .toContain('a browser note');

    // The tab carries what was typed, so two open notes read as two names.
    await expect(page.getByRole('tab', { name: 'a browser note' })).toBeVisible();

    // The Files view lists it, and the confirm is what takes it away. The note's own tab is still
    // open, and the removal takes that with it rather than leaving a tab over a file that is gone.
    await page.getByRole('tab', { name: t('views.files') }).click();
    const listed = page.locator('[data-fs-note]').filter({ hasText: 'a browser note' });
    await expect(listed).toBeVisible();
    await listed.getByRole('button', { name: t('files.note_delete') }).click();
    await page
        .getByRole('button', { name: t('files.note_delete'), exact: true })
        .last()
        .click();
    await expect(page.locator('[data-fs-note]')).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'a browser note' })).toHaveCount(0);

    // The note's own tab was closed while a save could still have been waiting on it. It stays
    // deleted: nothing writes it back once the wait would have run.
    await expect
        .poll(
            async () =>
                page.evaluate(async () => {
                    const answer = await fetch('/api/fs?notes=1');
                    const held = (await answer.json()) as { notes: { title: string }[] };
                    return held.notes.length;
                }),
            { timeout: 5000, intervals: [400, 800, 1600] }
        )
        .toBe(0);
});

/** How many notes the server holds now. */
async function noteCount(page: Page): Promise<number> {
    return page.evaluate(async () => {
        const answer = await fetch('/api/fs?notes=1');
        const held = (await answer.json()) as { notes: unknown[] };
        return held.notes.length;
    });
}

test("a note's file is made by the first keystroke, and the tab stays until then", async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));

    // The control makes no file, so a tab left with nothing typed into it leaves nothing on the
    // disk. The tab is still open, and the reader is the one who closes it.
    await page.getByRole('button', { name: t('files.add_note'), exact: true }).click();
    const body = page.getByRole('textbox', { name: t('note.body_label') });
    await expect(body).toBeVisible();
    await page.getByRole('tab', { name: t('views.files') }).click();

    await expect(page.locator('[data-fs-note]')).toHaveCount(0);
    await expect(page.getByRole('tab', { name: t('views.note') })).toBeVisible();
    expect(await noteCount(page)).toBe(0);

    // One character is a note, and the file is there for it.
    await page.getByRole('tab', { name: t('views.note') }).click();
    await body.fill('a');
    await expect.poll(() => noteCount(page), { timeout: 10_000 }).toBe(1);
    await page.getByRole('tab', { name: t('views.files') }).click();
    await expect(page.locator('[data-fs-note]')).toHaveCount(1);
});

test('the file browser tints its box over a wallpaper and its form paints nothing', async ({
    page
}) => {
    await boot(page);
    await page.getByRole('button', { name: t('ui.theme') }).click();
    await page.getByRole('menuitem', { name: /mocha/ }).click();
    await expect(page.locator('.wallpaper')).toHaveCount(1);
    await openView(page, 'files', t('views.files'));

    // The view draws its tree and its lists straight into the box, so the box carries the surface.
    const box = page.locator('[data-pane][data-pane-view="files"] .pane').first();
    await expect.poll(() => backgroundAlpha(box)).toBeGreaterThan(0);
    expect(await backgroundAlpha(box)).toBeLessThan(1);

    // The form inside it paints nothing, so it is not a second translucent layer over the first.
    // Not an exact name: a terminal theme draws a control's word inside brackets.
    await page.getByRole('button', { name: t('files.add_bookmark') }).click();
    const form = page.locator('[data-form="add"]');
    await expect(form).toBeVisible();
    expect(await backgroundAlpha(form)).toBe(0);
});

test('the first bookmark is made from the form, and an HTML one is one tab from either place', async ({
    page
}) => {
    const dir = scratch();
    const key = dir.split(sep).at(-1) ?? '';

    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    await page.getByRole('textbox', { name: t('files.root_dir') }).fill(dir);
    await page.getByRole('button', { name: t('files.add'), exact: true }).click();
    await expect(row(page, key)).toBeVisible();

    // The page has no bookmarks file yet, and the form still draws the three controls the file it
    // will make carries, with a root already chosen.
    await page.getByRole('button', { name: t('files.add_bookmark'), exact: true }).click();
    const form = page.locator('[data-form="add"]');
    await expect(form).toBeVisible();
    await expect(form.getByRole('combobox', { name: 'Root' })).toHaveValue(/.+/);
    await form.getByRole('textbox', { name: 'Label' }).fill('the spec page');
    await form.getByRole('combobox', { name: 'Root' }).selectOption(key);
    await form.getByRole('textbox', { name: 'Path' }).fill('page.html');
    await form.getByRole('button', { name: t('collection.form_save') }).click();

    // The rail draws it and the Files view lists it, both off the file the save made.
    await expect(page.locator(`nav button[data-bookmark="${key}/page.html"]`)).toBeVisible();
    await expect(page.locator('[data-fs-bookmark="the spec page"]')).toBeVisible();

    // The tree opens the page as a document, and the rail's bookmark on the same file activates that
    // tab rather than opening a second one. What it is called then is the bookmark's own label, which
    // is the state the activation carries.
    await row(page, key).click();
    await row(page, key, 'page.html').click();
    const frame = page.locator(`iframe[src="/api/file/${key}/page.html"]`);
    await expect(frame).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'page.html' })).toBeVisible();

    await page.getByRole('tab', { name: t('views.files') }).click();
    await page.locator(`nav button[data-bookmark="${key}/page.html"]`).click();
    await expect(frame).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'the spec page' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'page.html' })).toHaveCount(0);
});
