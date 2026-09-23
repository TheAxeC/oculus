// The behaviours of the views that only a rendered page holds: a tooltip closing when an overlay
// takes focus, the two places a long value meets the edge of its card, which of an intro's two
// paths filters the markup it is given, and where a tree row's controls sit in a wide pane.
//
// The unit suite reads them off the source, because a cut and a box are layout effects no server
// render measures and DOMPurify has no document in node. What is measured here is the box the
// reader ends up with and the elements Chrome kept.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { SHOWN_VIEW, boot, openView } from '../helpers/rail.ts';
import { shortOf } from '../helpers/hub.ts';
import { t } from '../helpers/words.ts';

const BANDITS = 'projects/active/graph-bandits';

/** The demo's long values, each the head of one, which is what makes the cut measurable. */
const LONG_PILLAR = 'Graph learning over evolving';
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
    // the palette took the focus, and the bubble belongs to the control the pointer is on
    await expect(bubble).toHaveCount(0);
});

test('a tooltip describes the control it wraps, and not the wrapper around it', async ({
    page
}) => {
    await boot(page);
    const button = page.locator('nav button[data-view]').first();
    const id = await button.getAttribute('aria-describedby');
    expect(id).toMatch(/^tip-\d+$/);
    await expect(page.locator(`#${id}`)).toHaveAttribute('role', 'tooltip');
    expect(await page.locator('span.tip[aria-describedby]').count()).toBe(0);
});

test('a long tag value ends in an ellipsis inside its card', async ({ page }) => {
    const card = await projectCard(page);
    const label = card.locator('.tag .label').filter({ hasText: LONG_PILLAR }).first();
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
    const hubIntro = page.locator(`${SHOWN_VIEW} .intro`).first();
    await expect(hubIntro).toBeVisible();
    await expect(hubIntro).toContainText('Standing tasks');
    // the intro is markup from the hub file, so the filter takes the script out of it
    await expect(hubIntro.locator('script')).toHaveCount(0);
    await expect(hubIntro).not.toContainText('alert(1)');

    await openView(page, 'domains', t('views.domains'));
    const catalogIntro = page.locator(`${SHOWN_VIEW} .intro`).first();
    await expect(catalogIntro.locator('b').first()).toHaveText('application domain');
    expect(alerts).toEqual([]);
});

// revert: src/lib/ui/tree/TreeItem.svelte:276 => flex: 1 1 auto;
test("a tree row's controls follow its name rather than the pane's edge", async ({ page }) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const row = page.locator('[data-fs-row="hub:"] [role="treeitem"]').first();
    await row.hover();
    const name = row.locator('.name').first();
    const actions = row.locator('.actions').first();
    await expect(actions).toBeVisible();
    const [rowBox, nameBox, actionBox] = await Promise.all([
        row.boundingBox(),
        name.boundingBox(),
        actions.boundingBox()
    ]);
    expect(rowBox).not.toBeNull();
    expect(nameBox).not.toBeNull();
    expect(actionBox).not.toBeNull();
    if (rowBox === null || nameBox === null || actionBox === null) return;
    // the controls start beside the name
    expect(actionBox.x - (nameBox.x + nameBox.width)).toBeLessThan(80);
    // and the row still reaches far past them, which is the pane's own width
    expect(rowBox.x + rowBox.width - (actionBox.x + actionBox.width)).toBeGreaterThan(200);
});

// revert: src/lib/ui/tree/TreeItem.svelte:219 => over={undefined}
test("a tree row's words open while the pointer is anywhere over the row", async ({ page }) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const row = page.locator('[data-fs-row="hub:"] [role="treeitem"]').first();
    await expect(row).toBeVisible();
    const box = await row.boundingBox();
    expect(box).not.toBeNull();
    if (box === null) return;

    // the space past the row's parts, which the name's own button no longer covers
    await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
    await expect(page.locator('span.bubble:not([hidden])')).toHaveCount(1);
});

// revert: src/lib/ui/tree/TreeItem.svelte:190 => delete
test("a press on a tree row's own space opens it, as a press on its name does", async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.locator('[data-fs-row="hub:"]').getByRole('button').first().click();
    const row = page.locator('[data-fs-row="hub:README.md"] [role="treeitem"]');
    await expect(row).toBeVisible();
    const box = await row.boundingBox();
    expect(box).not.toBeNull();
    if (box === null) return;

    // the space past the row's parts, which the name's own button no longer covers
    await page.mouse.click(box.x + box.width - 20, box.y + box.height / 2);
    await expect(page.getByRole('tab', { name: 'README.md' })).toHaveCount(1);
});
