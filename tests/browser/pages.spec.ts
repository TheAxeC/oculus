// The page strip of shell/PageStrip.svelte: its menu makes a page and renames one, Ctrl+1 to Ctrl+9
// reach the first nine, and closing a page that holds more than one tab asks first.
//
// Nothing here writes to the hub. The layout lives in the browser's own storage, and Playwright gives
// every test a context of its own, so each test starts from the one default page.

import { expect, test } from '@playwright/test';
import { t } from './words.ts';

test('the menu adds a page and renames it', async ({ page }) => {
    await page.goto('/');
    const strip = page.getByRole('region', { name: t('ui.pages') });
    await expect(strip.getByRole('tab')).toHaveCount(1);

    await strip.getByRole('button', { name: t('ui.page_menu') }).click();
    await page.getByRole('menuitem', { name: t('ui.page_new') }).click();
    await expect(strip.getByRole('tab')).toHaveCount(2);
    await expect(strip.getByRole('tab', { name: t('ui.page_default', 2) })).toBeVisible();

    await strip.getByRole('button', { name: t('ui.page_menu') }).click();
    await page.getByRole('menuitem', { name: t('ui.page_rename') }).click();
    const box = strip.getByRole('textbox', { name: t('ui.page_rename_label') });
    await box.fill('Renamed');
    await box.press('Enter');
    await expect(strip.getByRole('tab', { name: 'Renamed' })).toBeVisible();
    await expect(strip.getByRole('tab', { name: t('ui.page_default', 2) })).toHaveCount(0);
});

test('Ctrl+2 shows the second page and Ctrl+1 the first', async ({ page }) => {
    await page.goto('/');
    const strip = page.getByRole('region', { name: t('ui.pages') });
    await strip.getByRole('button', { name: t('ui.page_menu') }).click();
    await page.getByRole('menuitem', { name: t('ui.page_new') }).click();

    const first = strip.getByRole('tab', { name: t('ui.page_default', 1) });
    const second = strip.getByRole('tab', { name: t('ui.page_default', 2) });
    await expect(second).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('Control+1');
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await expect(second).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('Control+2');
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(first).toHaveAttribute('aria-selected', 'false');
});

test('closing a page asks first: cancel keeps it, confirm removes it', async ({ page }) => {
    await page.goto('/');
    const strip = page.getByRole('region', { name: t('ui.pages') });
    await strip.getByRole('button', { name: t('ui.page_menu') }).click();
    await page.getByRole('menuitem', { name: t('ui.page_new') }).click();
    await expect(strip.getByRole('tab')).toHaveCount(2);

    // The default workbench holds two tabs, the main area's and the panel's, so the close asks.
    await strip.getByRole('tab', { name: t('ui.page_default', 2) }).hover();
    await strip
        .getByRole('button', { name: t('ui.close_tab') })
        .last()
        .click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: t('ui.confirm_cancel') }).click();
    await expect(dialog).toHaveCount(0);
    await expect(strip.getByRole('tab')).toHaveCount(2);

    await strip.getByRole('tab', { name: t('ui.page_default', 2) }).hover();
    await strip
        .getByRole('button', { name: t('ui.close_tab') })
        .last()
        .click();
    await page
        .getByRole('alertdialog')
        .getByRole('button', { name: t('ui.confirm_ok') })
        .click();
    await expect(strip.getByRole('tab')).toHaveCount(1);
    await expect(strip.getByRole('tab', { name: t('ui.page_default', 1) })).toBeVisible();
});
