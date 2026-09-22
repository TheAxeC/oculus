// Software as a project type, end to end: the Code view's list of the software tier, the paper a
// row names opening as its own tab, and the link back on that paper's card.
//
// Nothing here writes. The library, its title and the paper it names are read out of the served hub,
// so a demo whose software project is renamed costs this spec nothing.

import { expect, test } from '@playwright/test';
import { readHubYaml, shortOf } from '../helpers/hub.ts';
import { boot, openView } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';

const TOOLKIT = 'projects/software/demo-toolkit';

/** The first project the served library's `related:` names, as its folder under the active tier. */
function paper(): string {
    const named = readHubYaml(`${TOOLKIT}/project.yml`).related;
    if (!Array.isArray(named) || named.length === 0) throw new Error(`${TOOLKIT}: no related list`);
    return `projects/active/${String(named[0])}`;
}

test('the Code view lists the software tier and the paper it names links back', async ({
    page
}) => {
    const title = String(readHubYaml(`${TOOLKIT}/project.yml`).title);
    const name = shortOf(paper());
    await boot(page);
    await openView(page, 'code', t('views.code'));

    const row = page.locator('[data-software-row="demo-toolkit"]');
    await expect(row).toHaveCount(1);
    await expect(row.getByRole('button', { name: title, exact: true })).toBeVisible();
    await expect(row).toContainText(t('board.code_deposited'));
    await expect(row).toContainText(t('collection.software_papers'));

    await row.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('tab', { name })).toBeVisible();

    const line = page.locator('.project .taglist').filter({ hasText: t('project.card.software') });
    await expect(line.locator('.kind')).toHaveText(t('project.card.software'));
    await expect(line.locator('.tag .label')).toHaveText([shortOf(TOOLKIT)]);

    // The link is one edge read from either side: the library's own card names the paper back.
    await line.getByRole('button', { name: shortOf(TOOLKIT), exact: true }).click();
    await expect(page.getByRole('tab', { name: shortOf(TOOLKIT) })).toBeVisible();
    const back = page
        .locator('.project .taglist')
        .filter({ hasText: t('project.card.software_papers') });
    await expect(back.locator('.tag .label')).toContainText([name]);
});
