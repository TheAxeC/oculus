// The control a view drawn from one file of the hub closes its toolbar with, in Chrome. Lit Watch
// is the case: it is opened from the palette on the demo hub, its control is pressed, and what
// lands is the source tab over the feed file the configuration names, showing as the tab in force.
//
// Only a rendered page holds this: the control opens a tab through the layout store, and whether
// that tab is the one the pane shows is the workbench's answer rather than the view's.

import { expect, test } from '@playwright/test';
import { boot, openView } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';

const FEED = 'feeds/literature-radar.yml';

test('Lit Watch opens its own feed file as the source tab in force', async ({ page }) => {
    await boot(page);
    await openView(page, 'radar', t('views.radar'));

    await page
        .locator(`[data-source-path="${FEED}"]`)
        .getByRole('button', { name: t('views.open_source') })
        .click();

    await expect(page.getByRole('tab', { name: 'literature-radar.yml' })).toHaveAttribute(
        'aria-selected',
        'true'
    );
    await expect(page.locator(`[data-root="hub"][data-path="${FEED}"]`)).toBeVisible();
    await expect(page.locator(`[data-source-editor="${FEED}"]`)).toBeVisible();
});
