// Layer 4, browser test. The Files view's sections: their state kept across a tab switch, the
// workspace in force marked in the header menu, and a note opened, typed into, saved and deleted
// from its section.

import { expect, test, type Page } from '@playwright/test';
import { keepServedFiles, row, scratch } from '../helpers/files.ts';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
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

/** The opacity the controls box around one control is painted at. */
async function controlsOpacity(control: ReturnType<Page['locator']>): Promise<string> {
    return control.evaluate((el) => getComputedStyle(el.closest('.actions') ?? el).opacity);
}

// revert: src/lib/views/sources/files/sections/Notes.svelte:73 => delete
// revert: src/lib/views/sources/files/sections/Bookmarks.svelte:75 => delete
// revert: src/lib/ui/tree/TreeItem.svelte:229 => <span class="actions">{@render actions(inside ? 0 : -1)}</span>
test('the add controls on the Notes and Bookmarks heads are drawn whether or not the pointer is over them', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.mouse.move(0, 0);

    const addNote = page
        .locator('[data-fs-notes]')
        .getByRole('button', { name: t('files.add_note'), exact: true });
    const addMark = page
        .locator('[data-fs-bookmarks]')
        .getByRole('button', { name: t('files.add_bookmark'), exact: true });
    await expect(addNote).toBeVisible();
    await expect(addMark).toBeVisible();
    expect(await controlsOpacity(addNote)).toBe('1');
    expect(await controlsOpacity(addMark)).toBe('1');

    // A row's own controls keep their reveal: a root's line draws them only under the pointer.
    const rootControls = page.locator('[data-fs-row="hub:"] .actions').first();
    await expect(rootControls).toHaveCount(1);
    expect(await rootControls.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
    await page.locator('[data-fs-row="hub:"]').first().hover();
    await expect.poll(() => rootControls.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
});

/**
 * A scratch root that is a git repository of its own, ignoring `*.log`, holding one dotfile and one
 * ignored file beside the files every scratch root holds, added through the page's own control.
 */
async function toggleRoot(page: Page): Promise<{ dir: string; key: string }> {
    const dir = scratch();
    writeFileSync(join(dir, '.gitignore'), '*.log\n');
    writeFileSync(join(dir, '.hidden-note'), 'hidden\n');
    writeFileSync(join(dir, 'run.log'), 'ignored\n');
    const made = spawnSync('git', ['-C', dir, 'init', '--quiet'], { encoding: 'utf8' });
    expect(made.status, made.stderr).toBe(0);
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    await page.getByRole('textbox', { name: t('files.root_dir') }).fill(dir);
    await page.getByRole('button', { name: t('files.add'), exact: true }).click();
    const key = dir.split(sep).at(-1) ?? '';
    await expect(row(page, key)).toBeVisible();
    await row(page, key).click();
    await expect(row(page, key, 'tool.py')).toBeVisible();
    return { dir, key };
}

// revert: src/lib/views/sources/files/Files.svelte:274 => delete
test('the two header toggles list the hidden and the ignored files, each on its own query', async ({
    page
}) => {
    const asked: string[] = [];
    page.on('request', (request) => {
        if (request.url().includes('/api/fs?root=')) asked.push(request.url());
    });
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await toggleRoot(page);
    const dotfile = page.locator(`[data-fs-row="${key}:.hidden-note"]`);
    const logged = page.locator(`[data-fs-row="${key}:run.log"]`);
    // both toggles are off, so the tree lists neither the dotfile nor what git ignores
    await expect(dotfile).toHaveCount(0);
    // and the ignored file is left out the same way
    await expect(logged).toHaveCount(0);

    const hidden = page.getByRole('button', { name: t('files.show_hidden'), exact: true });
    await hidden.click();
    await expect(hidden).toHaveAttribute('aria-pressed', 'true');
    await expect(dotfile).toBeVisible();
    expect(asked.some((url) => url.includes(`root=${key}`) && url.includes('hidden=1'))).toBe(true);

    await page.getByRole('button', { name: t('files.show_ignored'), exact: true }).click();
    await expect(logged).toBeVisible();
    expect(asked.some((url) => url.includes(`root=${key}`) && url.includes('ignored=1'))).toBe(
        true
    );
});

// revert: src/lib/views/sources/files/tree/Controls.svelte:109 => delete
test('a toggle that is on is drawn filled, apart from one that is off', async ({ page }) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const hidden = page.getByRole('button', { name: t('files.show_hidden'), exact: true });
    const ignored = page.getByRole('button', { name: t('files.show_ignored'), exact: true });
    const fill = (button: typeof hidden) =>
        button.evaluate((element) => getComputedStyle(element).backgroundColor);
    const off = await fill(ignored);
    expect(await fill(hidden)).toBe(off);
    await hidden.click();
    await expect(hidden).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => fill(hidden)).not.toBe(off);
});

// revert: src/lib/views/sources/files/Files.svelte:273 => delete
test('flipping a toggle reads the open folders again, so a file made since shows', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { dir, key } = await toggleRoot(page);
    const hidden = page.getByRole('button', { name: t('files.show_hidden'), exact: true });
    await hidden.click();
    await expect(page.locator(`[data-fs-row="${key}:.hidden-note"]`)).toBeVisible();
    await hidden.click();
    await expect(hidden).toHaveAttribute('aria-pressed', 'false');

    writeFileSync(join(dir, '.made-since'), 'new\n');
    await hidden.click();
    await expect(page.locator(`[data-fs-row="${key}:.made-since"]`)).toBeVisible();
});

// revert: src/lib/views/sources/files/Files.svelte:232 => return heldEntries(root, path);
test('the filter looks through what the toggles list, so a hidden file is found once they show it', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await toggleRoot(page);
    await page.getByRole('button', { name: t('files.show_hidden'), exact: true }).click();
    const dotfile = page.locator(`[data-fs-row="${key}:.hidden-note"]`);
    await expect(dotfile).toBeVisible();
    await page.getByPlaceholder(t('files.filter')).fill('hidden-note');
    await expect(dotfile).toBeVisible();
});
