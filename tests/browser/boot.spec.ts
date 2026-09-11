// The page loads, the socket comes up, and the snapshot the server built over the temporary copy of
// demo/ is the one the page is holding. Everything else in this folder assumes these three, so this
// is the spec that says whether the harness itself is sound.

import { expect, test } from '@playwright/test';
import { t } from './words.ts';

test('the page boots, the socket opens and the snapshot holds the demo hub', async ({ page }) => {
    await page.goto('/');
    const status = page.locator('.view', { hasText: t('app.socket', t('app.socket_open')) });
    await expect(status).toContainText(t('app.socket', t('app.socket_open')));
    await expect(status).toContainText(t('app.projects', 10));
    await expect(status).toContainText(t('app.collections', 8));
    await expect(status).toContainText(t('app.venues', 5));
});
