// The tab strip of ui/Tabs.svelte when it overflows: the two scroll controls appear only then, each
// click moves the strip by one tab's width, the wheel over the strip scrolls it sideways, and the tab
// that becomes active is scrolled into view. A narrow window makes seven tabs overflow.
//
// Nothing here writes to the hub; the layout lives in the browser's own storage.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

test.use({ viewport: { width: 720, height: 640 } });

/** The main area's tab strip: the tablist holding the Status tab, and the strip around it. */
function mainStrip(page: Page): { list: Locator; strip: Locator } {
    const list = page.locator('[role="tablist"]', {
        has: page.getByRole('tab', { name: t('views.status') })
    });
    return { list, strip: list.locator('xpath=..') };
}

async function scrollLeft(list: Locator): Promise<number> {
    return list.evaluate((node) => node.scrollLeft);
}

test('the scroll controls appear on overflow, move by one tab, and follow the active tab', async ({
    page
}) => {
    await boot(page);
    const { list, strip } = mainStrip(page);
    const left = strip.getByRole('button', { name: t('ui.tabs_scroll_left') });
    const right = strip.getByRole('button', { name: t('ui.tabs_scroll_right') });
    await expect(left).toBeHidden();
    await expect(right).toBeHidden();

    for (const view of ['focus', 'projects', 'coauthor', 'archive', 'programs', 'domains']) {
        await openView(page, view, t(`views.${view}`));
    }
    await expect(left).toBeVisible();
    await expect(right).toBeVisible();

    // The last opened tab is active and was scrolled into view, so the strip is not at its start.
    await expect.poll(() => scrollLeft(list)).toBeGreaterThan(0);
    await expect(right).toBeDisabled();
    await expect(left).toBeEnabled();

    const before = await scrollLeft(list);
    const width = (await list.locator('.tab').first().boundingBox())?.width ?? 0;
    expect(width).toBeGreaterThan(0);
    await left.click();
    await expect.poll(() => scrollLeft(list)).toBeLessThan(before);
    await expect
        .poll(async () => Math.abs(before - (await scrollLeft(list)) - width))
        .toBeLessThan(6);

    const beforeWheel = await scrollLeft(list);
    const box = await list.boundingBox();
    expect(box).not.toBeNull();
    if (box === null) return;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => scrollLeft(list)).toBeGreaterThan(beforeWheel);

    // Activating the first tab scrolls it into view: the strip returns to its start.
    await page.getByRole('tab', { name: t('views.status') }).click();
    await expect.poll(() => scrollLeft(list)).toBe(0);
    await expect(left).toBeDisabled();
});
