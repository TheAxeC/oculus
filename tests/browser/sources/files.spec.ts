// The file browser in Chrome: the rail opens it, a root reads its first level from the server, a
// file in that level opens as the tab its own bytes ask for, and the explorer answers the arrow
// keys, the filter, the breadcrumb, a row's hover and a section's head.
//
// This is the one check that the fetches actually reach the server, which no server rendering runs:
// the workspaces, one directory listing, the file's own bytes, and the add-root write. The hub is
// the run's copy of demo/, and the second root is a folder this spec makes under the system
// temporary directory, through scratch() of tests/browser/helpers/files.ts, and adds through the
// page's own control.
//
// What this does NOT cover: a PDF drawn. Playwright's Chrome aborts its own PDF viewer extension
// (net::ERR_ABORTED on chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/index.html), so the
// frame ends on Chrome's error page here whatever oculus does; the case below asserts the frame's
// address, that it carries no sandbox (the installed Chrome refuses its viewer inside a sandboxed
// frame with net::ERR_BLOCKED_BY_CLIENT and draws the file without one) and that the server answers
// it, which is everything up to the viewer.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { keepServedFiles, nestedRoot, row, scratch } from '../helpers/files.ts';
import { boot, openView } from '../helpers/rail.ts';
import { alphaOf } from '../helpers/style.ts';
import { t } from '../helpers/words.ts';

keepServedFiles();

/** The alpha a locator's background is painted at. */
async function backgroundAlpha(target: ReturnType<Page['locator']>): Promise<number> {
    return alphaOf(await target.evaluate((el) => getComputedStyle(el).backgroundColor));
}

test('the rail opens the file browser, a root expands, and a text file opens for editing', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));

    const hub = row(page, 'hub');
    await expect(hub).toBeVisible();
    // the root is drawn closed, so nothing under it is in the tree until it is expanded
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
    // the first bytes say the file is an archive, so it is offered as a download and no editor
    // opens on it
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
    // a single click reuses the preview tab, so the file it held before is no longer a tab of its
    // own
    await expect(page.getByRole('tab', { name: 'tool.py' })).toHaveCount(0);
    const second = page.getByRole('tab', { name: 'notes.md' });
    await expect(second).toHaveAttribute('data-tab-preview', '');
    const editor = page.locator('[data-source-editor="notes.md"]');
    await expect(editor.getByRole('textbox')).toHaveValue('# notes\n');

    // A keystroke in it keeps the tab: a reader typing into a file is working in it.
    await editor.getByRole('textbox').fill('# notes typed in the spec\n');
    // a keystroke makes the tab the reader's own, so the preview mark comes off it
    await expect(page.getByRole('tab', { name: 'notes.md' })).not.toHaveAttribute(
        'data-tab-preview',
        ''
    );
    await page.getByRole('button', { name: t('editor.revert'), exact: true }).click();

    // Asking for the same file a second time keeps its tab, which is what the two clicks of a
    // double click on the row are. The file browser is a tab of this pane, so the file it opens
    // takes the pane from it and the tree has to be brought back between the two clicks; where the
    // tree is drawn beside the file the two clicks land on the row as one double click.
    await page.getByRole('tab', { name: t('views.files') }).click();
    await row(page, key, 'tool.py').click();
    await expect(page.getByRole('tab', { name: 'tool.py' })).toHaveAttribute(
        'data-tab-preview',
        ''
    );
    await page.getByRole('tab', { name: t('views.files') }).click();
    await row(page, key, 'tool.py').click();
    // the second click on the same row keeps the tab, which is what takes the preview mark off
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
    // a double click on the tab face keeps it, as a double click on its row does
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

    // The PDF: the frame addresses the file route, and the route answers the page's own request
    // with the bytes and the type. What the browser's viewer then does with them is the browser's.
    await page.getByRole('tab', { name: t('views.files') }).click();
    await row(page, key, 'paper.pdf').click();
    const frame = page.locator(`iframe[src="/api/file/${key}/paper.pdf"]`);
    await expect(frame).toBeVisible();
    // the bytes come from the page's own origin through the file route, and a sandbox would stop
    // the browser's own PDF viewer
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
        // the hub root is the configured one, not a root the reader added, so it offers no removal
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
    // which is what shell/rail/ActivityRail.svelte hands ToolButton.
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
    // the second press took the bookmark away, so the rail draws none for that file
    await expect(page.locator('nav button[data-bookmark="hub/README.md"]')).toHaveCount(0);
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

    // The tree opens the page as a document, and the rail's bookmark on the same file activates
    // that tab rather than opening a second one. What it is called then is the bookmark's own
    // label, which is the state the activation carries.
    await row(page, key).click();
    await row(page, key, 'page.html').click();
    const frame = page.locator(`iframe[src="/api/file/${key}/page.html"]`);
    await expect(frame).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'page.html' })).toBeVisible();

    await page.getByRole('tab', { name: t('views.files') }).click();
    await page.locator(`nav button[data-bookmark="${key}/page.html"]`).click();
    await expect(frame).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'the spec page' })).toBeVisible();
    // the bookmark opens the same file in the same tab, which now carries the bookmark's own label
    await expect(page.getByRole('tab', { name: 'page.html' })).toHaveCount(0);
});

