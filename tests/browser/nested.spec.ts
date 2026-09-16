// A page shown inside another page: the pane menu's page list shows one, the leaf draws that page's
// own panes, a view opened while reading inside it is open on that page when the strip is switched
// to it, a page that would show itself is never offered, and the leaf's control stops showing it.
//
// Nothing here writes to the hub. The layout lives in the browser's own storage, and Playwright
// gives every test a context of its own, so each test starts from the one default page.

import { expect, test } from '@playwright/test';
import { readHubYaml, shortOf } from './hub.ts';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

const FUNDING = 'funding/funding.yml';
const TRANSFER = 'projects/active/graph-transfer';

/** The first scheme of the served funding file, whose card carries the cross-links to projects. */
function scheme(): string {
    const held = readHubYaml(FUNDING).entries;
    if (!Array.isArray(held)) throw new Error(`${FUNDING}: no entries`);
    for (const row of held as Record<string, unknown>[]) {
        if (typeof row.key === 'string' && row.key !== '') return String(row.title);
    }
    throw new Error(`${FUNDING}: no scheme carries a key`);
}

/** Page 2 shown inside page 1, from the first pane's menu, with the strip left on page 1. */
async function showSecond(page: import('@playwright/test').Page): Promise<void> {
    await page
        .locator('[data-pane]')
        .first()
        .getByRole('button', { name: t('ui.pane_menu'), exact: true })
        .click();
    await page.getByRole('menuitem', { name: t('ui.embed_page_list'), exact: true }).click();
    await page
        .getByRole('menuitem', { name: t('ui.embed_page', t('ui.page_default', 2)), exact: true })
        .click();
    await expect(page.locator('[data-page-leaf]')).toHaveCount(1);
}

/** A second page, made from the strip's menu, with the strip left on the first one. */
async function twoPages(page: import('@playwright/test').Page): Promise<void> {
    await boot(page);
    const strip = page.getByRole('region', { name: t('ui.pages') });
    await strip.getByRole('button', { name: t('ui.page_menu') }).click();
    await page.getByRole('menuitem', { name: t('ui.page_new') }).click();
    await expect(strip.getByRole('tab')).toHaveCount(2);
    await page.keyboard.press('1');
    await expect(strip.getByRole('tab', { name: t('ui.page_default', 1) })).toHaveAttribute(
        'aria-selected',
        'true'
    );
}

test('the pane menu shows the second page in the first, and its control stops showing it', async ({
    page
}) => {
    await twoPages(page);
    const pane = page.locator('[data-pane]').first();
    await pane.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('ui.embed_page_list'), exact: true }).click();
    // The page a pane is in is never offered to itself: only the other page is on the list.
    await expect(
        page.getByRole('menuitem', { name: t('ui.embed_page', t('ui.page_default', 1)) })
    ).toHaveCount(0);
    await page
        .getByRole('menuitem', { name: t('ui.embed_page', t('ui.page_default', 2)), exact: true })
        .click();

    const leaf = page.locator('[data-page-leaf]');
    await expect(leaf).toHaveCount(1);
    await expect(leaf.locator('[data-page-leaf-label]')).toHaveText(t('ui.page_default', 2));
    // The leaf draws the second page's own pane, which carries that page and its path inside it.
    await expect(leaf.locator('[data-pane]')).toHaveCount(1);
    await expect(leaf.locator('[data-pane]')).toHaveAttribute('data-pane-path', '');
    await expect(page.locator('[data-pane]')).toHaveCount(2);

    await page.reload();
    await expect(page.locator('[data-page-leaf]')).toHaveCount(1);

    await page
        .locator('[data-page-leaf]')
        .getByRole('button', { name: t('ui.page_leaf_close') })
        .click();
    await expect(page.locator('[data-page-leaf]')).toHaveCount(0);
    await expect(page.locator('[data-pane]')).toHaveCount(1);
});

