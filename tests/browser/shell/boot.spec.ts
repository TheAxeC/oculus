// The page loads, the socket comes up, and the snapshot the server built over the temporary copy of
// demo/ is the one the page is holding. Everything else in this folder assumes these three, so this
// is the spec that says whether the harness itself is sound.

import { expect, test } from '@playwright/test';
import { boot, openView } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';

test('the page boots, the socket opens and the snapshot holds the demo hub', async ({ page }) => {
    // The Status view is where the snapshot's counts are said, and boot() starts on it.
    await boot(page);
    const status = page.locator('.view', { hasText: t('app.socket', t('app.socket_open')) });
    await expect(status).toContainText(t('app.socket', t('app.socket_open')));
    await expect(status).toContainText(t('app.projects', 11));
    await expect(status).toContainText(t('app.collections', 12));
    await expect(status).toContainText(t('app.venues', 5));
});

// The feeds arrive on the socket at boot and never by request: a feed view opened cold shows its
// entries from the channel's first message, which a page that had not subscribed could not draw.
test('a feed view opened cold holds the entries the feeds channel delivered at boot', async ({
    page
}) => {
    await page.goto('/');
    // revert: src/lib/shell/rail/RailPages.svelte:194 => data-rail-button={entry.page}
    await expect(page.locator('nav [data-rail-page] button').first()).toBeVisible();
    await openView(page, 'leads', t('views.leads'));
    await expect(page.locator('[data-lead]').first()).toBeVisible();
});
