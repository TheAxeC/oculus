// Dismissing a position lead in Chrome: the control writes the lead's status into the hub's feed
// file, so the card is still dismissed after a reload, and the reopen control puts it back.
//
// A dismissal kept in the browser would pass a reload in one browser and fail in the next, so the
// check is the bytes: the entry is read out of the served copy of demo/ at both ends, and the file
// is compared with what it held before the test touched it.

import { expect, test, type Page } from '@playwright/test';
import { readHubFile, readHubYaml, writeHubFile } from '../helpers/hub.ts';
import { boot, openView } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';
import { scalar } from '../../../src/lib/data/helpers/guards.ts';

const FEED = 'feeds/position-leads.yml';

/** The lead this spec acts on, named by its institution so the title is read and never typed. */
const INST = 'Vector Hall';

/** The feed file's entries, as the file holds them. */
function entries(): Record<string, unknown>[] {
    const list = readHubYaml(FEED).entries;
    if (!Array.isArray(list)) throw new Error(`${FEED} holds no entries list`);
    return list as Record<string, unknown>[];
}

/** The status of the one lead at that institution. */
function statusOf(inst: string): string {
    const found = entries().find((entry) => entry.inst === inst);
    if (found === undefined) throw new Error(`${FEED} holds no lead at ${inst}`);
    return scalar(found.status);
}

/** The card of that lead, wherever the view has put it. */
function cardOf(page: Page) {
    return page.locator('[data-lead]').filter({ hasText: INST });
}

let before = '';

test.beforeEach(() => {
    before = readHubFile(FEED);
});

// The served hub is one copy for the whole run and the next spec file reads this same feed, so a
// test that fails part way puts the file back rather than leaving a dismissed lead behind it.
test.afterEach(() => {
    if (readHubFile(FEED) !== before) writeHubFile(FEED, before);
});

test('a dismissed lead is dismissed in the file, after a reload, until it is reopened', async ({
    page
}) => {
    expect(statusOf(INST)).toBe('open');

    await boot(page);
    await openView(page, 'leads', t('views.leads'));
    await expect(cardOf(page)).toHaveCount(1);

    await cardOf(page)
        .getByRole('button', { name: t('leads.action.dismiss') })
        .click();
    await expect.poll(() => statusOf(INST)).toBe('dismissed');
    // the lead was dismissed, and a dismissed lead is held back until it is asked for
    await expect(cardOf(page)).toHaveCount(0);

    // boot() waits for the socket line of the Status view, which the opened tab has replaced, so
    // the reload waits for the rail the config push draws instead and opens the view again from
    // there.
    await page.reload();
    await expect(page.locator('nav [data-rail-page] button').first()).toBeVisible();
    await openView(page, 'leads', t('views.leads'));
    const toggle = page.getByRole('button', { name: t('leads.show_dismissed', 1) });
    await expect(toggle).toBeVisible();
    // the reload reads the file, which holds the dismissal, so it is still held back
    await expect(cardOf(page)).toHaveCount(0);

    await toggle.click();
    await expect(cardOf(page)).toHaveCount(1);
    await cardOf(page)
        .getByRole('button', { name: t('leads.action.reopen') })
        .click();
    await expect.poll(() => statusOf(INST)).toBe('open');
    expect(readHubFile(FEED)).toBe(before);
});