test('a view opened while reading inside the shown page is open on that page', async ({ page }) => {
    await twoPages(page);
    await showSecond(page);

    // The pane inside the leaf is pressed first, so the rail opens the view in the page it shows.
    const inside = page.locator('[data-page-leaf] [data-pane]');
    await inside.getByRole('tab').first().click();
    await openView(page, 'funding', t('views.funding'));
    await expect(inside.getByRole('tab', { name: t('views.funding') })).toHaveCount(1);

    // A control of the view itself opens its tab in the page it is being read in, the same way.
    const name = shortOf(TRANSFER);
    const card = inside.locator('.cards [data-entry]').filter({ hasText: scheme() });
    const related = card.locator('.row').filter({ hasText: t('collection.related') });
    await related
        .getByRole('button', { name: /^\d+ .+$/ })
        .first()
        .click();
    await card.getByRole('button', { name, exact: true }).click();
    await expect(inside.getByRole('tab', { name })).toHaveCount(1);

    // It is the same page and not a copy: the strip switched to it shows the tabs that were opened.
    await page.keyboard.press('2');
    await expect(page.locator('[data-page-leaf]')).toHaveCount(0);
    await expect(page.getByRole('tab', { name: t('views.funding') })).toHaveCount(1);
    await expect(page.getByRole('tab', { name })).toHaveCount(1);
});

test('a page already shown on the screen is refused in words, and is not shown twice', async ({
    page
}) => {
    await twoPages(page);
    await showSecond(page);

    // Page 1 is dragged onto the pane inside page 2: it draws that pane, so it cannot be drawn in
    // it. The ghost says so and the pointer coming up leaves the tree as it was.
    const strip = page.getByRole('region', { name: t('ui.pages') });
    const first = strip.getByRole('tab', { name: t('ui.page_default', 1) });
    const from = await first.boundingBox();
    const body = await page.locator('[data-page-leaf] [data-pane-body]').boundingBox();
    expect(from).not.toBeNull();
    expect(body).not.toBeNull();
    if (from === null || body === null) return;

    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(body.x + body.width / 2, body.y + body.height / 2, { steps: 5 });
    await page.mouse.move(body.x + body.width - 4, body.y + body.height / 2, { steps: 5 });
    await expect(page.locator('.ghost.refused')).toHaveText(
        new RegExp(t('ui.embed_refused', t('ui.page_default', 1)))
    );
    await page.mouse.up();
    await expect(page.locator('[data-page-leaf]')).toHaveCount(1);
    await expect(strip.getByRole('tab')).toHaveCount(2);
});

test('a tab dropped on the leaf header edge lands beside the whole leaf', async ({ page }) => {
    await twoPages(page);
    await showSecond(page);
    await expect(page.locator('.split > .child')).toHaveCount(2);

    const tab = page.getByRole('tab', { name: t('views.status') }).first();
    const head = await page.locator('[data-page-leaf] .head').boundingBox();
    const from = await tab.boundingBox();
    expect(head).not.toBeNull();
    expect(from).not.toBeNull();
    if (head === null || from === null) return;

    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(head.x + head.width / 2, head.y + head.height / 2, { steps: 5 });
    await page.mouse.move(head.x + head.width - 2, head.y + head.height / 2, { steps: 5 });
    await page.mouse.up();

    // The tab left the pane it was in and became a pane of the host page beside the shown page:
    // the pane at path 1 belongs to the host, not to the page the leaf shows.
    const leaf = page.locator('[data-page-leaf]');
    await expect(leaf).toHaveCount(1);
    const nested = await leaf.getAttribute('data-page-leaf');
    const beside = page.locator('[data-pane][data-pane-path="1"]');
    await expect(beside).toHaveCount(1);
    expect(await beside.getAttribute('data-pane-page')).not.toBe(nested);
});

