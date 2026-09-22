// Layer 4, browser test. The Files view's sections: their state kept across a tab switch, the
// workspace in force marked in the header menu, and a note opened, typed into, saved and deleted
// from its section.

import { expect, test, type Page } from '@playwright/test';
import { keepServedFiles } from '../helpers/files.ts';
import { boot, openView } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';

keepServedFiles();

// Revert: open the Notes section whatever `view.collapsed` holds, in
// views/sources/files/Files.svelte.
test('a section closed from its head stays closed after a tab switch', async ({ page }) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));

    const head = page.locator('[data-fs-notes] [role="treeitem"]').first();
    await expect(head).toHaveAttribute('aria-expanded', 'true');
    await head.getByRole('button', { name: t('files.notes'), exact: true }).click();
    await expect(head).toHaveAttribute('aria-expanded', 'false');
    // a closed section draws its heading alone
    await expect(page.locator('[data-fs-notes] [role="group"]')).toHaveCount(0);

    await openView(page, 'repositories', t('views.repositories'));
    await page.getByRole('tab', { name: t('views.files') }).click();
    await expect(head).toHaveAttribute('aria-expanded', 'false');

    await head.getByRole('button', { name: t('files.notes'), exact: true }).click();
    await expect(head).toHaveAttribute('aria-expanded', 'true');
});

// Revert: set `active: false` on every choice in views/sources/files/tree/Controls.svelte.
test('the workspace menu on the header lists the configured roots, drawn as in force', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.getByRole('button', { name: t('files.workspace'), exact: true }).click();
    const choice = page.getByRole('menuitem', { name: t('files.workspace_default'), exact: true });
    await expect(choice).toBeVisible();
    await expect(choice).toHaveAttribute('aria-current', 'true');
    await choice.click();
    await expect(page.locator('[data-fs-workspace=""] [role="treeitem"]')).toHaveAttribute(
        'aria-current',
        'true'
    );
});

test('a note is opened from its section, typed into, saved on its own, and deleted', async ({
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
    // the confirm deleted the note, so the section lists none
    await expect(page.locator('[data-fs-note]')).toHaveCount(0);
    // the removal takes the note's own tab with it rather than leaving a tab over a file that is
    // gone
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

    // nothing was typed, so no file was made and there is no note to list
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