/** The treeitem one row of the tree is, which carries its state and takes the keyboard's focus. */
function item(page: Page, root: string, path = ''): ReturnType<Page['locator']> {
    return page.locator(`[data-fs-row="${root}:${path}"] [role="treeitem"]`);
}

/** Open a root and its one folder, waiting for each listing, with the folder left selected. */
async function openNested(page: Page, key: string): Promise<void> {
    await row(page, key).click();
    await expect(item(page, key, 'sub')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(item(page, key, 'sub')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(item(page, key, 'sub/inner.txt')).toBeVisible();
}

// Revert: return null from rowMove in ui/tree/tree-keys.ts for every key.
test('the arrow keys move the selection, open and close a folder, and carry the focus', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);

    // A press on the head opens the root and selects it.
    await row(page, key).click();
    await expect(item(page, key)).toHaveAttribute('aria-selected', 'true');
    await expect(item(page, key, 'sub')).toBeVisible();

    // Down selects the first entry, which is the folder, and the focus goes with it.
    await page.keyboard.press('ArrowDown');
    await expect(item(page, key, 'sub')).toHaveAttribute('aria-selected', 'true');
    await expect(item(page, key, 'sub')).toBeFocused();
    await expect(item(page, key, 'sub')).toHaveAttribute('aria-expanded', 'false');

    // Right opens it, and Right again steps into it.
    await page.keyboard.press('ArrowRight');
    await expect(item(page, key, 'sub')).toHaveAttribute('aria-expanded', 'true');
    await expect(item(page, key, 'sub/inner.txt')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(item(page, key, 'sub/inner.txt')).toHaveAttribute('aria-selected', 'true');
    await expect(item(page, key, 'sub/inner.txt')).toBeFocused();

    // A focus moved by a key opens no tooltip, so the row the next key goes to stays readable.
    await page.mouse.move(0, 0);
    // the focus was moved by a key, and a tooltip opens under the pointer
    await expect(page.locator('[role="tooltip"]:not([hidden])')).toHaveCount(0);

    // Left steps out to the folder, Left again closes it, and Up goes back to the head.
    await page.keyboard.press('ArrowLeft');
    await expect(item(page, key, 'sub')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(item(page, key, 'sub')).toHaveAttribute('aria-expanded', 'false');
    // the folder is closed again, so the entries under it are not drawn
    await expect(page.locator(`[data-fs-row="${key}:sub/inner.txt"]`)).toHaveCount(0);
    await page.keyboard.press('ArrowUp');
    await expect(item(page, key)).toHaveAttribute('aria-selected', 'true');
    await expect(item(page, key)).toBeFocused();

    // End goes to the last row of the tree, and Home back to the first.
    const tree = page.getByRole('tree', { name: t('files.tree') });
    await page.keyboard.press('End');
    await expect(tree.getByRole('treeitem').last()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Home');
    await expect(tree.getByRole('treeitem').first()).toHaveAttribute('aria-selected', 'true');
});

// Revert: pass `rows` rather than `shown` to Tree in views/sources/files/Files.svelte.
test('the filter narrows the rows to the names holding its text, their folders kept open', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    await row(page, key).click();
    await row(page, key, 'sub').click();
    await expect(row(page, key, 'sub/inner.txt')).toBeVisible();
    // The folder is closed again: its entries were read, so the filter still looks through them.
    await row(page, key, 'sub').click();
    // the folder is closed again, so the entries under it are not drawn
    await expect(page.locator(`[data-fs-row="${key}:sub/inner.txt"]`)).toHaveCount(0);

    const filter = page.getByRole('searchbox', { name: t('files.filter') });
    await filter.fill('inner');
    await expect(row(page, key, 'sub/inner.txt')).toBeVisible();
    await expect(item(page, key, 'sub')).toHaveAttribute('aria-expanded', 'true');
    // the filter holds the rows whose name carries its text, and this one does not
    await expect(page.locator(`[data-fs-row="${key}:tool.py"]`)).toHaveCount(0);
    // the filter holds the rows whose name carries its text, and this one does not
    await expect(page.locator(`[data-fs-row="${key}:notes.md"]`)).toHaveCount(0);

    // A text no name holds leaves the heads and says so.
    await filter.fill('no name holds this');
    await expect(page.getByText(t('files.filter_none'))).toBeVisible();

    // Escape clears it and the tree is the tree again.
    await filter.press('Escape');
    await expect(row(page, key, 'tool.py')).toBeVisible();
    await expect(filter).toHaveValue('');
});

/**
 * Read the one folder, close it again, and type a filter, with the keyboard's focus on that folder.
 * `inner` holds the folder open over its file; `sub` draws the folder alone, closed.
 */
async function filteredOnFolder(page: Page, key: string, text: string): Promise<void> {
    await openNested(page, key);
    await page.keyboard.press('ArrowLeft');
    await expect(item(page, key, 'sub')).toHaveAttribute('aria-expanded', 'false');
    await page.getByRole('searchbox', { name: t('files.filter') }).fill(text);
    await expect(item(page, key, 'sub')).toHaveAttribute(
        'aria-expanded',
        text === 'inner' ? 'true' : 'false'
    );
    await item(page, key, 'sub').focus();
}

/** Clear the filter and see the folder closed, as it was before the filter was typed. */
async function clearedClosed(page: Page, key: string): Promise<void> {
    await page.getByRole('searchbox', { name: t('files.filter') }).fill('');
    await expect(item(page, key, 'sub')).toHaveAttribute('aria-expanded', 'false');
    // the filter is cleared and the folder is closed again, so its entries are gone with it
    await expect(page.locator(`[data-fs-row="${key}:sub/inner.txt"]`)).toHaveCount(0);
}

// Revert: pass `fixed: false` whatever `filtering` says, in state/sources/fs.ts's treeKeyRows.
test('Left on a folder the filter holds open steps out to its parent and closes nothing', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    await filteredOnFolder(page, key, 'inner');

    await page.keyboard.press('ArrowLeft');
    await expect(item(page, key)).toBeFocused();
    await expect(item(page, key, 'sub')).toHaveAttribute('aria-expanded', 'true');
    await clearedClosed(page, key);
});

// Revert: pass `fixed: false` in treeKeyRows and drop the `if (filtering) return;` line of toggle()
// in views/sources/files/Files.svelte; either one alone still keeps the folder closed.
test('Right under a filter steps into a folder it holds open and opens no folder for good', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    await filteredOnFolder(page, key, 'inner');
    await page.keyboard.press('ArrowRight');
    await expect(item(page, key, 'sub/inner.txt')).toBeFocused();

    // A folder the filter draws closed, since its name matches and nothing under it does.
    await page.getByRole('searchbox', { name: t('files.filter') }).fill('sub');
    await expect(item(page, key, 'sub')).toHaveAttribute('aria-expanded', 'false');
    await item(page, key, 'sub').focus();
    await page.keyboard.press('ArrowRight');
    await expect(item(page, key, 'sub')).toHaveAttribute('aria-expanded', 'false');
    await clearedClosed(page, key);
});

