// The rail under a terminal palette and over a wallpaper. Three facts only a rendered page holds: a
// pseudo-element's content, the room a glyph's ASCII stand-in needs inside its box, and which
// element a reader's pointer would reach at a point, which is what says whether a list or a tooltip
// is painted over the panes or under them.
//
// The theme is mocha, which draws the stand-ins and turns the wallpaper on, so one page carries both
// the terminal shape and the picture every surface is read through.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';

/** The System group's words, as config/layout.yml names them and the rail writes them. */
const SYSTEM = ((): string => {
    const groups = loadConfig(engineDir()).config.nav_groups as Record<string, { label: string }>;
    return groups.system.label;
})();

/** The board behind the rail, under the terminal palette that also carries the wallpaper. */
async function board(page: Page): Promise<void> {
    await boot(page);
    await page.getByRole('button', { name: t('ui.theme') }).click();
    await page.getByRole('menuitem', { name: /mocha/ }).click();
    await expect(page.locator('.wallpaper')).toHaveCount(1);
    // The blur is what makes the rail the containing block and the stacking context of the fixed
    // things inside it, so a page without it reaches none of what these tests are for.
    const blur = await page
        .locator('nav.rail')
        .evaluate((el) => getComputedStyle(el).backdropFilter);
    expect(blur).not.toBe('none');
    await openView(page, 'projects', t('views.projects'));
}

/**
 * Whether the element a pointer reaches at the centre of a box is inside that box. A box painted
 * under the panes beside it answers with whatever the pane draws there instead.
 */
async function centreIsInside(target: Locator): Promise<boolean> {
    return target.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const at = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
        );
        return at !== null && el.contains(at);
    });
}

test('the rail flyout and the theme list paint over the board', async ({ page }) => {
    await board(page);

    await page.locator(`nav [data-group="${SYSTEM}"]`).getByRole('button').first().click();
    const flyout = page.getByRole('menu', { name: SYSTEM });
    await expect(flyout).toBeVisible();
    expect(await centreIsInside(flyout)).toBe(true);
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: t('ui.theme') }).click();
    const themes = page.getByRole('menu', { name: t('ui.theme') });
    await expect(themes).toBeVisible();
    expect(await centreIsInside(themes)).toBe(true);
    await page.keyboard.press('Escape');
});

test('a rail button under a terminal palette is one glyph over one label', async ({ page }) => {
    await board(page);

    const shape = await page.locator('nav button[data-view="projects"]').evaluate((el) => {
        const glyph = el.querySelector('.glyph');
        return {
            height: el.getBoundingClientRect().height,
            before: getComputedStyle(el, '::before').content,
            after: getComputedStyle(el, '::after').content,
            scrollWidth: glyph === null ? -1 : glyph.scrollWidth,
            clientWidth: glyph === null ? -1 : glyph.clientWidth
        };
    });

    expect(shape.height).toBe(34);
    expect(shape.before).toBe('none');
    expect(shape.after).toBe('none');
    expect(shape.clientWidth).toBeGreaterThan(0);
    expect(shape.scrollWidth).toBeLessThanOrEqual(shape.clientWidth);
});

/** The one open bubble: its rectangle, the window it is laid out in, and what is drawn at its centre. */
async function bubbleShape(page: Page): Promise<{
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    inside: boolean;
    window: { width: number; height: number };
}> {
    const bubble = page.locator('[role="tooltip"]:not([hidden])').first();
    await expect(bubble).toBeVisible();
    // The bubble takes no pointer events, so the hit test at its centre would answer with whatever
    // is under it whatever the paint order is; it takes them for the length of the measurement.
    return bubble.evaluate((el) => {
        const box = el as HTMLElement;
        const rect = box.getBoundingClientRect();
        box.style.pointerEvents = 'auto';
        const at = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
        );
        box.style.pointerEvents = '';
        return {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
            inside: at !== null && box.contains(at),
            window: { width: window.innerWidth, height: window.innerHeight }
        };
    });
}

test('a card control tooltip is whole, inside the window and on top', async ({ page }) => {
    await board(page);

    await page
        .getByRole('button', { name: t('project.card.toggle_tip') })
        .first()
        .hover();
    const shape = await bubbleShape(page);

    expect(shape.width).toBeGreaterThan(0);
    expect(shape.height).toBeGreaterThan(0);
    expect(shape.left).toBeGreaterThanOrEqual(0);
    expect(shape.top).toBeGreaterThanOrEqual(0);
    expect(shape.right).toBeLessThanOrEqual(shape.window.width);
    expect(shape.bottom).toBeLessThanOrEqual(shape.window.height);
    expect(shape.inside).toBe(true);
});

test('a tooltip inside an overlay is drawn over it', async ({ page }) => {
    await board(page);

    await page.getByRole('button', { name: t('app.tasks.update_tasks') }).click();
    const tray = page.getByRole('dialog', { name: t('app.tasks.update_tasks') });
    await expect(tray).toBeVisible();
    await tray.getByRole('button', { name: t('app.tasks.close') }).hover();

    expect((await bubbleShape(page)).inside).toBe(true);
});

test('a bookmark label the rail cannot hold on one line wraps to a second and is read whole', async ({
    page
}) => {
    await boot(page);
    const long = page
        .locator('nav button[data-bookmark]')
        .filter({ hasText: 'game-engine manual' });
    await expect(long).toHaveCount(1);
    const label = long.locator('.label');
    const box = await label.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
            lines: Math.round(el.getBoundingClientRect().height / parseFloat(style.lineHeight)),
            clipped: el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
        };
    });
    expect(box.lines).toBe(2);
    expect(box.clipped).toBe(false);
});
