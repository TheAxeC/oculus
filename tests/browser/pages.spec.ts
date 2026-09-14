// The page strip of shell/PageStrip.svelte: its menu makes a page and renames one, the digits 1 to 9
// reach the first nine, and closing a page that holds more than one tab asks first.
//
// Nothing here writes to the hub. The layout lives in the browser's own storage, and Playwright gives
// every test a context of its own, so each test starts from the one default page.

import { expect, test } from '@playwright/test';
import { openView } from './rail.ts';
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
    // The box is typed into the moment it appears, so it carries the focus without being clicked.
    const box = strip.getByRole('textbox', { name: t('ui.page_rename_label') });
    await expect(box).toBeFocused();
    await box.fill('Renamed');
    await box.press('Enter');
    await expect(strip.getByRole('tab', { name: 'Renamed' })).toBeVisible();
    await expect(strip.getByRole('tab', { name: t('ui.page_default', 2) })).toHaveCount(0);
});

test('2 shows the second page and 1 the first', async ({ page }) => {
    await page.goto('/');
    const strip = page.getByRole('region', { name: t('ui.pages') });
    await strip.getByRole('button', { name: t('ui.page_menu') }).click();
    await page.getByRole('menuitem', { name: t('ui.page_new') }).click();

    const first = strip.getByRole('tab', { name: t('ui.page_default', 1) });
    const second = strip.getByRole('tab', { name: t('ui.page_default', 2) });
    await expect(second).toHaveAttribute('aria-selected', 'true');

    // The digits act on the strip's own tab as much as anywhere else, as long as no box is typed in.
    await second.click();
    await page.keyboard.press('1');
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await expect(second).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('2');
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(first).toHaveAttribute('aria-selected', 'false');
});

test('dragging the second page before the first saves their order', async ({ page }) => {
    await page.goto('/');
    const strip = page.getByRole('region', { name: t('ui.pages') });
    await strip.getByRole('button', { name: t('ui.page_menu') }).click();
    await page.getByRole('menuitem', { name: t('ui.page_new') }).click();

    const first = strip.getByRole('tab', { name: t('ui.page_default', 1) });
    const second = strip.getByRole('tab', { name: t('ui.page_default', 2) });
    const firstBox = await first.boundingBox();
    const secondBox = await second.boundingBox();
    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();
    if (firstBox === null || secondBox === null) return;

    await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(firstBox.x + 1, firstBox.y + firstBox.height / 2, { steps: 5 });
    await expect(strip.locator('span.mark')).toHaveCount(1);
    await page.mouse.up();

    await expect(strip.getByRole('tab').first()).toHaveAccessibleName(t('ui.page_default', 2));
    await page.reload();
    await expect(strip.getByRole('tab').first()).toHaveAccessibleName(t('ui.page_default', 2));
});

test('Ctrl+Shift+Left and Right move the focused page and save its position', async ({ page }) => {
    await page.goto('/');
    const strip = page.getByRole('region', { name: t('ui.pages') });
    await strip.getByRole('button', { name: t('ui.page_menu') }).click();
    await page.getByRole('menuitem', { name: t('ui.page_new') }).click();

    const second = strip.getByRole('tab', { name: t('ui.page_default', 2) });
    await second.focus();
    await second.press('Control+Shift+ArrowLeft');
    await expect(strip.getByRole('tab').first()).toHaveAccessibleName(t('ui.page_default', 2));

    await page.reload();
    await expect(strip.getByRole('tab').first()).toHaveAccessibleName(t('ui.page_default', 2));

    await strip.getByRole('tab', { name: t('ui.page_default', 2) }).focus();
    await page.keyboard.press('Control+Shift+ArrowRight');
    await expect(strip.getByRole('tab').first()).toHaveAccessibleName(t('ui.page_default', 1));
    await page.reload();
    await expect(strip.getByRole('tab').first()).toHaveAccessibleName(t('ui.page_default', 1));
});

test('closing a page asks first: cancel keeps it, confirm removes it', async ({ page }) => {
    await page.goto('/');
    const strip = page.getByRole('region', { name: t('ui.pages') });
    await strip.getByRole('button', { name: t('ui.page_menu') }).click();
    await page.getByRole('menuitem', { name: t('ui.page_new') }).click();
    await expect(strip.getByRole('tab')).toHaveCount(2);

    // A new page holds one tab, the Status view, and its panel is empty; a second view opened into
    // it makes two, so the close asks.
    await openView(page, 'focus', t('views.focus'));
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