// Revert: drop the `if (filtering) return;` line of toggle() in views/sources/files/Files.svelte.
test('Enter on a folder under a filter selects it and writes nothing into the tree', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    await filteredOnFolder(page, key, 'sub');

    await page.keyboard.press('Enter');
    await expect(item(page, key, 'sub')).toHaveAttribute('aria-selected', 'true');
    await expect(item(page, key, 'sub')).toHaveAttribute('aria-expanded', 'false');
    await clearedClosed(page, key);
});

// Revert: make the Breadcrumb's onselect in views/sources/files/Files.svelte select the crumb's
// root line.
test('a breadcrumb segment selects the folder it names, and the path follows the selection', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    await openNested(page, key);
    await page.keyboard.press('ArrowRight');
    await expect(item(page, key, 'sub/inner.txt')).toHaveAttribute('aria-selected', 'true');

    const crumbs = page.getByRole('navigation', { name: t('files.breadcrumb') });
    await expect(crumbs.getByRole('button')).toHaveText([key, 'sub', 'inner.txt']);

    await crumbs.getByRole('button', { name: 'sub', exact: true }).click();
    await expect(item(page, key, 'sub')).toHaveAttribute('aria-selected', 'true');
    await expect(crumbs.getByRole('button')).toHaveText([key, 'sub']);
});

