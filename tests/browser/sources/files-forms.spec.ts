// The file browser's forms in Chrome: the bookmark form and the root form stay open with what was
// typed into them after the tab is switched away from and back, and the bookmark form after a
// reload, since the open form is the instance's state and a reload draws the view anew. A
// bookmark form's draft is forgotten when the section's add control closes the form, when a row's
// edit moves it to another bookmark and when its bookmark is taken away; the form is mounted anew
// per opening. A write answered after the reader opened another form, closed and opened the same
// form again, or switched the tab away closes only the form it was made from, in the file browser
// it was made from. A value typed while a save is on its way stays where it was typed, in the add
// form left open over it and in a form whose bookmark leaves the file while that save is out; once
// the answer has landed, a bookmark the file no longer holds closes the form over it in every file
// browser the layout holds, including one whose tab is not shown and one on a page with no file
// browser drawn.
//
// The drafts and the open forms are the ui store's, kept in the browser's own storage. The roots
// are folders made under the system temporary directory, and the bookmarks and roots a case saves
// are put back as they were after it, passed or failed, by tests/browser/helpers/files.ts.

import { existsSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { keepServedFiles, nestedRoot, row, scratch } from '../helpers/files.ts';
import { draftKeys, reloadAndShow, switchAndBack, uiInstances } from '../helpers/forms.ts';
import { servedHomeDir } from '../helpers/hub.ts';
import { boot, makePage, openView } from '../helpers/rail.ts';
import { t, tabNamed } from '../helpers/words.ts';

keepServedFiles();

/**
 * Hold every POST to one path until the case releases it. `sent` settles once the first one has
 * left the page, so a case presses its next control while the request is known to be on its way,
 * and `answered` once the page has its response.
 */
async function holdPosts(
    page: Page,
    path: string,
    holds: (body: string) => boolean = () => true
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
            response.request().method() === 'POST' &&
            new URL(response.url()).pathname === path &&
            holds(response.request().postData() ?? '')
    );
    // A case that never waits for the answer does not leave a rejection behind when its page
    // closes.
    answered.catch(() => undefined);
    await page.route(`**${path}`, async (route) => {
        // A case that names which body to hold lets every other write through, so it can press a
        // control that writes while the one it holds is still on its way.
        if (route.request().method() === 'POST' && holds(route.request().postData() ?? '')) {
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

/** The Status tab, drawn in place of the file browser, which stays mounted and hidden. */
async function toStatus(page: Page): Promise<void> {
    await page.getByRole('tab', { name: tabNamed(t('views.status')) }).click();
    await expect(page.locator('[data-fs-bookmarks]')).toBeHidden();
}

/** Back to the file browser tab. */
async function toFiles(page: Page): Promise<void> {
    await page.getByRole('tab', { name: tabNamed(t('views.files')) }).click();
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

// Revert: in shift() of views/sources/files/Files.svelte, hold the forms in a component `$state`
// instead of patch(next); or drop its toggleAdd call, which leaves the draft behind.
// revert: src/lib/state/workbench/ui.svelte.ts:288 => delete
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

// Revert: in views/sources/files/Files.svelte, hold the root form's `typed` in a component `$state`
// instead of patch({ typed }).
// revert: src/lib/state/workbench/ui.svelte.ts:288 => delete
test('the root form is open with its typed folder after a reload, and cancel lets it go', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    const box = page.getByRole('textbox', { name: t('files.root_dir') });
    await box.fill('~/a-folder-typed-and-not-added');

    await reloadAndShow(page, t('views.files'), page.locator('[data-fs-bookmarks]'));
    await expect(box).toHaveValue('~/a-folder-typed-and-not-added');

    await page.getByRole('button', { name: t('files.cancel'), exact: true }).click();
    await expect(box).toHaveCount(0);
    await reloadAndShow(page, t('views.files'), page.locator('[data-fs-bookmarks]'));
    // the cancel closed the form in the instance, so the reload draws it closed
    await expect(box).toHaveCount(0);
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    await expect(box).toHaveValue('');
    await page.getByRole('button', { name: t('files.cancel'), exact: true }).click();
});

// Revert: in filesViewOf of state/sources/fs.ts, read no refusal line, so the line lives only as
// long as the component that drew it.
test('a refused root comes back with its form and its refusal after a reload', async ({ page }) => {
    // revert: src/lib/state/sources/fs.ts:314 => note: '',
    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    const box = page.getByRole('textbox', { name: t('files.root_dir') });
    await box.fill('a-folder-that-is-not-absolute');
    await page.getByRole('button', { name: t('files.add'), exact: true }).click();
    const refused = page.getByText(t('files.refused_not_absolute'), { exact: true });
    await expect(refused).toBeVisible();

    await reloadAndShow(page, t('views.files'), page.locator('[data-fs-bookmarks]'));
    await expect(box).toHaveValue('a-folder-that-is-not-absolute');
    await expect(refused).toBeVisible();

    await page.getByRole('button', { name: t('files.cancel'), exact: true }).click();
    // Cancel closed the form, and the refusal went with the press that closed it.
    await expect(refused).toHaveCount(0);
});

// Revert: in filesViewOf of state/sources/fs.ts, read no outcome line.
test("the bookmark form's outcome line comes back after a reload", async ({ page }) => {
    // revert: src/lib/state/sources/fs.ts:315 => said: '',
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    await page.getByRole('button', { name: t('files.add_bookmark'), exact: true }).click();
    const adding = page.locator('[data-form="add"]');
    await adding.getByRole('textbox', { name: 'Label' }).fill('notes.md');
    await adding.getByRole('combobox', { name: 'Root' }).selectOption(key);
    await adding.getByRole('textbox', { name: 'Path' }).fill('notes.md');
    await adding.getByRole('button', { name: t('collection.form_save'), exact: true }).click();
    const said = page.locator('[data-instance] > .said');
    await expect(said).toBeVisible();
    const words = await said.textContent();

    await reloadAndShow(page, t('views.files'), page.locator('[data-fs-bookmarks]'));
    await expect(said).toHaveText(words ?? '');
});

// Revert: in confirm() of views/sources/files/Files.svelte, patch every form closed on a good
// answer instead of settle(owner, asked).
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

// Revert: in closeMark() of views/sources/files/Files.svelte, patch the form closed whichever
// opening it names instead of settle(owner, forms).
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
    await adding.getByRole('button', { name: t('collection.form_save'), exact: true }).click();
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
});

// The answer lands while the file browser's tab is hidden, and closes its form all the same.
// revert: src/lib/views/sources/files/Files.svelte:321 => delete
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

// The answer lands while the file browser's tab is hidden, and closes its form all the same.
// revert: src/lib/views/sources/files/Files.svelte:416 => onclose={() => undefined}
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
    await adding.getByRole('button', { name: t('collection.form_save'), exact: true }).click();
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
});

