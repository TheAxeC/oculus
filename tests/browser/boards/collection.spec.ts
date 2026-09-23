// One collection file as its own tab, over tasks/tasks.yml: the add form, the edit form, the drag
// that reorders the file, the subtask line, and the delete behind its confirm.
//
// views/boards/collection/EntryCard.svelte arms its drag on the grip (line 152) and takes it with
// `ondrop` (line 138), which are HTML5 drag events; a pointer that only moves fires neither. The
// keyboard path to the same reorder is the shifted cursor key of shell/keys/keys.ts, which carries
// the card under the cursor rather than the cursor.
//
// The titles and the statuses are read out of the served file rather than typed here: the file is
// the fixture, and an entry renamed in demo/ should cost these tests nothing.
//
// Every test writes to the temporary copy of demo/ and puts the file back before it ends.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { readHubFile, readHubYaml } from '../helpers/hub.ts';
import { boot, openView } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';

const TASKS = 'tasks/tasks.yml';

/** What the add test types as the entry's title, which is the field tasks.yml is addressed by. */
const ADDED = 'Probe the collection form';

/** The entries of the served file, in the order the file holds them. */
function entries(): Record<string, unknown>[] {
    const held = readHubYaml(TASKS).entries;
    if (!Array.isArray(held)) throw new Error(`${TASKS}: no entries`);
    return held as Record<string, unknown>[];
}

/** The title of the entry at one position of the file. */
function titleAt(at: number): string {
    return String(entries()[at].title);
}

async function openTasks(page: Page): Promise<void> {
    await boot(page);
    await openView(page, 'tasks', t('views.tasks'));
}

/** The card of one entry, by the title it carries. */
function card(page: Page, title: string): Locator {
    return page.locator('.cards [data-entry]').filter({ hasText: title });
}

test('the add form writes a block and the delete behind the confirm takes it away', async ({
    page
}) => {
    const before = readHubFile(TASKS);
    // the file carries no such entry before the form writes one
    expect(before).not.toContain(ADDED);
    await openTasks(page);

    await page.getByRole('button', { name: t('collection.add') }).click();
    await page.getByRole('textbox', { name: 'title', exact: true }).fill(ADDED);
    await page.getByRole('button', { name: t('collection.form_save'), exact: true }).click();
    await expect.poll(() => readHubFile(TASKS), { timeout: 5000 }).toContain(ADDED);
    await expect(card(page, ADDED)).toHaveCount(1);

    // Cancel leaves the block where it is.
    await card(page, ADDED)
        .getByRole('button', { name: t('collection.edit_delete') })
        .click();
    await page.getByRole('button', { name: t('collection.form_delete'), exact: true }).click();
    await page
        .getByRole('alertdialog')
        .getByRole('button', { name: t('collection.form_cancel'), exact: true })
        .click();
    expect(readHubFile(TASKS)).toContain(ADDED);

    await page.getByRole('button', { name: t('collection.form_delete'), exact: true }).click();
    await page
        .getByRole('alertdialog')
        .getByRole('button', { name: t('collection.form_delete'), exact: true })
        .click();
    await expect.poll(() => readHubFile(TASKS), { timeout: 5000 }).toBe(before);
    // the confirm deleted the entry, so its card is gone
    await expect(card(page, ADDED)).toHaveCount(0);
});

test('the edit form changes a status and the chip follows', async ({ page }) => {
    const before = readHubFile(TASKS);
    const title = titleAt(0);
    const held = String(entries()[0].status);
    await openTasks(page);

    const one = card(page, title);
    await expect(one.getByText(held, { exact: true })).toBeVisible();

    await one.getByRole('button', { name: t('collection.edit_delete') }).click();
    await page.getByRole('combobox', { name: 'status', exact: true }).selectOption('done');
    await page.getByRole('button', { name: t('collection.form_save'), exact: true }).click();
    await expect.poll(() => readHubFile(TASKS), { timeout: 5000 }).toContain('status: done');
    await expect(one.getByText('done', { exact: true })).toBeVisible();

    await one.getByRole('button', { name: t('collection.edit_delete') }).click();
    await page.getByRole('combobox', { name: 'status', exact: true }).selectOption(held);
    await page.getByRole('button', { name: t('collection.form_save'), exact: true }).click();
    await expect.poll(() => readHubFile(TASKS), { timeout: 5000 }).toBe(before);
});

test('a card dragged onto another reorders the file', async ({ page }) => {
    const before = readHubFile(TASKS);
    const head = titleAt(0);
    const moved = titleAt(2);
    await openTasks(page);

    const first = page.locator('.cards [data-entry]').first();
    await expect(first).toContainText(head);

    // The card is dragged by its grip and by nothing else: the grip arms it on mousedown.
    await card(page, moved).locator('.grip').dragTo(first);
    await expect
        .poll(
            () => {
                const text = readHubFile(TASKS);
                return text.indexOf(moved) < text.indexOf(head);
            },
            { timeout: 5000 }
        )
        .toBe(true);
    await expect(page.locator('.cards [data-entry]').first()).toContainText(moved);

    await card(page, moved)
        .locator('.grip')
        .dragTo(card(page, titleAt(2)));
    await expect.poll(() => readHubFile(TASKS), { timeout: 5000 }).toBe(before);
});

test('+ subtask adds a line and done ticks it', async ({ page }) => {
    const before = readHubFile(TASKS);
    const line = 'chase the second reviewer';
    const title = titleAt(1);
    await openTasks(page);

    const one = card(page, title);
    await one.getByRole('button', { name: t('project.action.add_subtask') }).click();
    await one.getByRole('textbox', { name: t('project.action.subtask_do') }).fill(line);
    await one.getByRole('button', { name: t('project.action.subtask_save'), exact: true }).click();
    await expect.poll(() => readHubFile(TASKS), { timeout: 5000 }).toContain(line);
    await expect(one.getByText(line)).toBeVisible();

    await one
        .locator('.line')
        .filter({ hasText: line })
        .getByRole('button', { name: t('project.action.done'), exact: true })
        .click();
    await expect.poll(() => /done:\s*true/.test(readHubFile(TASKS)), { timeout: 5000 }).toBe(true);
    await expect(one.locator('.line.done').filter({ hasText: line })).toHaveCount(1);

    await one
        .locator('.line')
        .filter({ hasText: line })
        .getByRole('button', { name: t('project.action.del'), exact: true })
        .click();
    await expect.poll(() => readHubFile(TASKS), { timeout: 5000 }).toBe(before);
});

test('the cursor carries an entry with K and the file follows', async ({ page }) => {
    const before = readHubFile(TASKS);
    const head = titleAt(0);
    const second = titleAt(1);
    await openTasks(page);
    const pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.tasks') })
    });
    await pane.locator('[data-card]').first().waitFor();

    // The pane takes the keys by being pointed at, which no element can intercept.
    await pane.dispatchEvent('pointerdown');
    await page.keyboard.press('k');
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(1);
    await page.keyboard.press('K');

    await expect
        .poll(
            () => {
                const text = readHubFile(TASKS);
                return text.indexOf(second) < text.indexOf(head);
            },
            { timeout: 5000 }
        )
        .toBe(true);
    await expect(page.locator('.cards [data-entry]').first()).toContainText(second);

    await page.keyboard.press('J');
    await expect.poll(() => readHubFile(TASKS), { timeout: 5000 }).toBe(before);
});
