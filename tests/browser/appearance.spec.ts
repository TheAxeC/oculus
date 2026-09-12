// The text size at the rail's foot: larger grows every token the page is set in, reset restores
// the default. The size is a computed style, which is what a unit test over the CSS source cannot
// see: the tokens are declared on :root, so a scale set anywhere below would leave them as they are.

import { expect, test } from '@playwright/test';
import { boot } from './rail.ts';
import { t } from './words.ts';

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
