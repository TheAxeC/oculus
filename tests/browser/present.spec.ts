// The Present view in the browser: the deck opens on its title slide, the toolbar and the arrow key
// each move one slide, and `O` opens the overview grid a tile is picked from.
//
// The served hub is the demo, whose one PRESENT.md is graph-bandits, so the deck holds the deck-level
// slides of config/present.yml plus that project's two slides. Nothing here writes to the hub.

import { expect, test, type Page } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

/** The key of the slide the view is drawing, which the pane carries on its own box. */
async function slideKey(page: Page): Promise<string | null> {
    return page.locator('.present').getAttribute('data-slide-key');
}

async function openDeck(page: Page): Promise<void> {
    await boot(page);
    await openView(page, 'present', t('views.present'));
    await expect(page.locator('.present')).toBeVisible();
}

test('the deck opens on its title slide and the toolbar moves one slide at a time', async ({
    page
}) => {
    await openDeck(page);
    await expect(page.locator('[data-slide-kind="title"]')).toBeVisible();
    expect(await slideKey(page)).toBe('title');

    await page.getByRole('button', { name: t('present.next'), exact: true }).click();
    await expect.poll(() => slideKey(page)).toBe('framing:engine');
    await expect(page.locator('[data-slide-kind="framing"]')).toBeVisible();

    await page.getByRole('button', { name: t('present.previous'), exact: true }).click();
    await expect.poll(() => slideKey(page)).toBe('title');
});

test('the arrow keys work the moment the view is opened, with no control pressed first', async ({
    page
}) => {
    await openDeck(page);
    expect(await slideKey(page)).toBe('title');
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => slideKey(page)).toBe('framing:engine');
});

test('the arrow keys move through the deck and O opens the overview a tile is picked from', async ({
    page
}) => {
    await openDeck(page);
    await page.getByRole('button', { name: t('present.next'), exact: true }).click();
    await expect.poll(() => slideKey(page)).toBe('framing:engine');

    await page.keyboard.press('ArrowRight');
    await expect.poll(() => slideKey(page)).toBe('summary:summary1');
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => slideKey(page)).toBe('framing:engine');

    await page.keyboard.press('o');
    await expect(page.locator('[data-overview]')).toBeVisible();
    await page.getByRole('button', { name: 'Probing the node that tells you most' }).click();
    await expect(page.locator('[data-overview]')).toBeHidden();
    expect(await slideKey(page)).toBe('graph-bandits');
    await expect(page.locator('[data-slide="graph-bandits"]')).toBeVisible();
});

test('a project slide draws its own front matter and typesets its equation', async ({ page }) => {
    await openDeck(page);
    await page.keyboard.press('End');
    await expect.poll(() => slideKey(page)).toBe('closing');

    await page.keyboard.press('o');
    await page.getByRole('button', { name: 'Probing the node that tells you most' }).click();
    const slide = page.locator('[data-slide="graph-bandits"]');
    await expect(slide).toBeVisible();
    await expect(
        slide.getByText('Bandit allocation under an evolving neighbourhood')
    ).toBeVisible();
    await expect(slide.getByText(t('present.method'), { exact: true })).toBeVisible();
    await expect(slide.getByText(t('present.results'), { exact: true })).toBeVisible();
    // The slide's equation is LaTeX, so KaTeX typeset it into the page rather than leaving the source.
    await expect(slide.locator('.katex').first()).toBeVisible();
});

test('a diagram panel is laid out as the grid the slide wrote', async ({ page }) => {
    await openDeck(page);
    await page.keyboard.press('o');
    await page.getByRole('button', { name: 'Probing the node that tells you most' }).click();
    const nodes = page.locator('[data-slide="graph-bandits"] .dnode');
    await expect(nodes).toHaveCount(2);

    // Two columns, so the nodes sit side by side: the same top, and the second one further right.
    const first = await nodes.nth(0).boundingBox();
    const second = await nodes.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    if (first === null || second === null) return;
    expect(second.y).toBeCloseTo(first.y, 0);
    expect(second.x).toBeGreaterThan(first.x + first.width - 1);

    // The colour the slide wrote on the node survived the diagram profile of the sanitiser.
    await expect(nodes.nth(0)).toHaveCSS('border-top-color', 'rgb(37, 99, 235)');
});
