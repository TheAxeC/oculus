// The Search view against the served demo hub: a real query answered by the real binary, the hits
// drawn grouped by file, and a hit pressed opening that file in a source tab with its line in view.
//
// This is the one place the whole path runs at once: the page's own check, the token on the request,
// the process, the fold, the drawing, and the editor's scroll. The node suite has no document, so
// where the cursor ends up can only be read here.

import { expect, test } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

/** A word the demo hub's own manifests carry, in more than one file. */
const WORD = 'spectral';

test('a query over the hub answers hits grouped by file, and a hit opens the file at its line', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'search', t('views.search'));

    // One root, the hub, so the run stays inside the copy this layer serves.
    await page.getByRole('combobox', { name: t('search.root') }).selectOption('hub');
    const box = page.getByRole('searchbox', { name: t('search.placeholder') });
    await box.fill(WORD);
    await box.press('Enter');

    // The count line and the file the word is in.
    const count = page.locator('[data-search-count]');
    await expect(count).toContainText('hits in');
    const file = page.locator('[data-search-file^="hub:"]').first();
    await expect(file).toBeVisible();
    await expect(page.locator('.match').first()).toHaveText(WORD);

    // The hit says which line it is, and the tab that opens says the same line.
    const hit = page.locator('[data-search-hit]').first();
    const said = (await hit.getAttribute('data-search-hit')) ?? '';
    const line = said.split(':').at(-1) ?? '';
    expect(Number(line)).toBeGreaterThan(0);
    await hit.getByRole('button').first().click();

    const editor = page.locator('[data-source-editor]');
    await expect(editor).toBeVisible();
    await expect(editor).toHaveAttribute('data-source-line', line);

    // The cursor is on that line, which is where the editor put it once the draft had loaded.
    const area = editor.getByRole('textbox');
    await expect(area).not.toHaveValue('');
    const at = await area.evaluate((element) =>
        element instanceof HTMLTextAreaElement ? element.selectionStart : -1
    );
    const text = await area.inputValue();
    expect(text.slice(0, at).split('\n')).toHaveLength(Number(line));
});

test('a word the hub does not carry says so, and the empty query is refused without a run', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'search', t('views.search'));

    await page.getByRole('combobox', { name: t('search.root') }).selectOption('hub');
    const box = page.getByRole('searchbox', { name: t('search.placeholder') });
    await box.fill('zzqqxxnothinghere');
    await box.press('Enter');
    await expect(page.getByText(t('search.none'))).toBeVisible();

    await box.fill('');
    await box.press('Enter');
    await expect(page.getByText(t('search.refused_empty'))).toBeVisible();
});

test('the slash key puts the cursor back in the query box from the results', async ({ page }) => {
    await boot(page);
    await openView(page, 'search', t('views.search'));

    await page.getByRole('combobox', { name: t('search.root') }).selectOption('hub');
    const box = page.getByRole('searchbox', { name: t('search.placeholder') });
    await box.fill(WORD);
    await box.press('Enter');
    await expect(page.locator('[data-search-hit]').first()).toBeVisible();

    // Focus is on a result row, so the key is not a character being typed.
    await page.locator('[data-search-hit]').first().getByRole('button').first().focus();
    await page.keyboard.press('/');
    await expect(box).toBeFocused();
});
