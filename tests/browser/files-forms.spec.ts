// The file browser's forms in Chrome: the bookmark form and the root form stay open with what was
// typed into them after the tab is switched away from and back, and the bookmark form after a
// reload, since a pane mounts only its active tab and the open form is the instance's state. A
// bookmark form's draft is forgotten when the section's add control closes the form, when a row's
// edit moves it to another bookmark and when its bookmark is taken away; the form is mounted anew per
// opening. A write answered after the reader opened another form, closed and opened the same form
// again, or switched the tab away closes only the form it was made from, in the file browser it was
// made from.
//
// The drafts and the open forms are the ui store's, kept in the browser's own storage. The roots are
// folders made under the system temporary directory, and every bookmark a case writes is taken away
// before it ends.

import { sep } from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { nestedRoot, row, scratch } from './files.ts';
import { draftKeys, switchAndBack, uiInstances } from './forms.ts';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

/**
 * Hold every POST to one path until the case releases it. `sent` settles once the first one has left
 * the page, so a case presses its next control while the request is known to be on its way, and
 * `answered` once the page has its response.
 */
async function holdPosts(
    page: Page,
    path: string
): Promise<{ sent: Promise<void>; answered: Promise<unknown>; release: () => void }> {
    let release = (): void => undefined;
    const released = new Promise<void>((done) => {
        release = done;
    });
    let arrived = (): void => undefined;
    const sent = new Promise<void>((done) => {
        arrived = done;
    });
    const answered = page.waitForResponse(
        (response) =>
            response.request().method() === 'POST' && new URL(response.url()).pathname === path
    );
    // A case that never waits for the answer does not leave a rejection behind when its page closes.
    answered.catch(() => undefined);
    await page.route(`**${path}`, async (route) => {
        if (route.request().method() === 'POST') {
            arrived();
            await released;
        }
        await route.continue();
    });
    return { sent, answered, release: () => release() };
}

/** The id of the file browser instance on screen, which its box carries. */
async function filesId(page: Page): Promise<string> {
    return (await page.locator('.files[data-instance]').getAttribute('data-instance')) ?? '';
}

/** The keys of the records other than one instance's own that carry a form field. */
async function formsElsewhere(page: Page, owner: string): Promise<string[]> {
    return Object.entries(await uiInstances(page))
        .filter(
            ([key, held]) =>
                key !== owner && typeof held === 'object' && held !== null && 'form' in held
        )
        .map(([key]) => key);
}

/** The Status tab, drawn in place of the file browser. */
async function toStatus(page: Page): Promise<void> {
    await page.getByRole('tab', { name: t('views.status'), exact: true }).click();
    await expect(page.locator('[data-fs-bookmarks]')).toHaveCount(0);
}

/** Back to the file browser tab. */
async function toFiles(page: Page): Promise<void> {
    await page.getByRole('tab', { name: t('views.files'), exact: true }).click();
    await expect(page.locator('[data-fs-bookmarks]')).toBeVisible();
}

/**
 * A scratch root opened in the tree with its files tool.py and notes.md bookmarked from their row
 * stars, and what a case needs to reach them: the star of a row, a bookmark's row, and its edit
 * control.
 */
async function twoMarks(page: Page): Promise<{
    key: string;
    star: (path: string) => Promise<void>;
    mark: (label: string) => Locator;
    edit: (label: string) => Promise<void>;
}> {
    const { key } = await nestedRoot(page);
    await row(page, key).click();
    const star = async (path: string): Promise<void> => {
        const line = page.locator(`[data-fs-row="${key}:${path}"]`);
        await line.hover();
        await line.getByRole('button', { name: t('files.row_bookmark'), exact: true }).click();
    };
    const mark = (label: string): Locator => page.locator(`[data-fs-bookmark="${label}"]`);
    const edit = async (label: string): Promise<void> => {
        await mark(label).hover();
        await mark(label)
            .getByRole('button', { name: t('files.bookmark_edit'), exact: true })
            .click();
    };
    await star('tool.py');
    await expect(mark('tool.py')).toBeVisible();
    await star('notes.md');
    await expect(mark('notes.md')).toBeVisible();
    return { key, star, mark, edit };
}