// Revert: in formSettled of state/sources/fs.ts, leave `opening` out of what it compares.
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

// Revert: in shift() of views/sources/files/Files.svelte, drop the toggleEdit call.
test("a row's edit moving a typed edit form to another bookmark forgets what was typed", async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { edit } = await twoMarks(page);
    const editing = page.locator('[data-form="edit"]');

    await edit('tool.py');
    await editing.getByRole('textbox', { name: 'Path' }).fill('typed/in/edit');
    expect(await draftKeys(page)).toHaveLength(1);
    await edit('notes.md');
    await expect(editing.getByRole('textbox', { name: 'Path' })).toHaveValue('notes.md');
    expect(await draftKeys(page)).toEqual([]);

    await edit('notes.md');
    await expect(editing).toHaveCount(0);
});

// Revert: in views/sources/files/Files.svelte, draw BookmarkForm without its `{#key}` block, or
// key it by the instance alone, so the add form's component is kept for the edit form.
// revert: src/lib/views/sources/files/Files.svelte:408 => {#key instance.id}
test('an edit form opened from the add form is the one its Cancel closes', async ({ page }) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { edit } = await twoMarks(page);

    await page.getByRole('button', { name: t('files.add_bookmark'), exact: true }).click();
    await expect(page.locator('[data-form="add"]')).toBeVisible();
    await edit('tool.py');
    const editing = page.locator('[data-form="edit"]');
    await expect(editing).toBeVisible();
    await editing.getByRole('button', { name: t('collection.form_cancel'), exact: true }).click();
    await expect(page.locator('[data-form]')).toHaveCount(0);
});

// Revert: in closeGoneForms of state/sources/fs.svelte.ts, sweep no browser at all.
// revert: src/lib/state/sources/fs.svelte.ts:678 => for (const one of forms.browsers().slice(0, 0)) {
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

    await page
        .locator('.tab', { has: page.getByRole('tab', { name: tabNamed(t('views.files')) }) })
        .getByRole('button', { name: t('ui.close_tab') })
        .click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.getByRole('tab', { name: tabNamed(t('views.files')) })).toHaveCount(0);
});

