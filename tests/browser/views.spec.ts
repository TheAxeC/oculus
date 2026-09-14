// Four behaviours of the views that only a rendered page holds: a tooltip closing when an overlay
// takes focus, the two places a long value meets the edge of its card, and which of an intro's two
// paths filters the markup it is given.
//
// The unit suite reads all four off the source, because a cut is a layout effect no server render
// measures and DOMPurify has no document in node. What is measured here is the box the reader ends
// up with and the elements Chrome kept.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { shortOf } from './hub.ts';
import { t } from './words.ts';

const BANDITS = 'projects/active/graph-bandits';

/** The demo's long values, each the head of one, which is what makes the cut measurable. */
const LONG_PROGRAM = 'Graph learning over evolving';
const LONG_PROJECT = 'Sketched tensor decompositions';

/** Whether an element's own text is wider than the box it is drawn in, which is the cut itself. */
async function clipped(target: Locator): Promise<boolean> {
    return target.evaluate((el) => el.scrollWidth > el.clientWidth);
}

/** Whether the first box ends inside the second, which is the card it may not run past. */
async function within(inner: Locator, outer: Locator): Promise<boolean> {
    const one = await inner.boundingBox();
    const two = await outer.boundingBox();
    expect(one).not.toBeNull();
    expect(two).not.toBeNull();
    if (one === null || two === null) return false;
    return one.x >= two.x - 1 && one.x + one.width <= two.x + two.width + 1;
}

/** Open a view and hand back the card of one project on the board. */
async function projectCard(page: Page): Promise<Locator> {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const card = page
        .locator('.card')
        .filter({ hasText: shortOf(BANDITS) })
        .first();
    await expect(card).toBeVisible();
    return card;
}

test('a tooltip on a hovered control closes when the palette takes the focus', async ({ page }) => {
    await boot(page);
    const button = page.locator('nav button[data-view]').first();
    await button.hover();
    const bubble = page.locator('span.bubble:not([hidden])');
    await expect(bubble).toHaveCount(1);

    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog', { name: t('app.search') })).toBeVisible();
    await expect(bubble).toHaveCount(0);
});

test('a long chip value ends in an ellipsis inside its card', async ({ page }) => {
    const card = await projectCard(page);
    const label = card.locator('.chip .label').filter({ hasText: LONG_PROGRAM }).first();
    await expect(label).toBeVisible();

    expect(await clipped(label)).toBe(true);
    expect(await within(label, card)).toBe(true);
    expect(await label.evaluate((el) => getComputedStyle(el).textOverflow)).toBe('ellipsis');
});

// A cross-link group is the width of its card, and a domain card is the width of the pane, so the
// long title is measured in a window a reader can have rather than in one no title is long enough
// for.
test.describe('in a narrow window', () => {
    test.use({ viewport: { width: 420, height: 900 } });

    test('a long cross-link title ends in an ellipsis inside its card', async ({ page }) => {
        await boot(page);
        await openView(page, 'domains', t('views.domains'));
        const card = page.locator('[data-domain="method"]').first();
        await expect(card).toBeVisible();

        // The groups are closed until they are asked for, and which group holds an idea is the
        // view's business rather than this spec's, so every group of the card is opened.
        const groups = card.locator('button.disclosure');
        const many = await groups.count();
        for (let at = 0; at < many; at += 1) await groups.nth(at).click();

        const label = card.locator('.member .label').filter({ hasText: LONG_PROJECT }).first();
        await expect(label).toBeVisible();
        expect(await label.evaluate((el) => getComputedStyle(el).textOverflow)).toBe('ellipsis');
        expect(await clipped(label)).toBe(true);
        expect(await within(label, card)).toBe(true);
    });
});

test('an intro filters a hub value and draws a catalog line as it is written', async ({ page }) => {
    const alerts: string[] = [];
    page.on('dialog', (dialog) => {
        alerts.push(dialog.message());
        void dialog.dismiss();
    });
    await boot(page);

    await openView(page, 'tasks', t('views.tasks'));
    const hubIntro = page.locator('.intro').first();
    await expect(hubIntro).toBeVisible();
    await expect(hubIntro).toContainText('Standing tasks');
    await expect(hubIntro.locator('script')).toHaveCount(0);
    await expect(hubIntro).not.toContainText('alert(1)');

    await openView(page, 'domains', t('views.domains'));
    const catalogIntro = page.locator('.intro').first();
    await expect(catalogIntro.locator('b').first()).toHaveText('application domain');
    expect(alerts).toEqual([]);
});
