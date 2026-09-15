// The Present view in the browser: the deck opens on its title slide, the toolbar and the arrow key
// each move one slide, and `O` opens the overview grid a tile is picked from. Then the Slides
// catalog it opens: a slide unticked, a slide moved, and the save that puts both in the deck.
//
// The served hub is the demo, whose one PRESENT.md is graph-bandits, so the deck holds the deck-level
// slides of config/present.yml plus that project's two slides. Nothing here writes to the hub, and
// the save writes the copy of the engine's config/ that tests/browser/serve.ts points the run at
// through OCULUS_CONFIG, never the checkout's own.
//
// One case changes that copy's deck and it is the last in the file, since the specs share one server:
// a case reading the deck after it would be reading what that case wrote rather than the shipped
// deck. The others tick and move without saving, and each runs on its own page.

import { expect, test, type Locator, type Page } from '@playwright/test';
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

/** How many slides the deck holds, off the toolbar's own counter. */
async function deckSize(page: Page): Promise<number> {
    const words = (await page.locator('.counter').textContent()) ?? '';
    return Number(words.split('/')[1].trim());
}

/** The pane the slide catalog is drawn in, which is where its status line sits. */
function slidesPane(page: Page): Locator {
    return page.locator('section.pane', { has: page.locator('[data-slides]') });
}

/** The keys of the catalog rows, in the order the Slides view drew them. */
async function catalogKeys(page: Page): Promise<(string | null)[]> {
    return page
        .locator('[data-slide-row]')
        .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-slide-row')));
}

test('the Slides control opens the catalog of every slide the deck could hold', async ({
    page
}) => {
    await openDeck(page);
    const size = await deckSize(page);
    await page.getByRole('button', { name: t('slides.open'), exact: true }).click();
    await expect(page.locator('[data-slides]')).toBeVisible();
    const keys = await catalogKeys(page);
    expect(keys).toHaveLength(size);
    expect(keys[0]).toBe('title');
    expect(keys).toContain('graph-bandits');
    // Every slide is ticked, since the shipped deck saves no selection of its own.
    await expect(page.locator('[data-slide-row] input:checked')).toHaveCount(size);
});

test('Save with nothing ticked says so and sends no write', async ({ page }) => {
    await openDeck(page);
    await page.getByRole('button', { name: t('slides.open'), exact: true }).click();
    await expect(page.locator('[data-slides]')).toBeVisible();

    const boxes = page.locator('[data-slide-row] input[type="checkbox"]');
    for (let at = 0; at < (await boxes.count()); at += 1) await boxes.nth(at).uncheck();

    let writes = 0;
    page.on('request', (request) => {
        if (request.url().endsWith('/api/write')) writes += 1;
    });
    await page.getByRole('button', { name: t('slides.save'), exact: true }).click();
    await expect(slidesPane(page).getByRole('status')).toHaveText(t('slides.keep_one'));
    expect(writes).toBe(0);
});

test('two presses of Save send one write', async ({ page }) => {
    await openDeck(page);
    await page.getByRole('button', { name: t('slides.open'), exact: true }).click();
    await expect(page.locator('[data-slides]')).toBeVisible();

    let writes = 0;
    page.on('request', (request) => {
        if (request.url().endsWith('/api/write')) writes += 1;
    });
    const save = page.getByRole('button', { name: t('slides.save'), exact: true });
    await save.click();
    await save.click({ force: true });
    await expect(slidesPane(page).getByRole('status')).toHaveText(t('slides.saved'));
    expect(writes).toBe(1);
});

test('a slide moved to either end keeps the keyboard on its row', async ({ page }) => {
    await openDeck(page);
    await page.getByRole('button', { name: t('slides.open'), exact: true }).click();
    await expect(page.locator('[data-slides]')).toBeVisible();

    // The second row moved up reaches the top, where the control that moved it is disabled.
    const second = (await catalogKeys(page))[1] ?? '';
    const row = page.locator(`[data-slide-row="${second}"]`);
    await row.locator('[data-step="up"] button').click();
    await expect.poll(async () => (await catalogKeys(page))[0]).toBe(second);
    await expect(row.locator('[data-step="down"] button')).toBeFocused();

    // And back down to the bottom, where the other control is the one left to press.
    const rows = await catalogKeys(page);
    for (let at = 0; at < rows.length - 1; at += 1) {
        await row.locator('[data-step="down"] button').click();
    }

    await expect.poll(async () => (await catalogKeys(page)).at(-1)).toBe(second);
    await expect(row.locator('[data-step="up"] button')).toBeFocused();
});

test('the deck control on a project card opens the deck at that project slide', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const card = page.locator('[data-card="graph-bandits"]');
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: t('project.card.present'), exact: true }).click();
    await expect(page.locator('.present')).toBeVisible();
    await expect.poll(() => slideKey(page)).toBe('graph-bandits');
});

test('a slide unticked and a slide moved reach the deck when the catalog is saved', async ({
    page
}) => {
    await openDeck(page);
    const size = await deckSize(page);
    await page.getByRole('button', { name: t('slides.open'), exact: true }).click();
    await expect(page.locator('[data-slides]')).toBeVisible();

    // The one project slide the demo hub carries, taken off the deck.
    await page.locator('[data-slide-row="graph-bandits"] input[type="checkbox"]').uncheck();

    // The title slide one place later, so the deck opens on the framing slide instead.
    await page
        .locator('[data-slide-row="title"]')
        .getByRole('button', { name: t('slides.down'), exact: true })
        .click();
    await expect.poll(async () => (await catalogKeys(page))[0]).toBe('framing:engine');
    await expect(slidesPane(page).getByRole('status')).not.toBeEmpty();

    await page.getByRole('button', { name: t('slides.save'), exact: true }).click();
    await expect(page.getByText(t('slides.saved'), { exact: true })).toBeVisible();

    // The write is pushed back on the config channel, so the deck redraws where it stands.
    await expect.poll(() => deckSize(page)).toBe(size - 1);
    await expect.poll(() => slideKey(page)).toBe('framing:engine');

    // The keys belong to the deck's own box, and the last control pressed was the catalog's, so the
    // deck takes the focus back before an arrow key is read as its own.
    await page.locator('.present').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('End');
    await expect.poll(() => slideKey(page)).toBe('closing');
    await page.keyboard.press('o');
    await expect(page.locator('[data-overview]')).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Probing the node that tells you most' })
    ).toHaveCount(0);
});