// Revert: in shift() of views/Files.svelte, hold the forms in a component `$state` instead of
// patch(next); or drop its toggleAdd call, which leaves the draft behind.
test('the bookmark form is open with its typed label after a tab switch and a reload, and its own control closing it forgets the label', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.getByRole('button', { name: t('files.add_bookmark'), exact: true }).click();
    const form = page.locator('[data-form="add"]');
    const label = form.getByRole('textbox', { name: 'Label' });
    await label.fill('a label typed and not saved');
    expect(await draftKeys(page)).toHaveLength(1);

    await switchAndBack(page, t('views.files'), page.locator('[data-fs-bookmarks]'));
    await expect(label).toHaveValue('a label typed and not saved');

    await page.reload();
    await expect(label).toHaveValue('a label typed and not saved');

    // The section's own add control closes the form and takes its draft with it.
    await page.getByRole('button', { name: t('files.add_bookmark'), exact: true }).click();
    await expect(form).toHaveCount(0);
    expect(await draftKeys(page)).toEqual([]);
    await switchAndBack(page, t('views.files'), page.locator('[data-fs-bookmarks]'));
    await expect(form).toHaveCount(0);
});

// Revert: in views/Files.svelte, hold the root form's `typed` in a component `$state` instead of
// patch({ typed }).
test('the root form is open with its typed folder after a tab switch, and cancel lets it go', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    const box = page.getByRole('textbox', { name: t('files.root_dir') });
    await box.fill('~/a-folder-typed-and-not-added');

    await switchAndBack(page, t('views.files'), page.locator('[data-fs-bookmarks]'));
    await expect(box).toHaveValue('~/a-folder-typed-and-not-added');

    await page.getByRole('button', { name: t('files.cancel'), exact: true }).click();
    await expect(box).toHaveCount(0);
    await switchAndBack(page, t('views.files'), page.locator('[data-fs-bookmarks]'));
    await expect(box).toHaveCount(0);
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    await expect(box).toHaveValue('');
    await page.getByRole('button', { name: t('files.cancel'), exact: true }).click();
});

// Revert: in confirm() of views/Files.svelte, patch every form closed on a good answer instead of
// settle(owner, asked).
test('a root added while another form was opened leaves that form open with what was typed into it', async ({
    page
}) => {
    const dir = scratch();
    const key = dir.split(sep).at(-1) ?? '';
    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    await page.getByRole('textbox', { name: t('files.root_dir') }).fill(dir);

    const held = await holdPosts(page, '/api/fs');
    await page.getByRole('button', { name: t('files.add'), exact: true }).click();
    await held.sent;
    await page.getByRole('button', { name: t('files.save_as'), exact: true }).click();
    const name = page.getByRole('textbox', { name: t('files.workspace_name') });
    await name.fill('a name typed while the root was added');
    held.release();

    await expect(row(page, key)).toBeVisible();
    await expect(name).toHaveValue('a name typed while the root was added');
    await page.getByRole('button', { name: t('files.save_as'), exact: true }).click();
    await expect(name).toHaveCount(0);
    await page.unroute('**/api/fs');
});

