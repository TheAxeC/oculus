// Layer 4, browser test. The Files view keeps section state across a tab switch and marks the
// workspace in force in its header menu.

import { expect, test } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

// Revert: open the Notes section whatever `view.collapsed` holds, in views/Files.svelte.
test('a section closed from its head stays closed after a tab switch', async ({ page }) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));

    const head = page.locator('[data-fs-notes] [role="treeitem"]').first();
    await expect(head).toHaveAttribute('aria-expanded', 'true');
    await head.getByRole('button', { name: t('files.notes'), exact: true }).click();
    await expect(head).toHaveAttribute('aria-expanded', 'false');
    // a closed section draws its heading alone
    await expect(page.locator('[data-fs-notes] [role="group"]')).toHaveCount(0);

    await openView(page, 'repositories', t('views.repositories'));
    await page.getByRole('tab', { name: t('views.files') }).click();
    await expect(head).toHaveAttribute('aria-expanded', 'false');

    await head.getByRole('button', { name: t('files.notes'), exact: true }).click();
    await expect(head).toHaveAttribute('aria-expanded', 'true');
});

// Revert: set `active: false` on every choice in views/files/Controls.svelte.
test('the workspace menu on the header lists the configured roots, drawn as in force', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.getByRole('button', { name: t('files.workspace'), exact: true }).click();
    const choice = page.getByRole('menuitem', { name: t('files.workspace_default'), exact: true });
    await expect(choice).toBeVisible();
    await expect(choice).toHaveAttribute('aria-current', 'true');
    await choice.click();
    await expect(page.locator('[data-fs-workspace=""] [role="treeitem"]')).toHaveAttribute(
        'aria-current',
        'true'
    );
});
