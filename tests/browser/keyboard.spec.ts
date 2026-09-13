// The keyboard bindings of shell/keys.ts in a real page: a digit opens a rail view, Tab cycles to
// the next one, `?` opens and closes the sheet, `/` focuses the board's search, the card cursor
// moves with j and k and Enter opens the card, and `g g` and `G` scroll the pane.
//
// Nothing here writes to the hub. The layout lives in the browser's own storage.

import { expect, test, type Page } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

/** Press a key with nothing focused in a field: the strip's ground takes the focus first. */
async function press(page: Page, key: string): Promise<void> {
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press(key);
}

test('digits and Tab open rail views, ? toggles the sheet', async ({ page }) => {
    await boot(page);
    await press(page, '2');
    await expect(page.getByRole('tab', { name: t('views.projects') })).toBeVisible();

    await press(page, 'Tab');
    await expect(page.getByRole('tab', { name: t('views.coauthor') })).toBeVisible();

    await press(page, '?');
    const sheet = page.getByRole('dialog', { name: t('js.keys.title') });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText(t('js.keys.hint'))).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
});

test('the card cursor, the search key and the scroll keys act on the focused pane', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    await pane.locator('[data-card]').first().waitFor();

    await press(page, 'k');
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(1);
    const first = await pane.locator('[data-card][data-cursor]').getAttribute('data-card');
    await page.keyboard.press('k');
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(0);
    expect(first).not.toBeNull();

    await press(page, '/');
    await expect(pane.locator('[data-search]')).toBeFocused();
    await page.keyboard.press('Escape');

    const scroller = pane.locator('[data-scroll]').first();
    await press(page, 'G');
    await expect.poll(() => scroller.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press('g');
    await page.keyboard.press('g');
    await expect.poll(() => scroller.evaluate((node) => node.scrollTop)).toBe(0);
});