// Revert: in closeMark() of views/Files.svelte, patch the form closed whichever opening it names
// instead of settle(owner, forms).
test("a bookmark added while another bookmark's form was opened leaves that form open", async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    await row(page, key).click();
    const star = (path: string): ReturnType<Page['locator']> =>
        page
            .locator(`[data-fs-row="${key}:${path}"]`)
            .getByRole('button', { name: t('files.row_bookmark'), exact: true });
    await page.locator(`[data-fs-row="${key}:tool.py"]`).hover();
    await star('tool.py').click();
    const kept = page.locator('[data-fs-bookmark="tool.py"]');
    await expect(kept).toBeVisible();

    const held = await holdPosts(page, '/api/write');
    await page.getByRole('button', { name: t('files.add_bookmark'), exact: true }).click();
    const adding = page.locator('[data-form="add"]');
    await adding.getByRole('textbox', { name: 'Label' }).fill('notes.md');
    await adding.getByRole('combobox', { name: 'Root' }).selectOption(key);
    await adding.getByRole('textbox', { name: 'Path' }).fill('notes.md');
    await adding.getByRole('button', { name: t('collection.form_save') }).click();
    await held.sent;
    await kept.hover();
    await kept.getByRole('button', { name: t('files.bookmark_edit'), exact: true }).click();
    const editing = page.locator('[data-form="edit"]');
    await expect(editing).toBeVisible();
    held.release();

    // The added bookmark is drawn only after its answer came back and the list was read again.
    await expect(page.locator('[data-fs-bookmark="notes.md"]')).toBeVisible();
    await expect(editing).toBeVisible();
    await expect(page.locator('[data-form="add"]')).toHaveCount(0);
    expect(await draftKeys(page)).toEqual([]);

    // Both taken away again, so the bookmarks this run saves are the ones the other cases expect.
    await kept.hover();
    await kept.getByRole('button', { name: t('files.bookmark_edit'), exact: true }).click();
    await expect(editing).toHaveCount(0);
    await page.unroute('**/api/write');
    await page.locator(`[data-fs-row="${key}:tool.py"]`).hover();
    await star('tool.py').click();
    await page.locator(`[data-fs-row="${key}:notes.md"]`).hover();
    await star('notes.md').click();
    await expect(kept).toHaveCount(0);
    await expect(page.locator('[data-fs-bookmark="notes.md"]')).toHaveCount(0);
});

// Revert: in confirm() of views/Files.svelte, settle through `instance.id` read after the answer
// instead of the `owner` taken before the request.
test('a root added while the tab is switched away closes its form in the file browser it came from', async ({
    page
}) => {
    const dir = scratch();
    const key = dir.split(sep).at(-1) ?? '';
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const owner = await filesId(page);
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    const box = page.getByRole('textbox', { name: t('files.root_dir') });
    await box.fill(dir);

    const held = await holdPosts(page, '/api/fs');
    await page.getByRole('button', { name: t('files.add'), exact: true }).click();
    await held.sent;
    await toStatus(page);
    held.release();
    await held.answered;

    await expect.poll(async () => (await uiInstances(page))[owner]).toMatchObject({ form: '' });
    expect(await formsElsewhere(page, owner)).toEqual([]);
    await toFiles(page);
    await expect(row(page, key)).toBeVisible();
    await expect(box).toHaveCount(0);
    await page.unroute('**/api/fs');
});

// Revert: in views/files/BookmarkForm.svelte, close through the `owner` prop read when the close
// runs instead of `opened.owner`.
test('a bookmark added while the tab is switched away closes its form in the file browser it came from', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    const owner = await filesId(page);
    await page.getByRole('button', { name: t('files.add_bookmark'), exact: true }).click();
    const adding = page.locator('[data-form="add"]');
    await adding.getByRole('textbox', { name: 'Label' }).fill('notes.md');
    await adding.getByRole('combobox', { name: 'Root' }).selectOption(key);
    await adding.getByRole('textbox', { name: 'Path' }).fill('notes.md');

    const held = await holdPosts(page, '/api/write');
    await adding.getByRole('button', { name: t('collection.form_save') }).click();
    await held.sent;
    await toStatus(page);
    held.release();
    await held.answered;

    await expect.poll(async () => (await uiInstances(page))[owner]).toMatchObject({ form: '' });
    expect(await formsElsewhere(page, owner)).toEqual([]);
    expect(await draftKeys(page)).toEqual([]);
    await toFiles(page);
    await expect(page.locator('[data-fs-bookmark="notes.md"]')).toBeVisible();
    await expect(page.locator('[data-form]')).toHaveCount(0);

    // Taken away again, so the bookmarks this run saves are the ones the other cases expect.
    await page.unroute('**/api/write');
    await row(page, key).click();
    const line = page.locator(`[data-fs-row="${key}:notes.md"]`);
    await line.hover();
    await line.getByRole('button', { name: t('files.row_bookmark'), exact: true }).click();
    await expect(page.locator('[data-fs-bookmark="notes.md"]')).toHaveCount(0);
});

