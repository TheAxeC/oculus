// The page loads, the socket comes up, and the snapshot the server built over the temporary copy of
// demo/ is the one the page is holding. Everything else in this folder assumes these three, so this
// is the spec that says whether the harness itself is sound.

import { expect, test } from '@playwright/test';
import { openView } from './rail.ts';
import { t } from './words.ts';

test('the page boots, the socket opens and the snapshot holds the demo hub', async ({ page }) => {
    await page.goto('/');
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
    await expect(page.locator('nav button[data-view]').first()).toBeVisible();
    await openView(page, 'leads', t('views.leads'));
    await expect(page.locator('[data-lead]').first()).toBeVisible();
});
