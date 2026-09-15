// The System group in Chrome: the manual, the configuration and a document of the hub.
//
// These are the three surfaces whose content only a server answers, and no server rendering runs the
// fetch: the manual is read from the engine directory, each configuration card reads its file
// through the file route under the `engine` root, and a hub document is rendered from the hub the
// run serves. The document is written into that hub, which is the run's own copy of demo/ under the
// system temporary directory, and removed again at the end.
//
// What this does NOT cover: saving a configuration edit, which is the source tab's own write and is
// covered by tests/browser/source.spec.ts.

import { expect, test, type Page } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { removeFromHub, writeHubFile } from './hub.ts';
import { t } from './words.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';

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
    await expect(card(page, 'vocab.yml')).toBeVisible();
    await expect(layout.getByText(t('config.desc_layout'))).toBeVisible();

    // The line count is the file's own, read through the file route under the engine root.
    const reveal = layout.locator('button[aria-expanded]');
    await expect(reveal).toHaveAttribute('aria-expanded', 'false');
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

    await card(page, 'meta.yml')
        .getByRole('button', { name: t('config.edit') })
        .click();

    await expect(page.getByRole('tab', { name: 'meta.yml' })).toBeVisible();
    await expect(page.locator('[data-root="engine"][data-path="meta.yml"]')).toBeVisible();
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
