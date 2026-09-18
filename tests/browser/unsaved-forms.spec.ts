// Unsaved form input in Chrome: what a reader typed into a collection's add form, a card's edit form
// or the manifest editor is still there, in a form still open, after the tab was switched away from
// and back (a pane mounts only its active tab, so the component that drew the form is gone in
// between) and after a reload; the tab holding it asks before it closes, measured against the entry
// as the file holds it now; Cancel, the view's Add and Edit toggles and a save take the question
// away, and they and a delete leave no draft in the browser's storage. A value typed while a save is
// on its way stays in the open form, an edit's and an add's alike, and so does the text of an add
// form closed and opened again while its save was out; an add form nothing touched while its save
// was out closes once its entry is added, and one left open goes on writing the entry it added
// rather than adding a second. The Save control is not pressable while its own save is out. A pane
// closed from its menu takes the drafts and the records of every tab in it out of the browser's
// storage. A file browser's root line typed and not added is asked about the same way.
//
// The drafts are the ui store's, kept in the browser's own storage. The writes here go to the
// temporary copy of demo/, and every file a case writes is put back before the case ends.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { pressCardAction } from './cards.ts';
import { draftKeys, switchAndBack, uiInstances } from './forms.ts';
import { readHubFile, readHubYaml, writeHubFile } from './hub.ts';
import { boot, openView } from './rail.ts';
import { t, tabNamed } from './words.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';

const TASKS = 'tasks/tasks.yml';
const TYPED = 'A task typed and left unsaved';
const PROJECT = 'projects/manuscripts/sparse-attention';
const FIELD = 'status.line';
const LINE = 'A status line typed and left unsaved.';

/** The label the manifest form draws one field by, read from the schema rather than typed here. */
function labelOf(field: string): string {
    const schema = loadConfig(engineDir()).config.manifest_schema as {
        fields: Record<string, { label: string }>;
    };
    if (!(field in schema.fields)) {
        throw new Error(`config/manifest-schema.yml names no field ${field}`);
    }
    return schema.fields[field].label;
}

/** The close control of the tab with this name. */
function closeOf(page: Page, name: string): Locator {
    return page
        .locator('.tab', { has: page.getByRole('tab', { name: tabNamed(name) }) })
        .getByRole('button', { name: t('ui.close_tab') });
}

/** The title control of the tasks add form. */
function titleBox(page: Page): Locator {
    return page.locator('[data-form="add"]').getByRole('textbox', { name: 'title', exact: true });
}

/** The card of the first entry of the tasks file, by its title. */
function firstCard(page: Page): Locator {
    const entries = readHubYaml(TASKS).entries as Record<string, unknown>[];
    return page.locator('.cards [data-entry]').filter({ hasText: String(entries[0].title) });
}

/** The kind control of the open edit form. */
function kindBox(page: Page): Locator {
    return page.locator('[data-form="edit"]').getByRole('textbox', { name: 'kind', exact: true });
}

/** Open the Tasks tab, open its add form, and type into it. */
async function typeTask(page: Page): Promise<void> {
    await openView(page, 'tasks', t('views.tasks'));
    await page.getByRole('button', { name: t('collection.add') }).click();
    await titleBox(page).fill(TYPED);
}

/** Open the manifest editor of the demo project from its card, and type into one field. */
async function typeManifest(page: Page): Promise<Locator> {
    const short = String(readHubYaml(`${PROJECT}/project.yml`).short);
    await openView(page, 'projects', t('views.projects'));
    await pressCardAction(
        page,
        page.locator('.slot').filter({ hasText: short }).first(),
        t('project.card.edit_manifest')
    );
    const tab = page.getByRole('tab', { name: tabNamed(t('views.editor')) });
    await expect(tab).toBeVisible();
    const box = page.getByRole('textbox', { name: labelOf(FIELD) });
    await box.fill(LINE);
    return tab;
}

test('text typed into an add form is there, in the open form, after a tab switch and a reload', async ({
    page
}) => {
    const before = readHubFile(TASKS);
    await boot(page);
    await typeTask(page);

    await switchAndBack(page, t('views.tasks'), page.locator('[data-collection="tasks"]'));
    await expect(titleBox(page)).toHaveValue(TYPED);

    // The Tasks tab is still the active one after the reload, so the Status tab's socket line is
    // not on the page to wait for; the collection drawn from the pushed snapshot is.
    await page.reload();
    await expect(page.locator('[data-collection="tasks"]')).toBeVisible();
    await expect(titleBox(page)).toHaveValue(TYPED);
    expect(readHubFile(TASKS)).toBe(before);
});

