// The Map's filter row and its tuned layout in the page. What the unit suite reads is the pure rule
// over a built graph; what is read here is the graph a reader ends up looking at after pressing the
// controls, which is the one place the state, the filter and the drawing meet.
//
// The counts on the chips are the hub's, so nothing here is typed as a word or a number: a control
// is taken by its position in its own group and the graph is counted before and after.
//
// This is also the one place the tuned layout can be read at all: the parameters are kept with the
// pane rather than in one browser's own storage, so only a reload of a real page shows whether the
// picture comes back.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { boot, openView } from '../helpers/rail.ts';
import { readHubYaml, shortOf } from '../helpers/hub.ts';
import { t } from '../helpers/words.ts';

/** A project of the demo hub that is a member of one line, so another line's filter takes it out. */
const BANDITS = 'projects/active/graph-bandits';

/** A pillar that project is not a member of, read from the hub rather than typed here. */
function otherLine(): string {
    const manifest = readHubYaml(`${BANDITS}/project.yml`).pillar;
    const mine = Array.isArray(manifest) ? manifest.map(String) : [];
    const entries = readHubYaml('registries/pillars.yml').entries;
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

/** Where the drawn project nodes sit, which is the placement a saved tuning has to bring back. */
function circles(page: Page): Promise<string[]> {
    return page
        .locator('[data-map-graph] circle')
        .evaluateAll((drawn) =>
            drawn.map((node) => `${node.getAttribute('cx')},${node.getAttribute('cy')}`)
        );
}

/** Those positions once the simulation has cooled, which is what the reader is left looking at. */
async function settled(page: Page): Promise<string[]> {
    await expect(page.locator('[data-map-graph]')).toBeVisible();
    let last: string[] = [];
    await expect
        .poll(
            async () => {
                const now = await circles(page);
                const still = now.length > 0 && now.join('|') === last.join('|');
                last = now;
                return still;
            },
            { timeout: 30000, intervals: [400] }
        )
        .toBe(true);
    return last;
}

/** The parameter names one tuning carries, which is what a saved one has to be readable as. */
const PHYSICS = ['center', 'collide', 'cool', 'damping', 'linkLength', 'linkStrength', 'repulse'];

/** The tunings the open panes have saved, read out of everything this browser is holding. */
function tunings(page: Page): Promise<{ key: string; params: Record<string, number> }[]> {
    return page.evaluate(() => {
        const found: { key: string; params: Record<string, number> }[] = [];
        for (let at = 0; at < localStorage.length; at += 1) {
            const name = localStorage.key(at);
            const raw = name === null ? null : localStorage.getItem(name);
            let held: unknown;
            try {
                held = raw === null ? null : JSON.parse(raw);
            } catch {
                continue;
            }
            const instances = (held as { instances?: unknown } | null)?.instances;
            if (typeof instances !== 'object' || instances === null) continue;
            for (const state of Object.values(instances as Record<string, unknown>)) {
                const tuned = (state as { tuned?: unknown } | null)?.tuned;
                if (tuned === undefined || tuned === null) continue;
                found.push(tuned as { key: string; params: Record<string, number> });
            }
        }
        return found;
    });
}

/** Every name this browser is holding something under, which the map no longer adds one to. */
function storedKeys(page: Page): Promise<string[]> {
    return page.evaluate(() => {
        const names: string[] = [];
        for (let at = 0; at < localStorage.length; at += 1) {
            const name = localStorage.key(at);
            if (name !== null) names.push(name);
        }
        return names;
    });
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
    // the connected toggle drops a project no line in force reaches, and this one has no membership left
    await expect(node).toHaveCount(0);
    await expect.poll(() => nodes(page)).toBeLessThan(loose);
});

test('a saved map is drawn again after a reload, and the re-tune control lays it out afresh', async ({
    page
}) => {
    await filters(page);
    // The pane opened carrying no parameters, so this is the placement it tuned for itself.
    const fresh = await settled(page);
    expect(fresh.length).toBeGreaterThan(0);

    // What it tuned went into the pane's own state, under the name of the node set it drew, and
    // the map put nothing of its own in the browser beside it.
    const kept = await tunings(page);
    expect(kept).toHaveLength(1);
    expect(kept[0].key.length).toBeGreaterThan(0);
    expect(Object.keys(kept[0].params).sort()).toEqual(PHYSICS);
    expect((await storedKeys(page)).filter((name) => name.startsWith('oculus-map'))).toEqual([]);

    // The reload is handed those parameters, so it places the graph by the search that runs under
    // given parameters rather than by the tuning search, and the picture it draws is its own.
    await page.reload();
    const saved = await settled(page);
    expect(saved).not.toEqual(fresh);
    expect(await tunings(page)).toEqual(kept);

    // A second reload is handed the same parameters again, which is the map coming back whole.
    await page.reload();
    expect(await settled(page)).toEqual(saved);

    // The control drops the tuning, so the pane tunes again from the same seeded start, which is
    // the placement it made the first time it was opened.
    await page.getByRole('button', { name: t('map.retune'), exact: true }).click();
    expect(await settled(page)).toEqual(fresh);
});
