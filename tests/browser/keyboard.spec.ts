// The keyboard bindings of shell/keys.ts in a real page: `v` and a digit open a rail view, Ctrl and
// a digit activate a tab of the focused pane, Tab cycles to the next view, `?` opens and closes the
// sheet, `/` focuses the board's search, the card cursor moves with j and k and Enter opens the
// card, and `g g` and `G` scroll the pane.
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

test('the direct chord and Tab open rail views, ? toggles the sheet', async ({ page }) => {
    await boot(page);
    await press(page, 'v');
    await page.keyboard.press('2');
    await expect(page.getByRole('tab', { name: t('views.projects') })).toBeVisible();

    await press(page, 'Tab');
    await expect(page.getByRole('tab', { name: t('views.coauthor') })).toBeVisible();

    await press(page, '?');
    const sheet = page.getByRole('dialog', { name: t('app.keys.title') });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText(t('app.keys.hint'))).toBeVisible();
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

    const visible = pane.locator('[data-card]:visible');
    const firstId = await visible.nth(0).getAttribute('data-card');
    const secondId = await visible.nth(1).getAttribute('data-card');
    await press(page, 'k');
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(1);
    expect(await pane.locator('[data-card][data-cursor]').getAttribute('data-card')).toBe(firstId);
    await page.keyboard.press('k');
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(1);
    expect(await pane.locator('[data-card][data-cursor]').getAttribute('data-card')).toBe(secondId);
    await page.keyboard.press('Escape');
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(0);
    expect(firstId).not.toBeNull();
    expect(secondId).not.toBeNull();

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

test('a pointer press keeps the cursor in one pane and clears it on a pane change', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    let pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    await pane.locator('[data-card]').first().waitFor();
    await pane.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('ui.split_right'), exact: true }).click();

    pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    const other = page.locator('[data-pane]').filter({
        hasNot: page.getByRole('tab', { name: t('views.projects') })
    });
    await pane.dispatchEvent('pointerdown');
    await page.keyboard.press('k');
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(1);

    await pane.dispatchEvent('pointerdown');
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(1);

    await other.dispatchEvent('pointerdown');
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(0);
});

test('Ctrl and a digit activate the numbered tab of the focused pane', async ({ page }) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    const status = pane.getByRole('tab', { name: t('views.status') });
    const projects = pane.getByRole('tab', { name: t('views.projects') });
    await expect(projects).toHaveAttribute('aria-selected', 'true');
    const opened = await pane.getAttribute('data-pane-active');
    expect(opened).not.toBeNull();

    await page.keyboard.press('Control+1');
    await expect(status).toHaveAttribute('aria-selected', 'true');
    await expect(projects).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('Control+2');
    await expect(projects).toHaveAttribute('aria-selected', 'true');
    await expect(pane).toHaveAttribute('data-pane-active', String(opened));

    // A digit past the pane's last tab leaves the tab it has.
    await page.keyboard.press('Control+9');
    await expect(projects).toHaveAttribute('aria-selected', 'true');
    await expect(pane).toHaveAttribute('data-pane-active', String(opened));

    await press(page, 'v');
    await page.keyboard.press('1');
    await expect(pane.getByRole('tab', { name: t('views.focus') })).toHaveAttribute(
        'aria-selected',
        'true'
    );
});
