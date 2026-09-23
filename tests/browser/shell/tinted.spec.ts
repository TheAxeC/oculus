// Which of the two a view's box ends up painted at over a wallpaper. The box paints nothing unless
// the view asks for the tint, and the fraction it is then painted at arrives as a custom property
// on the root element, so the answer is a computed style and not something an audit of the CSS
// source can read: the source only says the box takes `--wall-panel` of `--panel`.

import { expect, test } from '@playwright/test';
import { SHOWN_VIEW, boot, openView, pickTheme } from '../helpers/rail.ts';
import { alphaOf } from '../helpers/style.ts';
import { t } from '../helpers/words.ts';

/** The alpha the box of one open view is painted at. */
async function boxAlpha(page: import('@playwright/test').Page, view: string): Promise<number> {
    const box = page.locator(`[data-pane][data-pane-view="${view}"] ${SHOWN_VIEW} .pane`).first();
    return alphaOf(await box.evaluate((el) => getComputedStyle(el).backgroundColor));
}

test('a view that draws its own text tints its box and a board leaves it clear', async ({
    page
}) => {
    await boot(page);
    await pickTheme(page, 'mocha');
    await expect(page.locator('.wallpaper')).toHaveCount(1);

    // The board draws cards, which are its one translucent layer, so its box stays out of the way.
    await openView(page, 'projects', t('views.projects'));
    await expect.poll(() => boxAlpha(page, 'projects')).toBe(0);

    // The session list draws its rows straight into the box, so the box carries the surface.
    await openView(page, 'session-list', t('sessions.rail_title'));
    await expect.poll(() => boxAlpha(page, 'session-list')).toBeGreaterThan(0);
    expect(await boxAlpha(page, 'session-list')).toBeLessThan(1);
});
