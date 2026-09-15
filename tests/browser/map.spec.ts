// The Map's filter row in the page. What the unit suite reads is the pure rule over a built graph;
// what is read here is the graph a reader ends up looking at after pressing the controls, which is
// the one place the state, the filter and the drawing meet.
//
// The counts on the chips are the hub's, so nothing here is typed as a word or a number: a control
// is taken by its position in its own group and the graph is counted before and after.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { readHubYaml, shortOf } from './hub.ts';
import { t } from './words.ts';

/** A project of the demo hub that is a member of one line, so another line's filter takes it out. */
const BANDITS = 'projects/active/graph-bandits';

/** A research line that project is not a member of, read from the hub rather than typed here. */
function otherLine(): string {
    const manifest = readHubYaml(`${BANDITS}/project.yml`).program;
    const mine = Array.isArray(manifest) ? manifest.map(String) : [];
    const entries = readHubYaml('registries/programs.yml').entries;
    const keys = (Array.isArray(entries) ? entries : []).map((entry) =>
        String((entry as Record<string, unknown>).key)
    );
    const other = keys.find((key) => !mine.includes(key));
    if (other === undefined) throw new Error(`${BANDITS} is a member of every line`);
    return other;
}

/** How many nodes the map draws now. */
function nodes(page: Page): Promise<number> {
    return page.locator('[data-map-graph] [data-node]').count();
}

/** The filter row, once the map is the open view. */
async function filters(page: Page): Promise<Locator> {
    await boot(page);
    await openView(page, 'map', t('views.map'));
    await expect(page.locator('[data-map-graph]')).toBeVisible();
    const row = page.locator('[data-map-filters]');
    await expect(row).toBeVisible();
    return row;
}

test('a pressed type chip narrows the map to that type, and the all control gives it back', async ({
    page
}) => {
    const row = await filters(page);
    const whole = await nodes(page);
    expect(whole).toBeGreaterThan(0);

    const chips = row.locator('[data-map-types] button.chip');
    expect(await chips.count()).toBeGreaterThan(1);
    await chips.first().click();
    await expect(chips.first()).toHaveAttribute('aria-pressed', 'true');
    await expect(chips.nth(1)).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => nodes(page)).toBeLessThan(whole);
    const narrowed = await nodes(page);

    // A second press adds that type to the filter rather than replacing the first.
    await chips.nth(1).click();
    await expect(chips.first()).toHaveAttribute('aria-pressed', 'true');
    await expect(chips.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => nodes(page)).toBeGreaterThan(narrowed);
    expect(await nodes(page)).toBeLessThan(whole);

    await row.locator('[data-map-types] button.tool').last().click();
    await expect(chips.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => nodes(page)).toBe(whole);
});

test('the connected toggle takes out a project left with no line the map still draws', async ({
    page
}) => {
    const row = await filters(page);
    const node = page.locator(`[data-map-graph] [aria-label="${shortOf(BANDITS)}"]`);
    await expect(node).toHaveCount(1);

    // One line that project is not in, which leaves it in the map with no membership at all.
    await row.locator('[data-map-lines] button.tool').filter({ hasText: otherLine() }).click();
    await expect(node).toHaveCount(1);
    const loose = await nodes(page);

    await row.locator('[data-map-connected] button').click();
    await expect(node).toHaveCount(0);
    await expect.poll(() => nodes(page)).toBeLessThan(loose);
});
