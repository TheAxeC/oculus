// The text size at the rail's foot: larger grows every token the page is set in, reset restores
// the default. The size is a computed style, which is what a unit test over the CSS source cannot
// see: the tokens are declared on :root, so a scale set anywhere below would leave them as they are.
//
// The wallpaper is the same kind of fact: the rules are declared per component and the percentage
// arrives as a custom property on the root element, so what a surface actually ends up painted with
// is only readable from a rendered page.

import { expect, test } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

/** The alpha of a computed colour, in either the comma form or the slash form a browser may return. */
function alphaOf(colour: string): number {
    const slash = colour.match(/\/\s*([\d.]+)(%?)\s*\)/);
    if (slash !== null) {
        return slash[2] === '%' ? Number.parseFloat(slash[1]) / 100 : Number.parseFloat(slash[1]);
    }
    const comma = colour.match(/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/);
    return comma === null ? 1 : Number.parseFloat(comma[1]);
}

/** The alpha a locator's background is painted at. */
async function backgroundAlpha(target: import('@playwright/test').Locator): Promise<number> {
    return alphaOf(await target.evaluate((el) => getComputedStyle(el).backgroundColor));
}

/** The font size a page tab is drawn at, in px. */
async function tabSize(page: import('@playwright/test').Page): Promise<number> {
    const tab = page
        .getByRole('region', { name: t('ui.pages') })
        .getByRole('tab')
        .first();
    return tab.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
}

test('larger text grows a page tab and reset restores it', async ({ page }) => {
    await boot(page);
    const before = await tabSize(page);
    await page.getByRole('button', { name: t('app.text_larger') }).click();
    await page.getByRole('button', { name: t('app.text_larger') }).click();
    await expect.poll(() => tabSize(page)).toBeGreaterThan(before * 1.15);
    await page.getByRole('button', { name: t('app.text_reset') }).click();
    await expect.poll(() => tabSize(page)).toBeCloseTo(before, 1);
});

test('a wallpaper theme paints the cards through and the toggle takes it away', async ({
    page
}) => {
    await boot(page);
    await page.getByRole('button', { name: t('ui.theme') }).click();
    await page.getByRole('menuitem', { name: /mocha/ }).click();
    await openView(page, 'projects', t('views.projects'));

    const layer = page.locator('.wallpaper');
    const card = page.locator('.board .cards .card').first();
    const shellBox = page.locator('[data-pane]').first();
    const viewBox = page.locator('[data-pane] .pane').first();
    await expect(layer).toHaveCount(1);
    await expect.poll(() => backgroundAlpha(card)).toBeLessThan(1);
    // Neither box paints, so a card is the one translucent layer between the reader and the picture
    // rather than the third of three.
    expect(await backgroundAlpha(shellBox)).toBe(0);
    expect(await backgroundAlpha(viewBox)).toBe(0);

    await page.getByRole('button', { name: t('ui.wallpaper') }).click();
    await expect(layer).toHaveCount(0);
    await expect.poll(() => backgroundAlpha(card)).toBe(1);
});
