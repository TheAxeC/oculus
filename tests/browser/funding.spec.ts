// The Funding view: the one card that is joined from the projects rather than read from the file,
// and the cross-links a scheme's card carries to the projects that name it.
//
// Nothing here writes. The scheme and the projects are read out of the served hub, so a demo whose
// funding keys move costs these tests nothing.

import { expect, test } from '@playwright/test';
import { readHubYaml, shortOf } from './hub.ts';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

const FUNDING = 'funding/funding.yml';
const TRANSFER = 'projects/active/graph-transfer';
const BANDITS = 'projects/active/graph-bandits';

/** The title of the first scheme of the served file that a project names by its `key:`. */
function scheme(): { title: string; key: string } {
    const held = readHubYaml(FUNDING).entries;
    if (!Array.isArray(held)) throw new Error(`${FUNDING}: no entries`);
    for (const row of held as Record<string, unknown>[]) {
        if (typeof row.key === 'string' && row.key !== '') {
            return { title: String(row.title), key: row.key };
        }
    }
    throw new Error(`${FUNDING}: no scheme carries a key`);
}

test('the No funding card lists the projects with no scheme', async ({ page }) => {
    await boot(page);
    await openView(page, 'funding', t('views.funding'));

    const card = page
        .locator('.cards [data-entry]')
        .filter({ hasText: t('collection.no_funding') });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText(t('collection.no_funding_sub'));
    await expect(card.getByRole('button', { name: shortOf(BANDITS) })).toBeVisible();
});

test('a scheme cross-link opens the project tab', async ({ page }) => {
    const held = scheme();
    const name = shortOf(TRANSFER);
    await boot(page);
    await openView(page, 'funding', t('views.funding'));

    const card = page.locator('.cards [data-entry]').filter({ hasText: held.title });
    await expect(card).toContainText(t('collection.related'));
    const related = card.locator('.row').filter({ hasText: t('collection.related') });
    const group = related.getByRole('button', { name: /^\d+ .+$/ }).first();
    await group.click();
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await group.click();
    await expect(group).toHaveAttribute('aria-expanded', 'false');
    // the group is closed again, so its members are not drawn
    await expect(card.getByRole('button', { name, exact: true })).toHaveCount(0);
    await group.click();
    await card.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('tab', { name })).toBeVisible();
    // The project tab's card draws the full title, so the folder is what names it here.
    await expect(page.locator('.project .slot').first()).toContainText(TRANSFER);
});