test("text typed into a card's edit form is there, in the open form, after a tab switch", async ({
    page
}) => {
    await boot(page);
    await openView(page, 'tasks', t('views.tasks'));
    await firstCard(page)
        .getByRole('button', { name: t('collection.edit_delete') })
        .click();
    await kindBox(page).fill('kind typed into the card');

    await switchAndBack(page, t('views.tasks'), page.locator('[data-collection="tasks"]'));
    await expect(kindBox(page)).toHaveValue('kind typed into the card');
});

test('a tab holding a typed add form asks before it closes; Cancel and the Add toggle take the question away', async ({
    page
}) => {
    await boot(page);
    await typeTask(page);
    const close = closeOf(page, t('views.tasks'));
    const asked = page.getByRole('alertdialog');

    await close.click();
    await expect(asked).toBeVisible();
    await expect(asked).toContainText(t('ui.tab_close_dirty'));
    await asked.getByRole('button', { name: t('ui.confirm_cancel'), exact: true }).click();
    await expect(asked).toHaveCount(0);
    await expect(titleBox(page)).toHaveValue(TYPED);

    await page.getByRole('button', { name: t('collection.form_cancel'), exact: true }).click();
    await expect(page.locator('[data-form="add"]')).toHaveCount(0);
    expect(await draftKeys(page)).toEqual([]);

    // The view's own Add toggle closing the form forgets what was typed into it as Cancel does.
    await page.getByRole('button', { name: t('collection.add') }).click();
    await titleBox(page).fill(TYPED);
    expect(await draftKeys(page)).toHaveLength(1);
    await page.getByRole('button', { name: t('collection.add') }).click();
    await expect(page.locator('[data-form="add"]')).toHaveCount(0);
    expect(await draftKeys(page)).toEqual([]);

    await close.click();
    await expect(asked).toHaveCount(0);
    await expect(page.getByRole('tab', { name: tabNamed(t('views.tasks')) })).toHaveCount(0);
});

/** The keys of every instance record the ui store holds in the browser's storage. */
async function instanceKeys(page: Page): Promise<string[]> {
    return Object.keys(await uiInstances(page));
}

/** Show one tab of a pane and read the instance id its view draws, once that view is the one drawn. */
async function instanceOf(pane: Locator, label: string, body: string): Promise<string> {
    await pane.getByRole('tab', { name: tabNamed(label) }).click();
    const view = pane.locator(body);
    await expect(view).toHaveCount(1);
    const id = await view.getAttribute('data-instance');
    expect(id).not.toBeNull();
    return id ?? '';
}

test("a pane closed from its menu over a typed add form leaves none of its tabs' records in storage", async ({
    page
}) => {
    // Revert: drop `forgetTabs(pane.tabs)` from closePane in state/layout.svelte.ts.
    await boot(page);
    await typeTask(page);
    const pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: tabNamed(t('views.tasks')) })
    });
    // A collection's search box writes the instance's own record, beside the form draft's. The pane
    // holds three tabs: Tasks with both records, Venues with its own, and Status, which writes none.
    await pane.getByRole('searchbox').fill('a');
    await expect(titleBox(page)).toHaveValue(TYPED);
    await openView(page, 'venues', t('views.venues'));
    await pane.getByRole('searchbox').fill('a');
    const tasks = await instanceOf(pane, t('views.tasks'), '[data-collection="tasks"]');
    await expect(titleBox(page)).toHaveValue(TYPED);
    const venues = await instanceOf(pane, t('views.venues'), '.venues[data-instance]');
    const status = await instanceOf(pane, t('views.status'), '.view[data-instance]');
    const ids = [status, tasks, venues];
    expect(new Set(ids).size).toBe(3);
    await expect
        .poll(() => instanceKeys(page))
        .toEqual(expect.arrayContaining([tasks, `${tasks}#forms`, venues]));

    await pane.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('ui.pane_close'), exact: true }).click();
    const asked = page.getByRole('alertdialog');
    await expect(asked).toBeVisible();
    await asked.getByRole('button', { name: t('ui.confirm_ok'), exact: true }).click();
    await expect(page.getByRole('tab', { name: tabNamed(t('views.tasks')) })).toHaveCount(0);

    expect(await draftKeys(page)).toEqual([]);
    const left = await instanceKeys(page);
    for (const id of ids) {
        expect(left).not.toContain(id);
        expect(left).not.toContain(`${id}#forms`);
    }
});