test('a pane menu inside the shown page acts on that page', async ({ page }) => {
    await twoPages(page);
    await showSecond(page);
    const inside = page.locator('[data-page-leaf] [data-pane]');
    // A second tab in that pane, so the tab the menu splits off leaves a pane behind it.
    await inside.getByRole('tab').first().click();
    await openView(page, 'venues', t('views.venues'));
    await expect(inside.getByRole('tab')).toHaveCount(2);
    await inside.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('ui.split_right'), exact: true }).click();
    await expect(page.locator('[data-page-leaf] [data-pane]')).toHaveCount(2);

    // A fold inside the shown page collapses a child of that page and leaves the host alone.
    await page
        .locator('[data-page-leaf] [data-pane]')
        .first()
        .getByRole('button', { name: t('ui.pane_menu'), exact: true })
        .click();
    await page.getByRole('menuitem', { name: t('ui.pane_fold'), exact: true }).click();
    await expect(page.locator('[data-page-leaf] [data-fold]')).toHaveCount(1);
    await expect(page.locator('[data-pane]')).toHaveCount(2);

    // Maximise draws that one pane alone inside the leaf, and the host's own pane stays drawn.
    const only = page.locator('[data-page-leaf] [data-pane]');
    await only.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('ui.pane_maximise'), exact: true }).click();
    await expect(page.locator('[data-page-leaf] [data-fold]')).toHaveCount(0);
    await expect(page.locator('[data-pane]')).toHaveCount(2);

    // Closing it leaves the shown page holding the pane that was folded, and the host untouched.
    await only.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('ui.pane_close'), exact: true }).click();
    await expect(page.locator('[data-page-leaf] [data-pane]')).toHaveCount(1);
    await expect(page.locator('[data-page-leaf]')).toHaveCount(1);
});

test('a page that would show itself is offered nowhere', async ({ page }) => {
    await twoPages(page);
    await page
        .locator('[data-pane]')
        .first()
        .getByRole('button', { name: t('ui.pane_menu') })
        .click();
    await page.getByRole('menuitem', { name: t('ui.embed_page_list'), exact: true }).click();
    await page
        .getByRole('menuitem', { name: t('ui.embed_page', t('ui.page_default', 2)), exact: true })
        .click();
    await expect(page.locator('[data-page-leaf]')).toHaveCount(1);

    // Page 1 shows page 2, so the pane inside page 2 offers neither page: not its own, and not the
    // one that shows it, which would make each page show itself. With no page to offer, the menu
    // carries no choice that lists them.
    await page
        .locator('[data-page-leaf] [data-pane]')
        .getByRole('button', { name: t('ui.pane_menu'), exact: true })
        .click();
    await expect(page.getByRole('menuitem', { name: t('ui.pane_maximise') })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: t('ui.embed_page_list') })).toHaveCount(0);
    await expect(
        page.getByRole('menuitem', { name: t('ui.embed_page', t('ui.page_default', 1)) })
    ).toHaveCount(0);
    await expect(
        page.getByRole('menuitem', { name: t('ui.embed_page', t('ui.page_default', 2)) })
    ).toHaveCount(0);
});

test('a page tab dragged out of the strip onto a pane edge is shown there', async ({ page }) => {
    await twoPages(page);
    const strip = page.getByRole('region', { name: t('ui.pages') });
    const second = strip.getByRole('tab', { name: t('ui.page_default', 2) });
    const from = await second.boundingBox();
    const body = await page.locator('[data-pane-body]').first().boundingBox();
    expect(from).not.toBeNull();
    expect(body).not.toBeNull();
    if (from === null || body === null) return;

    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    // Out of the strip first, which is what turns the reorder into a drag of the page itself, then
    // onto the right edge of the pane's body.
    await page.mouse.move(body.x + body.width / 2, body.y + body.height / 2, { steps: 5 });
    await page.mouse.move(body.x + body.width - 4, body.y + body.height / 2, { steps: 5 });
    await page.mouse.up();

    const leaf = page.locator('[data-page-leaf]');
    await expect(leaf).toHaveCount(1);
    await expect(leaf.locator('[data-page-leaf-label]')).toHaveText(t('ui.page_default', 2));
    // The strip still lists both pages: showing one inside another is not moving it.
    await expect(strip.getByRole('tab')).toHaveCount(2);
});
