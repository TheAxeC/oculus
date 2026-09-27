// The one tree a page is: a pane folded from its own menu becomes a strip carrying the name of the
// tab it was showing, the strip's one control shows it again, and the folded state is saved with
// the layout, so a reload comes back to the strip.
//
// Nothing here writes to the hub. The layout lives in the browser's own storage, and Playwright
// gives every test a context of its own, so each test starts from the one default page.

import { expect, test } from '@playwright/test';
import { SHOWN_VIEW, boot, openView, showRailPage } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';

test('a pane folds from its menu, shows its tab name in the strip, and expands again', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));

    // A root pane sits in no split, so its own menu offers no fold; the menu is opened to see that,
    // since a Menu draws its items only while it is open.
    const pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    await pane.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await expect(page.getByRole('menuitem', { name: t('ui.pane_maximise') })).toBeVisible();
    // a root pane sits in no split, so there is nothing to fold it into
    await expect(page.getByRole('menuitem', { name: t('ui.pane_fold') })).toHaveCount(0);
    await page.getByRole('menuitem', { name: t('ui.split_right'), exact: true }).click();
    await expect(page.locator('[data-pane]')).toHaveCount(2);

    const moved = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    await moved.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('ui.pane_fold'), exact: true }).click();

    const strip = page.locator('[data-fold]');
    await expect(strip).toHaveCount(1);
    await expect(strip.locator('[data-fold-label]')).toHaveText(t('views.projects'));
    await expect(page.locator('[data-pane]')).toHaveCount(1);

    // The open pane takes the space the folded one gave up: the two boxes span the split together.
    const whole = await page.locator('.split').first().boundingBox();
    const open = await page.locator('[data-pane]').boundingBox();
    const box = await strip.boundingBox();
    expect(whole).not.toBeNull();
    expect(open).not.toBeNull();
    expect(box).not.toBeNull();
    if (whole === null || open === null || box === null) return;
    expect(Math.abs(open.width + box.width - whole.width)).toBeLessThanOrEqual(2);
    expect(Math.abs(open.x + open.width - box.x)).toBeLessThanOrEqual(2);

    await strip.getByRole('button', { name: t('ui.pane_expand') }).click();
    // the expand took the folded strip away
    await expect(page.locator('[data-fold]')).toHaveCount(0);
    await expect(page.locator('[data-pane]')).toHaveCount(2);
});

test('the folded state survives a reload', async ({ page }) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));

    const pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    await pane.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('ui.split_right'), exact: true }).click();

    const moved = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    await moved.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('ui.pane_fold'), exact: true }).click();
    await expect(page.locator('[data-fold]')).toHaveCount(1);

    await page.reload();
    await expect(page.locator('[data-fold]')).toHaveCount(1);
    await expect(page.locator('[data-fold] [data-fold-label]')).toHaveText(t('views.projects'));
});

test('shift-clicking a catalogue entry opens the view in a pane of its own, and the next joins it', async ({
    page
}) => {
    // revert: src/lib/views/system/workbench/Catalogue.svelte "if (event.shiftKey) openBeside(view, state);" => if (event.shiftKey) openView(view, state);
    await boot(page);
    // The page boot() starts on is one pane; the catalogue opens onto it, the page the reader
    // came from.
    const panes = page.locator('[data-pane]');
    await expect(panes).toHaveCount(1);
    await showRailPage(page, 'views');
    const catalogue = page.locator(`${SHOWN_VIEW} [data-catalogue]`);

    await catalogue.locator('button[data-view="focus"]').click({ modifiers: ['Shift'] });
    // The page shown again is the Status page, which no rail button owns.
    await expect(page.locator('nav [data-rail-page] button.active')).toHaveCount(0);
    await expect(panes).toHaveCount(2);
    const opened = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.focus') })
    });
    await expect(opened).toHaveCount(1);
    await expect(opened.getByRole('tab')).toHaveCount(1);

    // The pane the first one made takes the second as a tab rather than splitting again.
    await showRailPage(page, 'views');
    await catalogue.locator('button[data-view="projects"]').click({ modifiers: ['Shift'] });
    await expect(panes).toHaveCount(2);
    await expect(opened.getByRole('tab')).toHaveCount(2);
});

test('the handle between two open panes still works with a folded strip between them', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const projects = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    await projects.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('ui.split_right'), exact: true }).click();
    await expect(page.locator('[data-pane]')).toHaveCount(2);

    // A third pane to the right of the second, then the middle one folded: [Status, strip, Focus].
    await openView(page, 'focus', t('views.focus'));
    const focus = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.focus') })
    });
    await focus.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('ui.split_right'), exact: true }).click();
    await expect(page.locator('[data-pane]')).toHaveCount(3);
    const middle = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    await middle.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('ui.pane_fold'), exact: true }).click();
    await expect(page.locator('[data-fold]')).toHaveCount(1);
    await expect(page.locator('[data-pane]')).toHaveCount(2);

    // One handle is left, and five steps on it move the first pane's edge by five steps' worth.
    const handle = page.getByRole('separator');
    await expect(handle).toHaveCount(1);
    const first = page.locator('[data-pane]').first();
    const before = await first.boundingBox();
    await handle.focus();
    for (let step = 0; step < 5; step += 1) await page.keyboard.press('ArrowLeft');
    const after = await first.boundingBox();
    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    if (before === null || after === null) return;
    expect(before.width - after.width).toBeGreaterThan(60);
    expect(before.width - after.width).toBeLessThan(100);

    // The folded pane kept its share: expanded, it is as wide as before it was folded, near enough.
    await page.locator('[data-fold]').getByRole('button').click();
    await expect(page.locator('[data-pane]')).toHaveCount(3);
    const widths = await page
        .locator('[data-pane]')
        .evaluateAll((panes) => panes.map((pane) => pane.getBoundingClientRect().width));
    expect(widths[1]).toBeGreaterThan(100);
});