// Revert: make every row's tabindex 0 in ui/tree/TreeView.svelte's nav.
test('the tree is one stop from the filter box, and the focused row hands Tab to its controls', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    await openNested(page, key);
    await page.keyboard.press('ArrowRight');
    await expect(item(page, key, 'sub/inner.txt')).toHaveAttribute('aria-selected', 'true');

    /** What holds the focus: a row's treeitem by its key, or a control by its name. */
    const focused = (): Promise<string> =>
        page.evaluate(() => {
            const at = document.activeElement;
            if (!(at instanceof HTMLElement)) return '';
            if (at.getAttribute('role') === 'treeitem') {
                return `row ${at.closest('[data-fs-row]')?.getAttribute('data-fs-row') ?? at.getAttribute('aria-label') ?? ''}`;
            }
            return `${at.tagName.toLowerCase()} ${at.getAttribute('aria-label') ?? at.textContent.trim()}`;
        });

    await page.getByRole('searchbox', { name: t('files.filter') }).focus();
    const seen: string[] = [];
    for (let at = 0; at < 9; at += 1) {
        await page.keyboard.press('Tab');
        seen.push(await focused());
    }
    expect(seen).toEqual([
        `button ${key}`,
        'button sub',
        'button inner.txt',
        `row ${key}:sub/inner.txt`,
        `button ${t('files.row_bookmark')}`,
        `button ${t('files.row_open_tab')}`,
        'row ' + t('files.bookmarks'),
        `button ${t('files.add_bookmark')}`,
        'row ' + t('files.notes')
    ]);
});

// Revert: drop the `.item:hover .actions` rule from ui/tree/TreeItem.svelte.
test("a row's controls appear on hover, and bookmark the file and open it in a kept tab", async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    await row(page, key).click();
    await page.getByRole('searchbox', { name: t('files.filter') }).focus();

    const line = page.locator(`[data-fs-row="${key}:tool.py"]`);
    const controls = line.locator('.actions');
    await page.mouse.move(0, 0);
    await expect.poll(() => controls.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
    await line.hover();
    await expect.poll(() => controls.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');

    // The star writes a bookmark the rail draws, and a second press takes it away.
    await line.getByRole('button', { name: t('files.row_bookmark'), exact: true }).click();
    const mark = page.locator(`nav button[data-bookmark="${key}/tool.py"]`);
    await expect(mark).toBeVisible();
    await line.hover();
    await line.getByRole('button', { name: t('files.row_bookmark'), exact: true }).click();
    // the second press took the bookmark away
    await expect(mark).toHaveCount(0);

    // The other control opens the file in a tab that stays rather than in the preview.
    await line.hover();
    await line.getByRole('button', { name: t('files.row_open_tab'), exact: true }).click();
    const tab = page.getByRole('tab', { name: 'tool.py' });
    await expect(tab).toBeVisible();
    // the row's own control opens a tab that stays, so it carries no preview mark
    await expect(tab).not.toHaveAttribute('data-tab-preview', '');
});

// Revert: in ui/tree/TreeItem.svelte, leave the tooltip describing the button, which a tree never
// focuses.
// revert: src/lib/ui/tree/TreeItem.svelte:215-220 => <Tooltip text={title ?? ''} block>
test("a tree row gives a screen reader its tooltip's words as its description", async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    await row(page, key).click();
    const line = page.locator(`[data-fs-row="${key}:tool.py"]`);
    await line.hover();
    await line.getByRole('button', { name: t('files.row_bookmark'), exact: true }).click();
    const mark = page.locator('[data-fs-bookmark="tool.py"] [role="treeitem"]');
    await expect(mark).toHaveAccessibleDescription(
        t('files.bookmark_open_title', `${key}/tool.py`)
    );
});

