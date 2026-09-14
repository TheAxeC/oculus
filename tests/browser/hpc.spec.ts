// The Live HPC view over a cluster that answers. The demo hub has no cluster, so tests/browser/
// serve.ts puts an `ssh` of the run's own in front on PATH and it prints demo/hpc/batch.txt and
// demo/hpc/quota.txt: the poller runs the two commands it always runs, parses what comes back the
// way it always does, and nothing in src/ knows a test is running.
//
// The numbers here are the fixture's own, read through the same parsers the server uses, so a
// column that stopped being drawn fails this and a changed fixture fails it too.

import { expect, test } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

/** The two queued jobs of demo/hpc/batch.txt. */
const RUNNING = { id: '1840211', name: 'graph-bandits-sweep' };
const PENDING = { id: '1840212', name: 'tensor-sketch-eval' };

test('the queue rows and the quota of the cluster fixture are drawn', async ({ page }) => {
    await boot(page);
    await openView(page, 'hpc', t('views.hpc'));

    const running = page.locator('tr').filter({ hasText: RUNNING.name });
    await expect(running).toHaveCount(1, { timeout: 15000 });
    await expect(running).toContainText(RUNNING.id);
    await expect(running).toContainText('RUNNING');
    await expect(running).toContainText('main-gpu');

    const pending = page.locator('tr').filter({ hasText: PENDING.name });
    await expect(pending).toHaveCount(1);
    await expect(pending).toContainText(PENDING.id);
    await expect(pending).toContainText('PENDING');

    // One quota meter, at the percentage server/hpc/parse.ts computes from the fixture's two lines.
    await expect(page.getByText(t('hpc.used_of', '184G', '220G', 84))).toBeVisible();
});

test('a finished job of the fixture is on the recent list and the partitions are drawn', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'hpc', t('views.hpc'));

    const done = page.locator('tr').filter({ hasText: 'graph-transfer-train' });
    await expect(done).toHaveCount(1, { timeout: 15000 });
    await expect(done).toContainText('COMPLETED');
    const failed = page.locator('tr').filter({ hasText: 'streaming-anomaly-fit' });
    await expect(failed).toContainText('FAILED');
    await expect(page.locator('tr').filter({ hasText: 'main-cpu' }).first()).toContainText('40');
});