// Revert: in save() of views/shared/forms/EntryForm.svelte, clear the add form's draft and close it
// on every answer, through into.clear(which) in place of into.taken(which, sent).
// revert: src/lib/views/shared/forms/EntryForm.svelte:267 => const took = (into.clear(which), true);
test('a bookmark add form typed on while its save was out keeps the typing, open over it', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    await page.getByRole('button', { name: t('files.add_bookmark'), exact: true }).click();
    const adding = page.locator('[data-form="add"]');
    const label = adding.getByRole('textbox', { name: 'Label' });
    await label.fill('notes.md');
    await adding.getByRole('combobox', { name: 'Root' }).selectOption(key);
    await adding.getByRole('textbox', { name: 'Path' }).fill('notes.md');

    const held = await holdPosts(page, '/api/write');
    await adding.getByRole('button', { name: t('collection.form_save'), exact: true }).click();
    await held.sent;
    await label.fill('a label typed while the save was out');
    held.release();
    await held.answered;

    await expect(page.locator('[data-fs-bookmark="notes.md"]')).toBeVisible();
    await expect(adding).toBeVisible();
    await expect(label).toHaveValue('a label typed while the save was out');
    expect(await draftKeys(page)).toHaveLength(1);
});

// Revert: in views/sources/files/Files.svelte, hand the bookmark form a rename that opens nothing,
// so the form stays over the id its bookmark had before the save.
// revert: src/lib/views/sources/files/Files.svelte:417 => onrenamed={() => undefined}
test('a bookmark renamed by its form keeps what was typed, open over the bookmark it renamed', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { mark, edit } = await twoMarks(page);
    const editing = page.locator('[data-form="edit"]');
    const own = await filesId(page);
    const typing = 'typed/while/the/save/was/out';

    await edit('tool.py');
    // The label is the bookmark's id, so the save writes the entry under another one and the id the
    // form was opened over names nothing once the answer has landed.
    await editing.getByRole('textbox', { name: 'Label' }).fill('tool.py renamed');
    const held = await holdPosts(page, '/api/write');
    await editing.getByRole('button', { name: t('collection.form_save'), exact: true }).click();
    await held.sent;
    await editing.getByRole('textbox', { name: 'Path' }).fill(typing);
    held.release();
    await held.answered;

    // The form is open over the bookmark where it now is, holding what was typed while the save was
    // out, and the close of a form over a bookmark that is gone has nothing to close.
    await expect(mark('tool.py renamed')).toBeVisible();
    await expect
        .poll(async () => (await uiInstances(page))[own])
        .toMatchObject({ form: 'bookmark', editing: 'tool.py renamed' });
    await expect(editing.getByRole('textbox', { name: 'Path' })).toHaveValue(typing);
    await expect(editing.getByRole('textbox', { name: 'Label' })).toHaveValue('tool.py renamed');
    expect(await draftKeys(page)).toHaveLength(1);

    // The form's own Cancel still closes it: what the rename moved is the bookmark, not the
    // opening.
    await editing.getByRole('button', { name: t('collection.form_cancel') }).click();
    await expect(editing).toHaveCount(0);
    await expect.poll(() => draftKeys(page)).toEqual([]);
});

// Revert: in editedGone of state/sources/fs.ts, drop `saving` from the line that answers false.
// revert: src/lib/state/sources/fs.ts:504 => if (marks.loading || marks.error !== '') return false;
test('a bookmark taken away while a save from its form is out leaves the form until it lands', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { star, mark, edit } = await twoMarks(page);
    const editing = page.locator('[data-form="edit"]');
    const own = await filesId(page);
    const typing = 'typed/while/the/save/was/out';

    await edit('tool.py');
    await editing.getByRole('textbox', { name: 'Path' }).fill(typing);
    // Only this form's own write is held, so the row star below is answered while it is on its way.
    const held = await holdPosts(page, '/api/write', (body) => body.includes(typing));
    await editing.getByRole('button', { name: t('collection.form_save'), exact: true }).click();
    await held.sent;

    // The bookmark leaves the file while the save from its form is still on its way. The form has
    // nothing to draw without its bookmark, and its opening and what was typed into it are kept:
    // the request may yet put the bookmark back, and the reader's words are not forgotten under it.
    await star('tool.py');
    await expect(mark('tool.py')).toHaveCount(0);
    expect(await draftKeys(page)).toHaveLength(1);
    expect(await uiInstances(page)).toMatchObject({
        [own]: { form: 'bookmark', editing: 'tool.py' }
    });

    held.release();
    await held.answered;

    // The answer has landed, so the form is read like any other and closes over the gone bookmark.
    await expect
        .poll(async () => (await uiInstances(page))[own])
        .toMatchObject({
            form: '',
            editing: ''
        });
    await expect.poll(() => draftKeys(page)).toEqual([]);
});

