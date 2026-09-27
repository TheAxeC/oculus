// Which of the two a view's box ends up painted at over a wallpaper. The box paints nothing unless
// the view asks for the tint, and the fraction it is then painted at arrives as a custom property
// on the root element, so the answer is a computed style and not something an audit of the CSS
// source can read: the source only says the box takes `--wall-panel` of `--panel`. The manual is
// one such view, and a code span of its prose paints nothing in turn, which only a wrapped span in
// a drawn page can show: a blur behind a wrapped span covers the prose between its two halves. A
// project's document is drawn on a box that is not tinted, so its fenced block keeps a surface of
// its own there, while the same block in a hub document, on a tinted box, paints none.

import { expect, test, type Locator, type Page } from '@playwright/test';
import {
    SHOWN_VIEW,
    boot,
    openProjectTab,
    openView,
    pickTheme,
    showRailPage
} from '../helpers/rail.ts';
import { alphaOf } from '../helpers/style.ts';
import { removeFromHub, shortOf, writeHubFile } from '../helpers/hub.ts';
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

/**
 * What a wallpaper paints around the first code span of the manual's prose that wraps onto a second
 * line: the span's own backdrop filter and fill alpha, and every backdrop filter in the paragraph
 * holding it, the prose beside the span included. Null while no span wraps at this width.
 */
async function wrappedSpan(
    page: Page
): Promise<{ filter: string; fill: string; around: string[] } | null> {
    return page
        .locator('[data-pane-view="help"]')
        .first()
        .evaluate((view) => {
            const spans = [...view.querySelectorAll<HTMLElement>('.doc code')].filter(
                (code) => code.closest('pre') === null && code.getClientRects().length > 1
            );
            const span = spans.at(0);
            const paragraph = span?.closest('p, li');
            if (span === undefined || paragraph == null) return null;
            const style = getComputedStyle(span);
            const around = [paragraph, ...paragraph.querySelectorAll('*')].map(
                (node) => getComputedStyle(node).backdropFilter
            );
            return { filter: style.backdropFilter, fill: style.backgroundColor, around };
        });
}

test('a wrapped code span of the manual paints no layer of its own over a wallpaper', async ({
    page
}) => {
    // revert: src/lib/views/shared/prose/Markdown.svelte:150 => backdrop-filter: blur(var(--wall-blur));
    // revert: src/lib/views/system/help/Help.svelte:53 => <Pane title={t('views.help')}>
    await boot(page);
    await pickTheme(page, 'mocha');
    await expect(page.locator('.wallpaper')).toHaveCount(1);
    await openView(page, 'help', t('views.help'));
    await expect(page.getByRole('heading', { name: 'The views', exact: true })).toBeVisible();

    // The manual's prose sits on its box's own translucent surface.
    await expect.poll(() => boxAlpha(page, 'help')).toBeGreaterThan(0);
    expect(await boxAlpha(page, 'help')).toBeLessThan(1);

    // Narrower and narrower until some code span of the manual breaks across a line.
    let found = null;
    for (const width of [1280, 1000, 800, 640, 520]) {
        await page.setViewportSize({ width, height: 800 });
        found = await wrappedSpan(page);
        if (found !== null) break;
    }
    expect(found).not.toBeNull();
    if (found === null) return;
    expect(found.filter).toBe('none');
    expect(alphaOf(found.fill)).toBe(0);
    expect(found.around.filter((filter) => filter !== 'none')).toEqual([]);
});

test('a code span of a project document paints no fill of its own over a wallpaper', async ({
    page
}) => {
    // revert: src/lib/views/shared/prose/Markdown.svelte:150 => background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
    await boot(page);
    await pickTheme(page, 'mocha');
    await expect(page.locator('.wallpaper')).toHaveCount(1);
    await openView(page, 'projects', t('views.projects'));
    const name = shortOf('projects/active/graph-bandits');
    const card = page.locator('.card').filter({ hasText: name }).first();
    await card.getByRole('button', { name, exact: true }).click();
    // The README names its datasets as code spans outside any code block.
    const span = page.locator('[data-project] .doc :not(pre) > code').first();
    await expect(span).toBeVisible();
    const painted = await span.evaluate((node) => {
        const style = getComputedStyle(node);
        return { fill: style.backgroundColor, filter: style.backdropFilter };
    });
    expect(alphaOf(painted.fill)).toBe(0);
    expect(painted.filter).toBe('none');
});

/** What a wallpaper paints under the first fenced block inside the element given. */
async function blockPaint(scope: Locator): Promise<{ fill: number; filter: string }> {
    const block = scope.locator('pre').first();
    await expect(block).toBeVisible();
    return block
        .evaluate((node) => {
            const style = getComputedStyle(node);
            return { fill: style.backgroundColor, filter: style.backdropFilter };
        })
        .then((painted) => ({ fill: alphaOf(painted.fill), filter: painted.filter }));
}

test('a fenced block keeps a surface in a project document and paints none in a hub document', async ({
    page
}) => {
    // revert: src/lib/views/shared/prose/Markdown.svelte:46 => <div class="doc" onclick={jump}>
    // revert: src/lib/views/shared/prose/Markdown.svelte:159 => :global(body.wall) .doc :global(pre) {
    const path = 'docs/HPC-UTwente-howto.md';
    writeHubFile(path, '# The cluster\n\n```\nsbatch job.slurm\n```\n');
    try {
        await boot(page);
        await pickTheme(page, 'mocha');
        await expect(page.locator('.wallpaper')).toHaveCount(1);

        // The project tab's box is not tinted, so the block is the one surface under its code.
        await openProjectTab(page, shortOf('projects/active/graph-bandits'));
        const project = await blockPaint(page.locator('[data-project] .doc'));
        expect(project.fill).toBeGreaterThan(0);
        expect(project.filter).not.toBe('none');

        // The doc view's box is tinted, so the block in it paints nothing of its own.
        await showRailPage(page, 'views');
        await page.locator(`${SHOWN_VIEW} [data-catalogue] button[data-doc="${path}"]`).click();
        const hub = await blockPaint(page.locator(`[data-instance][data-path="${path}"] .doc`));
        expect(hub.fill).toBe(0);
        expect(hub.filter).toBe('none');
    } finally {
        removeFromHub(path);
    }
});