test('an edit typed back to the entry asks once the file has changed under it', async ({
    page
}) => {
    const before = readHubFile(TASKS);
    const kind = String((readHubYaml(TASKS).entries as Record<string, unknown>[])[0].kind);
    try {
        await boot(page);
        await openView(page, 'tasks', t('views.tasks'));
        const card = firstCard(page);
        await card.getByRole('button', { name: t('collection.edit_delete') }).click();
        await kindBox(page).fill('something else');
        await kindBox(page).fill(kind);
        const close = closeOf(page, t('views.tasks'));
        const asked = page.getByRole('alertdialog');

        // Typed back to what the entry holds: nothing is unsaved, and the close asks nothing yet.
        await close.click();
        await expect(asked).toHaveCount(0);
        await openView(page, 'tasks', t('views.tasks'));
        await firstCard(page)
            .getByRole('button', { name: t('collection.edit_delete') })
            .click();
        await kindBox(page).fill('something else');
        await kindBox(page).fill(kind);

        writeHubFile(TASKS, before.replace(`kind: ${kind}`, 'kind: changed-on-disk'));
        await expect(firstCard(page).getByText('changed-on-disk')).toBeVisible();
        await expect(kindBox(page)).toHaveValue(kind);
        await close.click();
        await expect(asked).toBeVisible();
        await expect(asked).toContainText(t('ui.tab_close_dirty'));
    } finally {
        writeHubFile(TASKS, before);
    }
});

test('a save of the add form takes its draft away', async ({ page }) => {
    const before = readHubFile(TASKS);
    try {
        await boot(page);
        await typeTask(page);
        expect(await draftKeys(page)).toHaveLength(1);
        await page.getByRole('button', { name: t('collection.form_save') }).click();
        await expect.poll(() => readHubFile(TASKS), { timeout: 5000 }).toContain(TYPED);
        await expect(page.locator('[data-form="add"]')).toHaveCount(0);
        expect(await draftKeys(page)).toEqual([]);

        await closeOf(page, t('views.tasks')).click();
        await expect(page.getByRole('alertdialog')).toHaveCount(0);
    } finally {
        writeHubFile(TASKS, before);
    }
});

test('a delete from the edit form takes its draft away', async ({ page }) => {
    const before = readHubFile(TASKS);
    try {
        await boot(page);
        await openView(page, 'tasks', t('views.tasks'));
        const card = firstCard(page);
        await card.getByRole('button', { name: t('collection.edit_delete') }).click();
        await kindBox(page).fill('typed before the delete');
        expect(await draftKeys(page)).toHaveLength(1);

        await page.getByRole('button', { name: t('collection.form_delete'), exact: true }).click();
        await page
            .getByRole('alertdialog')
            .getByRole('button', { name: t('collection.form_delete'), exact: true })
            .click();
        await expect.poll(() => readHubFile(TASKS), { timeout: 5000 }).not.toBe(before);
        await expect(card).toHaveCount(0);
        expect(await draftKeys(page)).toEqual([]);
    } finally {
        writeHubFile(TASKS, before);
    }
});

test('an edit typed into the manifest editor is there after a tab switch', async ({ page }) => {
    await boot(page);
    const tab = await typeManifest(page);

    // A view opened now lands in the editor's pane, which was the last one used, and replaces the
    // editor on the page until its tab is pressed again.
    await openView(page, 'history', t('views.history'));
    await expect(page.locator('.editor[data-project]')).toHaveCount(0);
    await tab.click();
    await expect(page.getByRole('textbox', { name: labelOf(FIELD) })).toHaveValue(LINE);
    await expect(page.getByText(t('editor.dirty', 1))).toBeVisible();
});

test('a manifest editor with an edit asks before it closes, and a save clears the question', async ({
    page
}) => {
    const file = `${PROJECT}/project.yml`;
    const before = readHubFile(file);
    try {
        await boot(page);
        await typeManifest(page);
        const close = closeOf(page, t('views.editor'));
        const asked = page.getByRole('alertdialog');

        await close.click();
        await expect(asked).toBeVisible();
        await expect(asked).toContainText(t('ui.tab_close_dirty'));
        await asked.getByRole('button', { name: t('ui.confirm_cancel'), exact: true }).click();
        await expect(asked).toHaveCount(0);

        await page.getByRole('button', { name: t('editor.save') }).click();
        await expect(page.getByText(t('editor.saved', FIELD))).toBeVisible();
        await expect.poll(() => readHubFile(file)).toContain(LINE);
        await expect(page.getByRole('textbox', { name: labelOf(FIELD) })).toHaveValue(LINE);

        await close.click();
        await expect(asked).toHaveCount(0);
        await expect(page.getByRole('tab', { name: tabNamed(t('views.editor')) })).toHaveCount(0);
    } finally {
        writeHubFile(file, before);
    }
});

