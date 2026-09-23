// The System group in Chrome: the manual, the configuration and a document of the hub.
//
// These are the three surfaces whose content only a server answers, and no server rendering runs
// the fetch: the manual is read from the engine directory, each configuration card reads its file
// through the file route under the `engine` root, the machine's own local.yml of that folder
// included, and a hub document is rendered from the hub the run serves. The document is written
// into that hub, which is the run's own copy of demo/ under the system temporary directory, and
// removed again at the end.
//
// The manual shows the three diagrams of docs/diagrams/, each drawn in the prose's own colour from
// the diagram route under a light theme and a dark one; a diagram file that carries a script is
// drawn as its drawing alone; and the route refuses a name that is not one of that folder's `.svg`
// files.
//
// What this does NOT cover: saving a configuration edit, which is the source tab's own write and is
// covered by tests/browser/sources/source.spec.ts.

import { expect, test, type Page } from '@playwright/test';
import { boot, openView } from '../helpers/rail.ts';
import { removeFromHub, writeHubFile } from '../helpers/hub.ts';
import { t, tabNamed } from '../helpers/words.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { NAMES } from '../../../bin/diagrams.mjs';

const merged = loadConfig(engineDir()).config;

/** One entry of the `docs:` list of config/layout.yml, by the path it names. */
function entry(path: string): { label: string; path: string; group: string } {
    const docs = merged.docs as { label: string; path: string; group: string }[];
    const found = docs.find((one) => one.path === path);
    if (found === undefined) throw new Error(`config/layout.yml names no document ${path}`);
    return found;
}

const HPC = entry('HPC-UTwente-howto.md');

const HOWTO = '# The cluster\n\nSubmit every job with sbatch.\n';

/** The card one configuration file is drawn as. */
function card(page: Page, name: string): ReturnType<Page['locator']> {
    return page.locator(`[data-card="${name}"]`);
}