// Revert: in closeGoneForms of state/sources/fs.svelte.ts, sweep no browser, which is what the rule
// living in an $effect of the mounted view came to for a page that draws none.
// revert: src/lib/state/sources/fs.svelte.ts:678 => for (const one of forms.browsers().slice(0, 0)) {
test('a bookmark taken away closes its form with no file browser on screen at all', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key, mark, edit } = await twoMarks(page);
    const hidden = await filesId(page);

    await edit('tool.py');
    await page.locator('[data-form="edit"]').getByRole('textbox', { name: 'Path' }).fill('typed');
    expect(await draftKeys(page)).toHaveLength(1);

    // The file's own tab takes the pane, so no file browser is drawn anywhere on the page, and
    // the bookmark is taken away from that tab rather than from a tree.
    await row(page, key, 'tool.py').click();
    await expect(page.locator('[data-fs-bookmarks]')).toBeHidden();
    await page.getByRole('button', { name: t('file.unbookmark'), exact: true }).click();

    await expect
        .poll(async () => (await uiInstances(page))[hidden])
        .toMatchObject({
            form: '',
            editing: ''
        });
    await expect.poll(() => draftKeys(page)).toEqual([]);

    await page.getByRole('tab', { name: tabNamed(t('views.files')) }).click();
    await expect(mark('tool.py')).toHaveCount(0);
});

// Revert: in closeGoneForms of state/sources/fs.svelte.ts, sweep no browser, which is what the rule
// living in an $effect of the mounted view came to for a page that draws none.
// revert: src/lib/state/sources/fs.svelte.ts:678 => for (const one of forms.browsers().slice(0, 0)) {
test('a bookmark taken away closes the form of a file browser whose tab is not shown', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key, star, mark, edit } = await twoMarks(page);
    const hidden = await filesId(page);
    await edit('tool.py');
    await page
        .locator('[data-form="edit"]')
        .getByRole('textbox', { name: 'Path' })
        .fill('typed/in/edit');
    expect(await draftKeys(page)).toHaveLength(1);

    // A page of its own draws a file browser of its own, and the first page's is not mounted while
    // the second is the page on screen.
    await makePage(page);
    await openView(page, 'files', t('views.files'));
    expect(await filesId(page)).not.toBe(hidden);
    await expect(page.locator('[data-form="edit"]')).toHaveCount(0);

    await row(page, key).click();
    await star('tool.py');
    await expect(mark('tool.py')).toHaveCount(0);
    await expect
        .poll(async () => (await uiInstances(page))[hidden])
        .toMatchObject({ form: '', editing: '' });
    await expect.poll(() => draftKeys(page)).toEqual([]);
});

/** What one of the served run's own files holds, or the empty string when it is not there. */
function servedFile(name: string): string {
    const path = join(servedHomeDir(), '.oculus', name);
    return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

// The two run in order, and the first one's title ends in the second's, so a run of the second by
// its name runs the first before it.
test.describe('the bookmarks and roots of a case that stops halfway', () => {
    test.describe.configure({ mode: 'serial' });
    let left = '';

    test('a case that saves a root and a bookmark and stops is put back as it was before', async ({
        page
    }) => {
        test.fail();
        await boot(page);
        await openView(page, 'files', t('views.files'));
        const { key } = await nestedRoot(page);
        await row(page, key).click();
        const line = page.locator(`[data-fs-row="${key}:tool.py"]`);
        await line.hover();
        await line.getByRole('button', { name: t('files.row_bookmark'), exact: true }).click();
        await expect(page.locator('[data-fs-bookmark="tool.py"]')).toBeVisible();
        expect(servedFile('bookmarks.yml')).toContain(key);
        expect(servedFile('workspaces.json')).toContain(key);
        left = key;
        throw new Error('the case stops here, before any line of its own takes the two away');
    });

    // revert: tests/browser/helpers/files.ts:38-40 => delete
    test('is put back as it was before', () => {
        expect(left).not.toBe('');
        // The case before put its bookmark here, and the helper took the file back after it.
        expect(servedFile('bookmarks.yml')).not.toContain(left);
        // The case before added its root here, and the helper took the file back after it.
        expect(servedFile('workspaces.json')).not.toContain(left);
    });
});