/** Hold every write to the hub for a while, so a case can type while a save is on its way. */
async function slowWrites(page: Page): Promise<void> {
    await page.route('**/api/write', async (route) => {
        await new Promise((done) => setTimeout(done, 2000));
        await route.continue();
    });
}

test('an edit form keeps a value typed while its save was on its way, open over it', async ({
    page
}) => {
    // Revert: EntryForm clearing the draft and closing on every save that went through.
    const before = readHubFile(TASKS);
    try {
        await boot(page);
        await openView(page, 'tasks', t('views.tasks'));
        await firstCard(page)
            .getByRole('button', { name: t('collection.edit_delete') })
            .click();
        await kindBox(page).fill('kind sent');
        await slowWrites(page);
        await page.getByRole('button', { name: t('collection.form_save') }).click();
        await kindBox(page).fill('kind typed while the save was out');
        await expect.poll(() => readHubFile(TASKS), { timeout: 10000 }).toContain('kind sent');
        await expect(page.locator('[data-form="edit"]')).toHaveCount(1);
        await expect(kindBox(page)).toHaveValue('kind typed while the save was out');
        expect(await draftKeys(page)).toHaveLength(1);
    } finally {
        writeHubFile(TASKS, before);
    }
});

test('an add form nothing touched while its save was out closes once its entry is added', async ({
    page
}) => {
    // revert: src/lib/views/shared/EntryForm.svelte:263 => const took = (into.taken(which, sent), false);
    // Revert: EntryForm leaving the add form open on every answer, or not clearing its draft.
    const before = readHubFile(TASKS);
    try {
        await boot(page);
        await typeTask(page);
        await slowWrites(page);
        await page.getByRole('button', { name: t('collection.form_save') }).click();
        await expect.poll(() => readHubFile(TASKS), { timeout: 10000 }).toContain(TYPED);
        await expect(page.locator('[data-form="add"]')).toHaveCount(0);
        expect(await draftKeys(page)).toEqual([]);
    } finally {
        writeHubFile(TASKS, before);
    }
});

test('an add form keeps a value typed while its save was on its way, open over it', async ({
    page
}) => {
    // revert: src/lib/views/shared/EntryForm.svelte:263 => const took = (into.clear(which), true);
    // Revert: EntryForm clearing the add form's draft and closing it on every answer, through
    // into.clear(which) in place of into.taken(which, sent).
    const before = readHubFile(TASKS);
    try {
        await boot(page);
        await typeTask(page);
        await slowWrites(page);
        await page.getByRole('button', { name: t('collection.form_save') }).click();
        await titleBox(page).fill(`${TYPED} and more`);
        await expect.poll(() => readHubFile(TASKS), { timeout: 10000 }).toContain(TYPED);
        await expect(page.locator('[data-form="add"]')).toHaveCount(1);
        await expect(titleBox(page)).toHaveValue(`${TYPED} and more`);
        expect(await draftKeys(page)).toHaveLength(1);
        expect(readHubFile(TASKS)).not.toContain(`${TYPED} and more`);
    } finally {
        writeHubFile(TASKS, before);
    }
});

test('an add form closed and opened again while its save was out keeps its new text', async ({
    page
}) => {
    // revert: src/lib/views/shared/EntryForm.svelte:263 => const took = (into.clear(which), true);
    // Revert: EntryForm clearing the add form's draft and closing it on every answer, through
    // into.clear(which) in place of into.taken(which, sent).
    const before = readHubFile(TASKS);
    try {
        await boot(page);
        await typeTask(page);
        await slowWrites(page);
        await page.getByRole('button', { name: t('collection.form_save') }).click();
        const add = page.getByRole('button', { name: t('collection.add') });
        await add.click();
        await expect(page.locator('[data-form="add"]')).toHaveCount(0);
        await add.click();
        await titleBox(page).fill('A second task typed into the form opened again');
        await expect.poll(() => readHubFile(TASKS), { timeout: 10000 }).toContain(TYPED);
        await expect(page.locator('[data-form="add"]')).toHaveCount(1);
        await expect(titleBox(page)).toHaveValue('A second task typed into the form opened again');
        expect(await draftKeys(page)).toHaveLength(1);
    } finally {
        writeHubFile(TASKS, before);
    }
});

