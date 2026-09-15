// The Memories wall in Chrome: the tiles the route answers with, one of them enlarged over the
// pane, and the three ways the enlarged picture is put away.
//
// The wall is the one surface whose content only a server answers and whose overlay only a browser
// runs: a server rendering makes no fetch and has no Escape key. The pictures are the engine's own
// assets/memories folder, which the run serves through the configured directory; nothing here writes
// a file.

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { copyIntoHub, removeFromHub } from './hub.ts';
import { t } from './words.ts';

/** Where the wall reads from, which config/appearance.yml names relative to the hub. */
const FOLDER = 'tools/oculus/assets/memories';

/** The pictures this file puts there, taken from the ones the tree ships. */
const PICTURES = ['mem-01.png', 'mem-02.png'];

const engine = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// The served hub is a copy of demo/, which carries no wall of its own, so this file makes one out of
// two of the engine's own pictures and takes it away again.
test.beforeAll(() => {
    for (const name of PICTURES) {
        copyIntoHub(join(FOLDER, name), join(engine, 'assets', 'memories', name));
    }
});

test.afterAll(() => {
    removeFromHub('tools');
});

/** The wall's own box, which every locator here is scoped to. */
function wall(page: Page): ReturnType<Page['locator']> {
    return page.locator('[data-memories]');
}

/** The names of the tiles the wall drew. */
async function tiles(page: Page): Promise<string[]> {
    return wall(page)
        .locator('[data-tile]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-tile') ?? ''));
}

async function openWall(page: Page): Promise<void> {
    await boot(page);
    await openView(page, 'memories', t('views.memories'));
    await expect(wall(page)).toBeVisible();
    // The names come from the route rather than from the rendering, so the first tile is what says
    // the answer has landed; a case reading the names before it would read an empty wall.
    await expect(wall(page).locator('[data-tile]').first()).toBeVisible();
}

test('the wall draws a tile per picture of the configured folder', async ({ page }) => {
    await openWall(page);

    expect(await tiles(page)).toEqual(PICTURES);
    // Every tile is a URL under the route, never a picture inlined into the document.
    const sources = await wall(page)
        .locator('[data-tile] img')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('src') ?? ''));
    expect(sources.every((one) => one.startsWith('/api/memories?file='))).toBe(true);
});

test('a tile opens the picture over the pane and Escape closes it', async ({ page }) => {
    await openWall(page);
    const first = (await tiles(page))[0];

    await page.locator(`[data-tile="${first}"]`).click();
    const shown = page.getByRole('dialog', { name: t('memories.lightbox', first) });
    await expect(shown).toBeVisible();
    await expect(shown.locator('img')).toHaveAttribute(
        'src',
        `/api/memories?file=${encodeURIComponent(first)}`
    );

    await page.keyboard.press('Escape');
    await expect(shown).toHaveCount(0);
    // The tile that opened it has the keyboard back, so the wall is where the reader left it.
    await expect(page.locator(`[data-tile="${first}"]`)).toBeFocused();
});

test('the close control and a press outside the picture both put it away', async ({ page }) => {
    await openWall(page);
    const first = (await tiles(page))[0];

    await page.locator(`[data-tile="${first}"]`).click();
    const shown = page.getByRole('dialog', { name: t('memories.lightbox', first) });
    await shown.getByRole('button', { name: t('memories.close'), exact: true }).click();
    await expect(shown).toHaveCount(0);

    await page.locator(`[data-tile="${first}"]`).click();
    await expect(shown).toBeVisible();
    await shown
        .getByRole('button', { name: t('memories.close_outside'), exact: true })
        .click({ position: { x: 5, y: 5 } });
    await expect(shown).toHaveCount(0);
});