test('the manual is drawn from the file beside DESIGN.md', async ({ page }) => {
    await boot(page);
    await openView(page, 'help', t('views.help'));

    await expect(page.getByRole('heading', { name: 'The views', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The keys', exact: true })).toBeVisible();
    // The manual names every listed view by its id, the Config view among them, in its table.
    await expect(page.getByRole('cell', { name: 'config', exact: true })).toBeVisible();
});

/** The colour of one diagram's lines and letters, and the colour of the prose beside it. */
async function paint(
    page: Page,
    name: string
): Promise<{ line: string; letter: string; text: string }> {
    return page.locator(`[data-diagram="${name}"] svg`).evaluate((node) => {
        const prose = document.querySelector('.doc');
        const edge = node.querySelector('path');
        const label = node.querySelector('text');
        return {
            line: edge === null ? '' : getComputedStyle(edge).stroke,
            letter: label === null ? '' : getComputedStyle(label).fill,
            text: prose === null ? '' : getComputedStyle(prose).color
        };
    });
}

test('the manual draws the three diagrams in the colour of its prose, light and dark', async ({
    page
}) => {
    // revert: src/lib/views/system/help/Diagram.svelte:74 => color: black;
    await boot(page);
    const colours: string[] = [];
    for (const theme of [/^\S+ light$/, /^\S+ dark$/]) {
        await page.getByRole('button', { name: t('ui.theme') }).click();
        await page.getByRole('menuitem', { name: theme }).click();
        await openView(page, 'help', t('views.help'));
        await expect(page.locator('[data-diagram]')).toHaveCount(NAMES.length);
        for (const name of NAMES) {
            const figure = page.locator(`[data-diagram="${name}"]`);
            await expect(figure.locator('svg text').first()).toBeVisible();
            const drawn = await paint(page, name);
            expect(drawn.line).toBe(drawn.text);
            expect(drawn.letter).toBe(drawn.text);
            colours.push(drawn.text);
        }
    }
    // The two themes paint their prose differently, so the diagrams followed the page, not a colour
    // of their own.
    expect(new Set(colours).size).toBe(2);
});

test('a diagram file carrying a script and a handler is drawn as a drawing alone', async ({
    page
}) => {
    // revert: src/lib/views/system/help/Diagram.svelte:65 => {@html shown.svg}
    const seen: string[] = [];
    page.on('dialog', (dialog) => {
        seen.push(dialog.message());
        void dialog.dismiss();
    });
    await page.route('**/api/diagrams/layers.svg', (route) =>
        route.fulfill({
            contentType: 'image/svg+xml',
            body: [
                '<svg xmlns="http://www.w3.org/2000/svg" width="80pt" height="20pt" onload="alert(1)">',
                '<script>alert(2)</script>',
                '<foreignObject><div>outside</div></foreignObject>',
                '<g id="clobber"><text fill="currentColor" x="4" y="14">kept</text></g>',
                '</svg>'
            ].join('')
        })
    );
    await boot(page);
    await openView(page, 'help', t('views.help'));
    const figure = page.locator('[data-diagram="layers"]');
    await expect(figure.locator('svg text')).toHaveText('kept');
    // The filter keeps the drawing's own elements and drops everything that runs or embeds.
    await expect(figure.locator('script, foreignObject, [onload], [id]')).toHaveCount(0);
    expect(seen).toEqual([]);
});

test('a write edge names the functions it calls on hover, and no style of the file is drawn', async ({
    page
}) => {
    // revert: src/lib/ui/html.ts:260 => export const GRAPH_TAGS = ['svg', 'g', 'polygon', 'polyline', 'path', 'ellipse', 'text'];
    // revert: src/lib/ui/html.ts:260 => export const GRAPH_TAGS = ['svg', 'style', 'g', 'title', 'polygon', 'polyline', 'path', 'ellipse', 'text'];
    await boot(page);
    await openView(page, 'help', t('views.help'));
    const figure = page.locator('[data-diagram="writes"]');
    await expect(figure.locator('svg text').first()).toBeVisible();
    const titles = await figure.locator('g.edge > title').allTextContents();
    expect(titles.some((one) => one.includes('logChanges'))).toBe(true);
    // The file's own grey is for a viewer outside oculus; in the page the filter leaves it out.
    await expect(figure.locator('svg style')).toHaveCount(0);
});

test('a diagram says it is drawing while its answer is out, and a view closed then opens whole', async ({
    page
}) => {
    // revert: src/lib/views/system/help/Diagram.svelte:60 => delete
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
        release = resolve;
    });
    await page.route('**/api/diagrams/layers.svg', async (route) => {
        await held;
        await route.continue();
    });
    await boot(page);
    await openView(page, 'help', t('views.help'));
    await expect(page.getByText(t('help.diagram_loading', 'layers'))).toBeVisible();

    // The view closes with the answer still out; the answer then lands on nothing.
    await page
        .locator('.tab', { has: page.getByRole('tab', { name: tabNamed(t('views.help')) }) })
        .getByRole('button', { name: t('ui.close_tab') })
        .click();
    // Closing the Help tab takes its figures with it, so there is none left for the answer to fill.
    await expect(page.locator('[data-diagram]')).toHaveCount(0);
    release();

    // Opened again, the view asks again and draws the diagram the route now answers with.
    await openView(page, 'help', t('views.help'));
    await expect(page.locator('[data-diagram="layers"] svg text').first()).toBeVisible();
    expect(errors).toEqual([]);
});

test('the diagram route serves only the svg files of docs/diagrams', async ({ page }) => {
    // revert: src/lib/server/content/diagrams.ts:27 => export const DIAGRAM_NAME = /\.(svg|dot|json)$/;
    await boot(page);
    const served = await page.request.get('/api/diagrams/layers.svg');
    expect(served.status()).toBe(200);
    expect(served.headers()['content-type']).toBe('image/svg+xml');
    for (const name of [
        'layers.dot',
        '..%2Fpackage.json',
        '%2E%2E%2Fpackage.json',
        'nothing.svg'
    ]) {
        expect((await page.request.get(`/api/diagrams/${name}`)).status(), name).toBe(404);
    }
});

test('the configuration is one card per file, each opening its own text', async ({ page }) => {
    await boot(page);
    await openView(page, 'config', t('views.config'));

    const layout = card(page, 'layout.yml');
    await expect(layout).toBeVisible();
    await expect(card(page, 'catalogs/vocab.yml')).toBeVisible();
    await expect(layout.getByText(t('config.desc_layout'))).toBeVisible();

    // The line count is the file's own, read through the file route under the engine root.
    const reveal = layout.locator('button[aria-expanded]');
    await expect(reveal).toHaveAttribute('aria-expanded', 'false');
    // the card is closed, so the raw text of the file is not drawn
    await expect(page.locator('pre[data-file="layout.yml"]')).toHaveCount(0);

    await reveal.click();
    await expect(reveal).toHaveAttribute('aria-expanded', 'true');
    const preview = page.locator('pre[data-file="layout.yml"]');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('nav_groups');
});

test('a configuration file opens in a source tab from its card', async ({ page }) => {
    await boot(page);
    await openView(page, 'config', t('views.config'));

    await card(page, 'catalogs/meta.yml')
        .getByRole('button', { name: t('views.open_source') })
        .click();

    await expect(page.getByRole('tab', { name: 'meta.yml' })).toBeVisible();
    await expect(page.locator('[data-root="engine"][data-path="catalogs/meta.yml"]')).toBeVisible();
});

test('the machine own file is the last card and opens in a source tab', async ({ page }) => {
    await boot(page);
    await openView(page, 'config', t('views.config'));

    const own = card(page, 'local.yml');
    await expect(own).toBeVisible();
    // Exact: the description below the tag opens with the same two words.
    await expect(own.getByText(t('config.local_tag'), { exact: true })).toBeVisible();
    await expect(own.getByText(t('config.desc_local'))).toBeVisible();

    // Last of this view's own list, read inside the pane it is drawn in rather than off the page,
    // which would hold any other open pane's cards as well.
    const names = await page
        .locator('[data-pane-view="config"] [data-card]')
        .evaluateAll((cards) => cards.map((one) => one.getAttribute('data-card')));
    expect(names[names.length - 1]).toBe('local.yml');
    expect(names.length).toBeGreaterThan(1);

    await own.getByRole('button', { name: t('views.open_source') }).click();
    await expect(page.getByRole('tab', { name: 'local.yml' })).toBeVisible();
    await expect(page.locator('[data-root="engine"][data-path="local.yml"]')).toBeVisible();
});

// Revert: size the rows of the card list to the room the pane leaves, as a flex column does.
test('every configuration card is as tall as what it holds, and the list scrolls', async ({
    page
}) => {
    // revert: src/lib/views/system/config/Config.svelte:144 => delete
    await boot(page);
    await openView(page, 'config', t('views.config'));
    await expect(card(page, 'local.yml').locator('button[aria-expanded]')).toBeVisible();

    // A card clips what overflows it, so a card squeezed under its content hides its line count
    // and its control while toBeVisible still passes on the part left showing.
    const cut = await page
        .locator('[data-pane-view="config"] [data-card]')
        .evaluateAll((cards) =>
            cards
                .filter((one) => one.scrollHeight > one.clientHeight + 1)
                .map((one) => one.getAttribute('data-card'))
        );
    expect(cut).toEqual([]);
});

test('a hub document opens from its group in the rail', async ({ page }) => {
    writeHubFile(HPC.path, HOWTO);
    try {
        await boot(page);
        // The System group holds more than four entries, so its document is a choice of its list.
        const groups = page.locator('nav [data-group]');
        const many = await groups.count();
        for (let at = 0; at < many; at += 1) {
            await groups.nth(at).getByRole('button').first().click();
            const item = page.getByRole('menuitem', { name: HPC.label, exact: true });
            if ((await item.count()) > 0) {
                await item.click();
                break;
            }
            await page.keyboard.press('Escape');
        }

        await expect(page.getByRole('tab', { name: HPC.label })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'The cluster' })).toBeVisible();
        await expect(page.getByText('Submit every job with sbatch.')).toBeVisible();
    } finally {
        removeFromHub(HPC.path);
    }
});