// Revert: in ui/tree/TreeItem.svelte, drop the rule that draws a row's controls on a screen whose
// pointer does not hover.
// revert: src/lib/ui/tree/TreeItem.svelte:440 => opacity: 0;
test("a row's controls are drawn on a screen that has no hover, with no pointer over them", async ({
    browser
}) => {
    const context = await browser.newContext({ hasTouch: true, isMobile: true });
    const page = await context.newPage();
    try {
        await boot(page);
        await openView(page, 'files', t('views.files'));
        const { key } = await nestedRoot(page);
        await row(page, key).click();
        const controls = page.locator(`[data-fs-row="${key}:tool.py"] .actions`);
        expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
        await expect.poll(() => controls.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    } finally {
        await context.close();
    }
});

// Revert: draw `.guide` with `border-left-color: var(--line)` whatever the tree's state is.
test('the indent guides are drawn while the tree is hovered and not while it is left alone', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    await openNested(page, key);
    await page.getByRole('searchbox', { name: t('files.filter') }).focus();
    await page.mouse.move(0, 0);

    const guide = page.locator(`[data-fs-row="${key}:sub/inner.txt"] .guide`).first();
    const alpha = (): Promise<number> =>
        guide.evaluate((el) => getComputedStyle(el).borderLeftColor).then(alphaOf);
    await expect.poll(alpha).toBe(0);
    await item(page, key, 'sub/inner.txt').hover();
    await expect.poll(alpha).toBeGreaterThan(0);
});

// Revert: set `--tree-row` in themes/tokens.css to 24px, draw `.item.selected` in the accent's text
// colour, or leave the row's height or indent unscaled by --text-scale.
test('a row is 22 pixels at 13-pixel names under 11-pixel heads, a selected row reads on its tint, and the row grows with the text size', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    await openNested(page, key);

    const measure = (target: ReturnType<Page['locator']>) =>
        target.evaluate((el) => {
            const name = el.querySelector('.name');
            return {
                height: el.getBoundingClientRect().height,
                size: name === null ? '' : getComputedStyle(name).fontSize,
                colour: name === null ? '' : getComputedStyle(name).color,
                onTint: getComputedStyle(el).getPropertyValue('--on-accent-bg').trim(),
                outline: getComputedStyle(el).outlineStyle
            };
        });
    const selected = await measure(item(page, key, 'sub'));
    const plain = await measure(item(page, key, 'sub/inner.txt'));
    const head = await measure(item(page, key));

    expect(selected.height).toBe(22);
    expect(plain.size).toBe('13px');
    expect(head.size).toBe('11px');
    // The selected row's name is drawn in the colour the theme derives for text on the tint.
    const probe = await item(page, key, 'sub').evaluate((el, value) => {
        const swatch = document.createElement('span');
        swatch.style.color = value;
        el.appendChild(swatch);
        const colour = getComputedStyle(swatch).color;
        swatch.remove();
        return colour;
    }, selected.onTint);
    expect(selected.colour).toBe(probe);
    // The keyboard's focus outline is drawn round the whole row.
    expect(selected.outline).toBe('solid');

    // At the largest text size the row and its indent grow with the names, so no line spills out.
    const scaled = await item(page, key, 'sub/inner.txt').evaluate((el) => {
        const tree = el.closest('[role="tree"]');
        if (!(tree instanceof HTMLElement)) return null;
        tree.style.setProperty('--text-scale', '1.6');
        const main = el.querySelector('.main');
        const guide = el.querySelector('.guide');
        return {
            height: el.getBoundingClientRect().height,
            content: main === null ? 0 : main.scrollHeight,
            indent: guide === null ? 0 : guide.getBoundingClientRect().width
        };
    });
    expect(scaled).not.toBeNull();
    expect(scaled?.height).toBeCloseTo(22 * 1.6, 0);
    expect(scaled?.content ?? 0).toBeLessThanOrEqual(scaled?.height ?? 0);
    expect(scaled?.indent).toBeCloseTo(12 * 1.6, 0);
});