/** The kind control of the open add form. */
function addKindBox(page: Page): Locator {
    return page.locator('[data-form="add"]').getByRole('textbox', { name: 'kind', exact: true });
}

/** The entries of the tasks file carrying one title. */
function entriesTitled(title: string): Record<string, unknown>[] {
    const entries = readHubYaml(TASKS).entries as Record<string, unknown>[];
    return entries.filter((one) => one.title === title);
}

test('an add form left open by its answer writes the entry it added, not a second one', async ({
    page
}) => {
    // revert: src/lib/views/shared/EntryForm.svelte:253 => const addressed = entry === null ? '' : entry.id;
    // Revert: in save() of views/shared/EntryForm.svelte, add through addFromForm whatever the form
    // has already made, by dropping the entry it made from what the write is addressed to.
    const before = readHubFile(TASKS);
    try {
        await boot(page);
        await typeTask(page);
        await slowWrites(page);
        await page.getByRole('button', { name: t('collection.form_save') }).click();
        await addKindBox(page).fill('typed while the save was out');
        await expect.poll(() => readHubFile(TASKS), { timeout: 10000 }).toContain(TYPED);

        // The form is still open over the entry it made, and its next save writes that entry.
        await page.getByRole('button', { name: t('collection.form_save') }).click();
        await expect
            .poll(() => entriesTitled(TYPED).map((one) => one.kind), { timeout: 10000 })
            .toEqual(['typed while the save was out']);
    } finally {
        writeHubFile(TASKS, before);
    }
});

test('a second save from the add form that added an entry adds no second entry', async ({
    page
}) => {
    // revert: src/lib/views/shared/EntryForm.svelte:253 => const addressed = entry === null ? '' : entry.id;
    // Revert: in save() of views/shared/EntryForm.svelte, add through addFromForm whatever the form
    // has already made, which makes the second save a second add and the file refuse it.
    const before = readHubFile(TASKS);
    try {
        await boot(page);
        await typeTask(page);
        await slowWrites(page);
        await page.getByRole('button', { name: t('collection.form_save') }).click();
        await addKindBox(page).fill('a second save');
        await expect.poll(() => readHubFile(TASKS), { timeout: 10000 }).toContain(TYPED);
        await page.getByRole('button', { name: t('collection.form_save') }).click();

        // The file holds the one entry the form made, and the second save went into it rather than
        // being refused as another entry under the same title.
        await expect
            .poll(() => entriesTitled(TYPED).map((one) => one.kind), { timeout: 10000 })
            .toEqual(['a second save']);
        expect(entriesTitled(TYPED)).toHaveLength(1);
    } finally {
        writeHubFile(TASKS, before);
    }
});

test('the Save control is not pressable while its own save is out, and adds nothing twice', async ({
    page
}) => {
    // revert: src/lib/views/shared/EntryForm.svelte:218 => if (false) return;
    // Revert: in views/shared/EntryForm.svelte, drop `disabled={busy}` from the Save control and the
    // `if (busy) return;` at the top of save().
    const before = readHubFile(TASKS);
    let posts = 0;
    try {
        await boot(page);
        await typeTask(page);
        page.on('request', (request) => {
            if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/write') {
                posts += 1;
            }
        });
        await slowWrites(page);
        const save = page.getByRole('button', { name: t('collection.form_save') });
        await save.click();
        await expect(save).toBeDisabled();

        // A press the control refuses is dispatched at it anyway: the save itself turns it away.
        await save.dispatchEvent('click');
        await addKindBox(page).fill('typed while the save was out');
        await expect.poll(() => readHubFile(TASKS), { timeout: 10000 }).toContain(TYPED);
        await expect(save).toBeEnabled();
        expect(posts).toBe(1);
        expect(entriesTitled(TYPED)).toHaveLength(1);
    } finally {
        writeHubFile(TASKS, before);
    }
});

