// The icons in the page, which is the only place the icon filter of ui/html.ts runs: the unit suite
// is node, where DOMPurify has no document and the drawing is handed back as it came.
//
// What the rail draws is one line icon per control, taking the colour of the text beside it, and
// nothing a drawing may not carry: no script, no handler, no address out of the page. The ASCII
// vocabulary is the other half of the same control, and there an icon is not drawn at all.
//
// A view badge that is a mark rather than a count is not here: the demo hub carries no LinkedIn
// folder, so its cadence badge never appears. A tab's mark badge is rendered in
// tests/shell/workbench.test.ts.

import { expect, test } from '@playwright/test';
import { boot, inSettings, pickTheme } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';

test('every glyph in the rail is a line icon and none of them carries anything that runs', async ({
    page
}) => {
    await boot(page);
    const rail = page.locator('nav');
    const icons = rail.locator('.glyph svg');
    expect(await icons.count()).toBeGreaterThan(4);
    // the icons are inlined markup from the icon set, which carries nothing that runs
    await expect(rail.locator('.glyph script')).toHaveCount(0);
    // and nothing that fetches a second file either
    await expect(rail.locator('.glyph image, .glyph use, .glyph foreignObject')).toHaveCount(0);

    const first = icons.first();
    expect(await first.getAttribute('stroke')).toBe('currentColor');
    // The box the drawing is laid out in survives the filter, which lowercases the names it matches
    // on; without it every icon would be drawn at its intrinsic size and clipped.
    expect(await first.getAttribute('viewBox')).toBe('0 0 24 24');
    const handlers = await icons.evaluateAll((nodes) =>
        nodes.flatMap((node) =>
            [...node.querySelectorAll('*'), node].flatMap((element) =>
                [...element.attributes]
                    .map((attribute) => attribute.name)
                    .filter((name) => name.startsWith('on') || name.includes('href'))
            )
        )
    );
    expect(handlers).toEqual([]);
});

test('an icon is drawn in the colour of the control it sits in', async ({ page }) => {
    await boot(page);
    const icon = page.locator('nav .glyph svg').first();
    const painted = await icon.evaluate((node) => {
        const own = getComputedStyle(node);
        const parent = getComputedStyle(node.parentElement as Element);
        return [own.stroke, parent.color];
    });
    expect(painted[0]).toBe(painted[1]);
});

test('a terminal theme draws the ASCII stand-in and no icon, until the glyphs are asked for', async ({
    page
}) => {
    // revert: src/lib/views/system/workbench/Appearance.svelte:112 => onclick={() => setUnicode(unicode())}
    await boot(page);
    await pickTheme(page, 'mocha');
    // a terminal theme draws the ASCII stand-in, so no icon is drawn until the glyphs are asked for
    await expect(page.locator('nav .glyph svg')).toHaveCount(0);
    await expect(page.locator('nav .glyph').first()).not.toBeEmpty();

    await inSettings(page, (settings) =>
        settings.getByRole('button', { name: t('ui.unicode') }).click()
    );
    await expect(page.locator('nav .glyph svg').first()).toBeVisible();
});