// Revert: call remove(key) straight from the head's control in views/sources/files/Files.svelte,
// with no confirm.
test('removing a root the reader added asks first, and a cancel keeps it', async ({ page }) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);

    const head = page.locator(`[data-fs-row="${key}:"]`);
    await head.hover();
    await head.getByRole('button', { name: t('files.remove_root'), exact: true }).click();
    const confirm = page.getByRole('alertdialog', { name: t('files.remove_root_confirm', key) });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: t('files.cancel'), exact: true }).click();
    // cancel closes the confirm without removing anything
    await expect(confirm).toHaveCount(0);
    await expect(row(page, key)).toBeVisible();

    await head.hover();
    await head.getByRole('button', { name: t('files.remove_root'), exact: true }).click();
    await confirm.getByRole('button', { name: t('files.remove_root'), exact: true }).click();
    // the confirm removed the root, so the tree no longer draws it
    await expect(page.locator(`[data-fs-row="${key}:"]`)).toHaveCount(0);
});

// Revert: bookmark under `row.name` whatever the other bookmarks hold, in
// views/sources/files/Files.svelte.
test('a second file of the same name is bookmarked under its path from the row star', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { dir, key } = await nestedRoot(page);
    writeFileSync(join(dir, 'README.md'), '# one\n');
    writeFileSync(join(dir, 'sub', 'README.md'), '# two\n');
    await openNested(page, key);
    await expect(row(page, key, 'README.md')).toBeVisible();
    await expect(row(page, key, 'sub/README.md')).toBeVisible();

    const star = (path: string): ReturnType<Page['locator']> =>
        page
            .locator(`[data-fs-row="${key}:${path}"]`)
            .getByRole('button', { name: t('files.row_bookmark'), exact: true });
    await star('README.md').click();
    await expect(star('README.md')).toHaveAttribute('aria-pressed', 'true');
    await star('sub/README.md').click();
    await expect(star('sub/README.md')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-fs-bookmark="README.md"]')).toBeVisible();
    await expect(page.locator('[data-fs-bookmark="sub/README.md"]')).toBeVisible();

    // Both taken away again, so the bookmarks this run saves are the ones the other cases expect.
    await star('README.md').click();
    await star('sub/README.md').click();
    // both stars were pressed again, so neither bookmark is left in the view
    await expect(page.locator('[data-fs-bookmark="sub/README.md"]')).toHaveCount(0);
    // the other star was pressed again too
    await expect(page.locator('[data-fs-bookmark="README.md"]')).toHaveCount(0);
});

// revert: src/lib/state/sources/fs.svelte.ts:649 => answered(BOOKMARKS, at);
test('a bookmarks read that failed is asked again by its own control, without a reload', async ({
    page
}) => {
    const reason = 'the bookmarks file could not be read';
    await page.route('**/api/fs?bookmarks=1', (route) =>
        route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: reason })
        })
    );

    await boot(page);
    await openView(page, 'files', t('views.files'));
    const marks = page.locator('[data-fs-bookmarks]');
    const failed = marks.getByText(t('files.bookmarks_failed', reason), { exact: true });
    await expect(failed).toBeVisible();

    await page.unroute('**/api/fs?bookmarks=1');
    const answered = page.waitForResponse(
        (response) => new URL(response.url()).search === '?bookmarks=1' && response.status() === 200
    );
    const again = marks.getByRole('button', { name: t('files.read_again'), exact: true });
    await again.click();
    await answered;

    // the successful answer clears the failure row
    await expect(failed).toHaveCount(0);
    // the retry control exists only beside a failed read
    await expect(again).toHaveCount(0);
});

// revert: src/lib/server/watch/bookmarks.ts:83 => () => undefined
test('a bookmark written by one page reaches a second page that wrote nothing', async ({
    page
}) => {
    const watching = await page.context().newPage();
    await boot(watching);
    const mark = watching.locator('nav button[data-bookmark="hub/README.md"]');
    // the second page has not seen a bookmark write yet
    await expect(mark).toHaveCount(0);

    await boot(page);
    await openView(page, 'files', t('views.files'));
    await row(page, 'hub').click();
    await row(page, 'hub', 'README.md').click();
    await page.getByRole('button', { name: t('file.bookmark'), exact: true }).click();
    await expect(page.locator('nav button[data-bookmark="hub/README.md"]')).toBeVisible();
    await expect(mark).toBeVisible();

    await page.getByRole('button', { name: t('file.unbookmark'), exact: true }).click();
    // the removal is delivered to the second open page
    await expect(mark).toHaveCount(0);
    await watching.close();
});
