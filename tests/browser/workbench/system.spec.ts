// The System group in Chrome: the manual, the configuration and a document of the hub.
//
// These are the three surfaces whose content only a server answers, and no server rendering runs
// the fetch: the manual is read from the engine directory, each configuration card reads its file
// through the file route under the `engine` root, the machine's own local.yml of that folder
// included, and a hub document is rendered from the hub the run serves. The document is written
// into that hub, which is the run's own copy of demo/ under the system temporary directory, and
// removed again at the end.
//
// What this does NOT cover: saving a configuration edit, which is the source tab's own write and is
// covered by tests/browser/sources/source.spec.ts.

import { expect, test, type Page } from '@playwright/test';
import { boot, openView } from '../helpers/rail.ts';
import { removeFromHub, writeHubFile } from '../helpers/hub.ts';
import { t } from '../helpers/words.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';

const merged = loadConfig(engineDir()).config;

/** One entry of the `docs:` list of config/layout.yml, by the path it names. */
function entry(path: string): { label: string; path: string; group: string } {
    const docs = merged.docs as { label: string; path: string; group: string }[];
    const found = docs.find((one) => one.path === path);
    if (found === undefined) throw new Error(`config/layout.yml names no document ${path}`);
    return found;
}

const HPC = entry('HPC-UTwente-howto.md');

const HOWTO = '# The cluster\n\nSubmit every job with sbatch.\n';

/** The card one configuration file is drawn as. */
function card(page: Page, name: string): ReturnType<Page['locator']> {
    return page.locator(`[data-card="${name}"]`);
}

test('the manual is drawn from the file beside DESIGN.md', async ({ page }) => {
    await boot(page);
    await openView(page, 'help', t('views.help'));

    await expect(page.getByRole('heading', { name: 'The views', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The keys', exact: true })).toBeVisible();
    // The manual names every listed view by its id, the Config view among them, in its table.
    await expect(page.getByRole('cell', { name: 'config', exact: true })).toBeVisible();
});

test('the configuration is one card per file, each opening its own text', async ({ page }) => {
    await boot(page);
    await openView(page, 'config', t('views.config'));

    const layout = card(page, 'layout.yml');
    await expect(layout).toBeVisible();
    await expect(card(page, 'catalogs/vocab.yml')).toBeVisible();
    await expect(layout.getByText(t('config.desc_layout'))).toBeVisible();

    // The line count is the file's own, read through the file route under the engine root.
    const reveal = layout.locator('button[aria-expanded]');
    await expect(reveal).toHaveAttribute('aria-expanded', 'false');
    // the card is closed, so the raw text of the file is not drawn
    await expect(page.locator('pre[data-file="layout.yml"]')).toHaveCount(0);

    await reveal.click();
    await expect(reveal).toHaveAttribute('aria-expanded', 'true');
    const preview = page.locator('pre[data-file="layout.yml"]');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('nav_groups');
});

test('a configuration file opens in a source tab from its card', async ({ page }) => {
    await boot(page);
    await openView(page, 'config', t('views.config'));

    await card(page, 'catalogs/meta.yml')
        .getByRole('button', { name: t('views.open_source') })
        .click();

    await expect(page.getByRole('tab', { name: 'meta.yml' })).toBeVisible();
    await expect(page.locator('[data-root="engine"][data-path="catalogs/meta.yml"]')).toBeVisible();
});

test('the machine own file is the last card and opens in a source tab', async ({ page }) => {
    await boot(page);
    await openView(page, 'config', t('views.config'));

    const own = card(page, 'local.yml');
    await expect(own).toBeVisible();
    // Exact: the description below the tag opens with the same two words.
    await expect(own.getByText(t('config.local_tag'), { exact: true })).toBeVisible();
    await expect(own.getByText(t('config.desc_local'))).toBeVisible();

    // Last of this view's own list, read inside the pane it is drawn in rather than off the page,
    // which would hold any other open pane's cards as well.
    const names = await page
        .locator('[data-pane-view="config"] [data-card]')
        .evaluateAll((cards) => cards.map((one) => one.getAttribute('data-card')));
    expect(names[names.length - 1]).toBe('local.yml');
    expect(names.length).toBeGreaterThan(1);

    await own.getByRole('button', { name: t('views.open_source') }).click();
    await expect(page.getByRole('tab', { name: 'local.yml' })).toBeVisible();
    await expect(page.locator('[data-root="engine"][data-path="local.yml"]')).toBeVisible();
});

// Revert: size the rows of the card list to the room the pane leaves, as a flex column does.
test('every configuration card is as tall as what it holds, and the list scrolls', async ({
    page
}) => {
    // revert: src/lib/views/system/config/Config.svelte:144 => delete
    await boot(page);
    await openView(page, 'config', t('views.config'));
    await expect(card(page, 'local.yml').locator('button[aria-expanded]')).toBeVisible();

    // A card clips what overflows it, so a card squeezed under its content hides its line count
    // and its control while toBeVisible still passes on the part left showing.
    const cut = await page
        .locator('[data-pane-view="config"] [data-card]')
        .evaluateAll((cards) =>
            cards
                .filter((one) => one.scrollHeight > one.clientHeight + 1)
                .map((one) => one.getAttribute('data-card'))
        );
    expect(cut).toEqual([]);
});

test('a hub document opens from its group in the rail', async ({ page }) => {
    writeHubFile(HPC.path, HOWTO);
    try {
        await boot(page);
        // The System group holds more than four entries, so its document is a choice of its list.
        const groups = page.locator('nav [data-group]');
        const many = await groups.count();
        for (let at = 0; at < many; at += 1) {
            await groups.nth(at).getByRole('button').first().click();
            const item = page.getByRole('menuitem', { name: HPC.label, exact: true });
            if ((await item.count()) > 0) {
                await item.click();
                break;
            }
            await page.keyboard.press('Escape');
        }

        await expect(page.getByRole('tab', { name: HPC.label })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'The cluster' })).toBeVisible();
        await expect(page.getByText('Submit every job with sbatch.')).toBeVisible();
    } finally {
        removeFromHub(HPC.path);
    }
});