// Revert: in formSettled of state/fs.ts, leave `opening` out of what it compares.
test('a root added while its form was closed and opened again leaves the reopened form and its line', async ({
    page
}) => {
    const dir = scratch();
    const key = dir.split(sep).at(-1) ?? '';
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const add = page.getByRole('button', { name: t('files.add_root'), exact: true });
    const box = page.getByRole('textbox', { name: t('files.root_dir') });
    await add.click();
    await box.fill(dir);

    const held = await holdPosts(page, '/api/fs');
    await page.getByRole('button', { name: t('files.add'), exact: true }).click();
    await held.sent;
    await add.click();
    await expect(box).toHaveCount(0);
    await add.click();
    // The same line typed again, so only the opening tells this form from the one the request left.
    await box.fill(dir);
    held.release();
    await held.answered;

    await expect(row(page, key)).toBeVisible();
    await expect(box).toHaveValue(dir);
    await page.getByRole('button', { name: t('files.cancel'), exact: true }).click();
    await expect(box).toHaveCount(0);
    await page.unroute('**/api/fs');
});

// Revert: in shift() of views/Files.svelte, drop the toggleEdit call.
test("a row's edit moving a typed edit form to another bookmark forgets what was typed", async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { star, mark, edit } = await twoMarks(page);
    const editing = page.locator('[data-form="edit"]');

    await edit('tool.py');
    await editing.getByRole('textbox', { name: 'Path' }).fill('typed/in/edit');
    expect(await draftKeys(page)).toHaveLength(1);
    await edit('notes.md');
    await expect(editing.getByRole('textbox', { name: 'Path' })).toHaveValue('notes.md');
    expect(await draftKeys(page)).toEqual([]);

    await edit('notes.md');
    await expect(editing).toHaveCount(0);
    await star('tool.py');
    await star('notes.md');
    await expect(mark('tool.py')).toHaveCount(0);
    await expect(mark('notes.md')).toHaveCount(0);
});

// Revert: in views/Files.svelte, draw BookmarkForm without its `{#key}` block.
test('an edit form opened from the add form is the one its Cancel closes', async ({ page }) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { star, mark, edit } = await twoMarks(page);

    await page.getByRole('button', { name: t('files.add_bookmark'), exact: true }).click();
    await expect(page.locator('[data-form="add"]')).toBeVisible();
    await edit('tool.py');
    const editing = page.locator('[data-form="edit"]');
    await expect(editing).toBeVisible();
    await editing.getByRole('button', { name: t('collection.form_cancel'), exact: true }).click();
    await expect(page.locator('[data-form]')).toHaveCount(0);

    await star('tool.py');
    await star('notes.md');
    await expect(mark('tool.py')).toHaveCount(0);
    await expect(mark('notes.md')).toHaveCount(0);
});

// Revert: in views/Files.svelte, drop the $effect that closes the form over a bookmark gone.
test('a bookmark taken away while its typed edit form is open closes the form, and the tab closes without asking', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { star, mark, edit } = await twoMarks(page);
    const editing = page.locator('[data-form="edit"]');

    await edit('tool.py');
    await editing.getByRole('textbox', { name: 'Path' }).fill('typed/in/edit');
    expect(await draftKeys(page)).toHaveLength(1);
    await star('tool.py');
    await expect(mark('tool.py')).toHaveCount(0);
    await expect(editing).toHaveCount(0);
    await expect.poll(() => draftKeys(page)).toEqual([]);

    await star('notes.md');
    await expect(mark('notes.md')).toHaveCount(0);
    await page
        .locator('.tab', { has: page.getByRole('tab', { name: t('views.files'), exact: true }) })
        .getByRole('button', { name: t('ui.close_tab') })
        .click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.getByRole('tab', { name: t('views.files'), exact: true })).toHaveCount(0);
});