test('an add form whose tab was switched away before its answer still writes the entry it added', async ({
    page
}) => {
    // revert: src/lib/state/form-drafts.svelte.ts:279 => return null;
    // Revert: in formAdded of state/form-drafts.svelte.ts, answer that no form has made an entry,
    // which is what a form keeping it in the component comes to across a tab switch.
    const before = readHubFile(TASKS);
    try {
        await boot(page);
        await typeTask(page);
        await slowWrites(page);
        await page.getByRole('button', { name: t('collection.form_save') }).click();
        await addKindBox(page).fill('typed while the save was out');

        // Away and back before the answer lands: the component that drew the form is gone in
        // between, and what it made is the instance's.
        await switchAndBack(page, t('views.tasks'), page.locator('[data-form="add"]'));
        await expect.poll(() => readHubFile(TASKS), { timeout: 10000 }).toContain(TYPED);
        await expect(addKindBox(page)).toHaveValue('typed while the save was out');

        await page.getByRole('button', { name: t('collection.form_save') }).click();
        await expect
            .poll(() => entriesTitled(TYPED).map((one) => one.kind), { timeout: 10000 })
            .toEqual(['typed while the save was out']);
    } finally {
        writeHubFile(TASKS, before);
    }
});

test('an add form typed away from the entry it added adds another, it does not rename it', async ({
    page
}) => {
    // revert: src/lib/views/shared/EntryForm.svelte:253 => const addressed = entry === null ? (made?.id ?? '') : entry.id;
    // Revert: in save() of views/shared/EntryForm.svelte, write the entry the form made whatever
    // its identity field now says, which renames that entry instead of adding the one meant.
    const before = readHubFile(TASKS);
    const second = 'A second task the reader means to add';
    try {
        await boot(page);
        await typeTask(page);
        await slowWrites(page);
        await page.getByRole('button', { name: t('collection.form_save') }).click();
        await titleBox(page).fill(second);
        await expect.poll(() => readHubFile(TASKS), { timeout: 10000 }).toContain(TYPED);

        // The form is still the add form, over another title: the next save adds that entry.
        await expect(page.locator('[data-form="add"]')).toHaveCount(1);
        await page.getByRole('button', { name: t('collection.form_save') }).click();
        await expect.poll(() => entriesTitled(second).length, { timeout: 10000 }).toBe(1);
        expect(entriesTitled(TYPED)).toHaveLength(1);
    } finally {
        writeHubFile(TASKS, before);
    }
});

test("the Venues add form is kept across a tab switch, and its Add and a card's Edit toggles forget what was typed", async ({
    page
}) => {
    // Revert: Venues holding its add and edit forms' open state in the component, or its toggles
    // writing the open state without toggleAdd and toggleEdit.
    await boot(page);
    await openView(page, 'venues', t('views.venues'));
    await page.getByRole('button', { name: t('collection.add') }).click();
    const name = page
        .locator('[data-form="add"]')
        .getByRole('textbox', { name: 'name', exact: true });
    await name.fill('A venue typed and left unsaved');
    await page.getByRole('tab', { name: tabNamed(t('views.status')) }).click();
    await expect(name).toHaveCount(0);
    await page.getByRole('tab', { name: tabNamed(t('views.venues')) }).click();
    await expect(name).toHaveValue('A venue typed and left unsaved');

    await page.getByRole('button', { name: t('collection.add') }).click();
    await expect(page.locator('[data-form="add"]')).toHaveCount(0);
    expect(await draftKeys(page)).toEqual([]);

    const edits = page.getByRole('button', { name: t('collection.form_edit_title') });
    await edits.nth(0).click();
    await page
        .locator('[data-form="edit"]')
        .getByRole('textbox', { name: 'name', exact: true })
        .fill('A venue name typed into its card');
    expect(await draftKeys(page)).toHaveLength(1);
    await edits.nth(1).click();
    await expect(page.locator('[data-form="edit"]')).toHaveCount(1);
    expect(await draftKeys(page)).toEqual([]);
});

// Revert: drop the Files registerUnsaved line from state/context.ts.
test("a tab holding a file browser's typed root line asks before it closes, and an empty line does not", async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const close = closeOf(page, t('views.files'));
    const asked = page.getByRole('alertdialog');
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    const box = page.getByRole('textbox', { name: t('files.root_dir') });
    await box.fill('~/a-folder-typed-and-not-added');

    await close.click();
    await expect(asked).toBeVisible();
    await expect(asked).toContainText(t('ui.tab_close_dirty'));
    await asked.getByRole('button', { name: t('ui.confirm_cancel'), exact: true }).click();
    await expect(box).toHaveValue('~/a-folder-typed-and-not-added');

    await box.fill('');
    await close.click();
    await expect(asked).toHaveCount(0);
    await expect(page.getByRole('tab', { name: tabNamed(t('views.files')) })).toHaveCount(0);
});
