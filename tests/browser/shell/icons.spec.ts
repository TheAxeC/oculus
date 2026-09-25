// The icons in the page, which is the only place the icon filter of ui/html.ts runs: the unit suite
// is node, where DOMPurify has no document and the drawing is handed back as it came.
//
// What the rail draws is one line icon per control, taking the colour of the text beside it, and
// nothing a drawing may not carry: no script, no handler, no address out of the page. The ASCII
// vocabulary is the other half of the same control, and there an icon is not drawn at all.
//
// A text that carries a glyph draws it as a Glyph beside its words, never as a character inside
// them: the Settings theme menu and the Focus board's columns are read here by their textContent,
// which holds nothing outside printable ASCII in the icon mode and in a terminal theme's ASCII
// mode.
//
// A view badge that is a mark rather than a count is not here: the demo hub carries no LinkedIn
// folder, so its cadence badge never appears. A tab's mark badge is rendered in
// tests/shell/workbench.test.ts.

import { expect, test, type Locator, type Page } from '@playwright/test';
import {
    SHOWN_VIEW,
    boot,
    inSettings,
    openView,
    pickTheme,
    showRailPage
} from '../helpers/rail.ts';
import { readHubFile, writeHubFile } from '../helpers/hub.ts';
import { t } from '../helpers/words.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';

/** The characters of the texts that fall outside printable ASCII; a line break is layout. */
async function outsideAscii(texts: Locator): Promise<string[]> {
    const all = await texts.evaluateAll((nodes) => nodes.map((node) => node.textContent));
    return all.flatMap((text) => text.replace(/[\n\t]/g, ' ').match(/[^\x20-\x7E]/g) ?? []);
}

// revert: src/lib/ui/display/Glyph.svelte:35 => : { text: standIn, svg: '' };
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

// revert: src/lib/ui/display/Glyph.svelte:44 => {@html drawn.svg.replace('currentColor', 'red')}
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

test('a terminal theme draws the ASCII stand-in and no icon, until the icons are asked for', async ({
    page
}) => {
    // revert: src/lib/views/system/workbench/Appearance.svelte:122 => onclick={() => setIcons(icons())}
    await boot(page);
    await pickTheme(page, 'mocha');
    // a terminal theme draws the ASCII stand-in, so no icon is drawn until the icons are asked for
    await expect(page.locator('nav .glyph svg')).toHaveCount(0);
    await expect(page.locator('nav .glyph').first()).not.toBeEmpty();

    await inSettings(page, (settings) =>
        settings.getByRole('button', { name: t('ui.icons') }).click()
    );
    await expect(page.locator('nav .glyph svg').first()).toBeVisible();
});

// revert: config/appearance.yml:10 => - { name: light, glyph: theme_base, label: "\u25d0 light" }
// revert: src/lib/views/system/workbench/Appearance.svelte:35 => glyph: undefined,
test('the Settings theme menu draws each theme with an icon and no character outside ASCII', async ({
    page
}) => {
    const themes = loadConfig(engineDir()).config.themes as unknown[];
    await boot(page);
    await showRailPage(page, 'views');
    const settings = page.locator(`${SHOWN_VIEW} [data-settings-view]`);
    const current = settings.locator('[data-theme-name]');
    for (const theme of ['light', 'mocha']) {
        if (theme !== 'light') await pickTheme(page, theme);
        await settings.getByRole('button', { name: t('ui.theme') }).click();
        const items = page.getByRole('menuitem');
        await expect(items).toHaveCount(themes.length);
        expect(await outsideAscii(items)).toEqual([]);
        expect(await outsideAscii(current)).toEqual([]);
        // The icon mode draws every theme's glyph as a drawing, a terminal theme as its stand-in.
        const drawn = theme === 'light' ? themes.length : 0;
        await expect(items.locator('.glyph svg')).toHaveCount(drawn);
        await expect(current.locator('.glyph svg')).toHaveCount(drawn === 0 ? 0 : 1);
        await page.keyboard.press('Escape');
        // Escape closes the whole menu, so the next theme's pass opens it afresh.
        await expect(items).toHaveCount(0);
    }
});

// revert: config/text/views/boards/focus.yml:87 => funding_lane: "\u25c6 Funding"
test('the Focus board draws its column glyphs as icons and no character outside ASCII', async ({
    page
}) => {
    // The demo applications hold none still out for an answer, so the Jobs column would not be
    // drawn; this gives the run's own copy of the hub one, and puts the file back after.
    const file = 'applications/applications.yml';
    const original = readHubFile(file);
    writeHubFile(
        file,
        `${original.trimEnd()}\n  - title: Lecturer, signal processing\n    status: active\n`
    );
    try {
        await columnGlyphs(page);
    } finally {
        writeHubFile(file, original);
    }
});

/** The Funding, Jobs and Teaching columns, each drawn once with its glyph, in light and mocha. */
async function columnGlyphs(page: Page): Promise<void> {
    await boot(page);
    await openView(page, 'focus', t('views.focus'));
    const heads = page.locator('.lane-h');
    const column = (key: string): Locator =>
        heads.filter({
            has: page.locator('.lane-name', { hasText: new RegExp(`^${t(`focus.${key}_lane`)}$`) })
        });
    for (const theme of ['light', 'mocha']) {
        if (theme !== 'light') await pickTheme(page, theme);
        expect(await heads.count()).toBeGreaterThanOrEqual(10);
        expect(await outsideAscii(heads)).toEqual([]);
        for (const key of ['funding', 'jobs', 'teaching']) {
            await expect(column(key)).toHaveCount(1);
            const glyph = column(key).locator('.glyph');
            await expect(glyph).toHaveCount(1);
            await expect(glyph.locator('svg')).toHaveCount(theme === 'light' ? 1 : 0);
            // A terminal theme draws the stand-in as text, where the icon mode drew the drawing.
            if (theme !== 'light') await expect(glyph).not.toBeEmpty();
        }
    }
}

// revert: src/lib/data/snapshot/normalise.ts:331 => wos: str(entry.wos),
test('a Venues card draws a check or cross of the registry as its icon and no character', async ({
    page
}) => {
    // The demo venues carry no indexing fields, so this gives one the marks registries/venues.yml
    // writes, in the run's own copy of the hub, and puts the file back after.
    const file = 'registries/venues.yml';
    const original = readHubFile(file);
    const line = '  - id: kdd\n';
    expect(original).toContain(line);
    writeHubFile(
        file,
        original.replace(line, `${line}    wos: "\\u2705 SCIE"\n    scopus: "\\u274c"\n`)
    );
    try {
        await boot(page);
        await openView(page, 'venues', t('views.venues'));
        const card = page.locator('[data-card="kdd"]');
        await expect(card).toHaveCount(1);
        await expect(card).toContainText(t('venues.wos', 'SCIE'));
        await expect(card.locator('[data-glyph="check"] svg')).toHaveCount(1);
        await expect(card.locator('[data-glyph="cross"] svg')).toHaveCount(1);
        expect(await outsideAscii(card)).toEqual([]);
    } finally {
        writeHubFile(file, original);
    }
});
