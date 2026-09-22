// The drag the orchestrator has never been able to check by hand: a Focus card picked up on one lane
// and dropped on another. views/boards/focus/lanes/LaneCard.svelte arms it with `ondragstart` on
// the card and views/boards/focus/lanes/Lanes.svelte takes it with `ondrop` on the lane body, which
// are HTML5 drag events; Chrome automation that only moves the mouse never fires them.
//
// The card is put back on the lane it came from at the end, and the manifest is asserted to be the
// bytes the test found.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { readHubFile, shortOf } from '../helpers/hub.ts';
import { boot, openView } from '../helpers/rail.ts';
import { t, vocabulary } from '../helpers/words.ts';

const ANOMALY = 'projects/active/streaming-anomaly';

/**
 * One lane of the board, by the label config/catalogs/vocab.yml gives its key. The lane is found by
 * its own heading and not by its text: `hasText` matches a substring anywhere under the element,
 * and a card whose sentence happens to hold a lane's name would match that lane too.
 */
function lane(page: Page, key: string): Locator {
    const label = vocabulary('focus_lanes').find((one) => one.key === key)?.label ?? '';
    return page
        .locator('.lane')
        .filter({ has: page.locator('.lane-name', { hasText: new RegExp(`^${label}$`) }) });
}

test('a card dragged onto another lane lands there and the manifest follows', async ({ page }) => {
    const file = `${ANOMALY}/project.yml`;
    const before = readHubFile(file);
    const from = /focus: (\w+)/.exec(before)?.[1] ?? '';
    expect(from).not.toBe('');
    const to = vocabulary('focus_lanes').find((one) => one.key !== from)?.key ?? '';

    await boot(page);
    await openView(page, 'focus', t('views.focus'));

    const name = shortOf(ANOMALY);
    const card = lane(page, from).getByRole('listitem').filter({ hasText: name });
    await expect(card).toHaveCount(1);

    await card.dragTo(lane(page, to).getByRole('list'));
    await expect(lane(page, to).getByRole('listitem').filter({ hasText: name })).toHaveCount(1);
    // the card was dragged onto the other lane, so it is no longer on the one it came from
    await expect(lane(page, from).getByRole('listitem').filter({ hasText: name })).toHaveCount(0);
    await expect.poll(() => readHubFile(file), { timeout: 5000 }).toContain(`focus: ${to}`);

    await lane(page, to)
        .getByRole('listitem')
        .filter({ hasText: name })
        .dragTo(lane(page, from).getByRole('list'));
    await expect(lane(page, from).getByRole('listitem').filter({ hasText: name })).toHaveCount(1);
    await expect.poll(() => readHubFile(file), { timeout: 5000 }).toBe(before);
});
