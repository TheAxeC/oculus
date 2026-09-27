// The behaviours of the views that only a rendered page holds: the Views catalogue opening a view
// on the page the reader came from beside the keys that open one on the page on screen, and on its
// own page by a drag onto a pane or by its right-click menu, a tooltip
// closing when an overlay takes focus, the two places a long value meets the edge of its card,
// which of an intro's two paths filters the markup it is given, and where a tree row's controls sit
// in a wide pane.
//
// The unit suite reads them off the source, because a cut and a box are layout effects no server
// render measures and DOMPurify has no document in node. What is measured here is the box the
// reader ends up with and the elements Chrome kept.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { GROUND, SHOWN_VIEW, boot, openView, showRailPage } from '../helpers/rail.ts';
import { shortOf } from '../helpers/hub.ts';
import { t } from '../helpers/words.ts';

const BANDITS = 'projects/active/graph-bandits';

/** The demo's long values, each the head of one, which is what makes the cut measurable. */
const LONG_PILLAR = 'Graph learning over evolving';
const LONG_PROJECT = 'Sketched tensor decompositions';

/** Whether an element's own text is wider than the box it is drawn in, which is the cut itself. */
async function clipped(target: Locator): Promise<boolean> {
    return target.evaluate((el) => el.scrollWidth > el.clientWidth);
}

/** Whether the first box ends inside the second, which is the card it may not run past. */
async function within(inner: Locator, outer: Locator): Promise<boolean> {
    const one = await inner.boundingBox();
    const two = await outer.boundingBox();
    expect(one).not.toBeNull();
    expect(two).not.toBeNull();
    if (one === null || two === null) return false;
    return one.x >= two.x - 1 && one.x + one.width <= two.x + two.width + 1;
}

/** Open a view and hand back the card of one project on the board. */
async function projectCard(page: Page): Promise<Locator> {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const card = page
        .locator('.card')
        .filter({ hasText: shortOf(BANDITS) })
        .first();
    await expect(card).toBeVisible();
    return card;
}

test('the catalogue opens a view on the page the reader came from, and a chord and a digit on the page on screen', async ({
    page
}) => {
    // revert: src/lib/views/system/workbench/Catalogue.svelte:117 => delete
    await boot(page);
    await showRailPage(page, 'projects');
    await showRailPage(page, 'views');
    const catalogue = page.locator(`${SHOWN_VIEW} [data-catalogue]`);
    await catalogue.locator('button[data-view="help"]').click();
    // The press showed the Projects page again, the page the reader came from, with Help on it.
    await expect(page.locator('nav [data-rail-page="projects"] button')).toHaveClass(/\bactive\b/);
    await expect(page.getByRole('tab', { name: t('views.help') })).toBeVisible();
    await expect(page.getByRole('tab', { name: t('views.projects') })).toBeVisible();

    // A shift-press opens the view in a pane beside, on that same page.
    await showRailPage(page, 'views');
    await catalogue.locator('button[data-view="usage"]').click({ modifiers: ['Shift'] });
    await expect(page.locator('nav [data-rail-page="projects"] button')).toHaveClass(/\bactive\b/);
    await expect(page.locator('[data-pane]')).toHaveCount(2);
    await expect(
        page
            .locator('[data-pane]')
            .nth(1)
            .getByRole('tab', { name: t('views.usage') })
    ).toBeVisible();

    // The keys open a view where a view lands on the page on screen, which stays the page shown.
    await showRailPage(page, 'views');
    // The first entry drawn with a key whose view no page holds yet, with the name its tab takes.
    const held = ['help', 'usage', 'projects', 'coauthor', 'archive', 'focus', 'status'].concat([
        'catalogue',
        'settings',
        'pages'
    ]);
    let name = '';
    let key = '';
    for (const entry of await catalogue.locator('.entry:has(.key):has(button[data-view])').all()) {
        const button = entry.locator('button[data-view]');
        if (held.includes((await button.getAttribute('data-view')) ?? '')) continue;
        name = ((await button.locator('.label').textContent()) ?? '').trim();
        key = ((await entry.locator('.key').textContent()) ?? '').trim();
        break;
    }
    expect(key).toMatch(/^[a-z][1-9]$/);
    await page.locator('body').click({ position: GROUND });
    await page.keyboard.press(key[0]);
    await page.keyboard.press(key[1]);
    await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
    await expect(page.locator('nav [data-rail-page="views"] button')).toHaveClass(/\bactive\b/);
});

// revert: src/lib/views/system/workbench/Catalogue.svelte:101 => delete
test("a catalogue moved onto a page of the reader's own opens a view on that page", async ({
    page
}) => {
    await boot(page);
    await showRailPage(page, 'focus');
    await showRailPage(page, 'projects');
    await openView(page, 'catalogue', t('views.catalogue'));
    const catalogue = page.locator(`${SHOWN_VIEW} [data-catalogue]`);
    await catalogue.locator('button[data-view="help"]').click();
    // The Projects page stays shown and takes the view, rather than the page shown before it.
    await expect(page.locator('nav [data-rail-page="projects"] button')).toHaveClass(/\bactive\b/);
    await expect(page.getByRole('tab', { name: t('views.help') })).toBeVisible();
});

test('a catalogue press after a load straight onto its page opens the view on the first rail page', async ({
    page
}) => {
    // revert: src/lib/views/system/workbench/Catalogue.svelte:108 => delete
    await boot(page);
    await showRailPage(page, 'views');
    // The reload puts the Views and Settings page on screen with no page shown before it.
    await page.reload();
    await expect(page.locator('nav [data-rail-page="views"] button')).toHaveClass(/\bactive\b/);
    await page.locator(`${SHOWN_VIEW} [data-catalogue] button[data-view="help"]`).click();
    await expect(page.locator('nav [data-rail-page="focus"] button')).toHaveClass(/\bactive\b/);
    await expect(page.getByRole('tab', { name: t('views.help') })).toBeVisible();
    await expect(page.getByRole('tab', { name: t('views.focus') })).toBeVisible();
});

test('a catalogue press on a hub document opens it on the page the reader came from', async ({
    page
}) => {
    // revert: src/lib/views/system/workbench/Catalogue.svelte:117 => delete
    await boot(page);
    await showRailPage(page, 'projects');
    await showRailPage(page, 'views');
    await page
        .locator(`${SHOWN_VIEW} [data-catalogue] button[data-doc="docs/RESEARCH-APPROACH.md"]`)
        .click();
    await expect(page.locator('nav [data-rail-page="projects"] button')).toHaveClass(/\bactive\b/);
    await expect(page.getByRole('tab', { name: 'Research approach' })).toBeVisible();
});

test('a shift-press after a load straight onto the catalogue opens beside on the first rail page', async ({
    page
}) => {
    // revert: src/lib/views/system/workbench/Catalogue.svelte:118 => if (event.shiftKey) openView(view, state);
    await boot(page);
    await showRailPage(page, 'views');
    await page.reload();
    await expect(page.locator('nav [data-rail-page="views"] button')).toHaveClass(/\bactive\b/);
    await page
        .locator(`${SHOWN_VIEW} [data-catalogue] button[data-view="usage"]`)
        .click({ modifiers: ['Shift'] });
    await expect(page.locator('nav [data-rail-page="focus"] button')).toHaveClass(/\bactive\b/);
    await expect(page.locator('[data-pane]')).toHaveCount(2);
    await expect(
        page
            .locator('[data-pane]')
            .nth(1)
            .getByRole('tab', { name: t('views.usage') })
    ).toBeVisible();
});

test('a catalogue entry dragged onto a pane of its own page opens there, and that page stays on screen', async ({
    page
}) => {
    // revert: src/lib/state/workbench/drag.svelte.ts:290 => const id = held.id;
    await boot(page);
    await showRailPage(page, 'views');
    const entry = page.locator(`${SHOWN_VIEW} [data-catalogue] button[data-view="help"]`);
    const target = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.settings') })
    });
    // The catalogue scrolls inside its pane, and a pointer is put on what the window shows.
    await entry.scrollIntoViewIfNeeded();
    const from = await entry.boundingBox();
    const onto = await target.locator('[data-pane-body]').boundingBox();
    expect(from).not.toBeNull();
    expect(onto).not.toBeNull();
    if (from === null || onto === null) return;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(onto.x + onto.width / 2, onto.y + onto.height / 2, { steps: 12 });
    // While it is held the ghost says the view is being opened.
    await expect(page.getByText(t('ui.drag_open', t('views.help')), { exact: true })).toBeVisible();
    await page.mouse.up();
    await expect(target.getByRole('tab', { name: t('views.help') })).toBeVisible();
    await expect(page.locator('nav [data-rail-page="views"] button')).toHaveClass(/\bactive\b/);
});

/** The pane that holds the Views catalogue's tab, and whether that tab is the one it shows. */
function cataloguePane(page: Page): Locator {
    return page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.catalogue') })
    });
}

test("a catalogue entry's right-click menu opens it on this page clear of the catalogue, or beside it", async ({
    page
}) => {
    // revert: src/lib/state/workbench/layout/open/away.ts:75 => if (false) {
    // revert: src/lib/views/system/workbench/Catalogue.svelte:136 => if (pick === BESIDE) openAway(view, state, page, instance.id);
    await boot(page);
    await showRailPage(page, 'projects');
    await showRailPage(page, 'views');
    const catalogue = page.locator(`${SHOWN_VIEW} [data-catalogue]`);
    const panes = await page.locator('[data-pane]').count();

    await catalogue.locator('button[data-view="help"]').click({ button: 'right' });
    const menu = page.getByRole('menu', { name: t('views.help') });
    await expect(menu.getByRole('menuitem')).toHaveText([
        t('workbench.catalogue_open_here'),
        t('workbench.catalogue_open_beside')
    ]);
    await menu.getByRole('menuitem', { name: t('workbench.catalogue_open_here') }).click();
    await expect(page.locator('nav [data-rail-page="views"] button')).toHaveClass(/\bactive\b/);
    await expect(page.getByRole('tab', { name: t('views.help') })).toBeVisible();
    await expect(page.locator('[data-pane]')).toHaveCount(panes);
    // Help opened in another pane of the page, so the catalogue is still the tab its pane shows.
    await expect(cataloguePane(page)).toHaveAttribute('data-pane-view', 'catalogue');
    // The catalogue's own pane took no tab: the view went to the other pane of the page.
    await expect(cataloguePane(page).getByRole('tab', { name: t('views.help') })).toHaveCount(0);

    await catalogue.locator('button[data-view="usage"]').click({ button: 'right' });
    await page
        .getByRole('menu', { name: t('views.usage') })
        .getByRole('menuitem', { name: t('workbench.catalogue_open_beside') })
        .click();
    await expect(page.locator('nav [data-rail-page="views"] button')).toHaveClass(/\bactive\b/);
    await expect(page.locator('[data-pane]')).toHaveCount(panes + 1);
    await expect(page.getByRole('tab', { name: t('views.usage') })).toBeVisible();
    await expect(cataloguePane(page)).toHaveAttribute('data-pane-view', 'catalogue');
});

test('Open beside on this page leaves a view already open in another pane of the page where it is', async ({
    page
}) => {
    // revert: src/lib/state/workbench/layout/open/away.ts:53 => if (false) return id;
    await boot(page);
    await showRailPage(page, 'views');
    const settings = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.settings') })
    });
    await expect(settings).toHaveCount(1);
    const panes = await page.locator('[data-pane]').count();
    const catalogue = page.locator(`${SHOWN_VIEW} [data-catalogue]`);
    await catalogue.locator('button[data-view="settings"]').click({ button: 'right' });
    await page
        .getByRole('menu', { name: t('views.settings') })
        .getByRole('menuitem', { name: t('workbench.catalogue_open_beside') })
        .click();
    // Settings is activated in the pane it was in, above Pages in the right-hand column, and was
    // not moved out into a new pane beside the catalogue.
    await expect(page.locator('[data-pane]')).toHaveCount(panes);
    await expect(settings).toHaveAttribute('data-pane-view', 'settings');
    await expect(page.getByRole('tab', { name: t('views.settings') })).toHaveCount(1);
    const pages = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.pages') })
    });
    const above = await settings.boundingBox();
    const below = await pages.boundingBox();
    if (above === null || below === null) throw new Error('no Settings or Pages pane box');
    expect(Math.abs(above.x - below.x)).toBeLessThan(2);
    expect(above.y).toBeLessThan(below.y);
});

test('Open on this page opens beside a catalogue whose pane is the page only one', async ({
    page
}) => {
    // revert: src/lib/state/workbench/layout/open/away.ts:68 => if (other === undefined) return openView(view, state, page);
    await boot(page);
    await openView(page, 'catalogue', t('views.catalogue'));
    await expect(page.locator('[data-pane]')).toHaveCount(1);
    await page
        .locator(`${SHOWN_VIEW} [data-catalogue] button[data-view="help"]`)
        .click({ button: 'right' });
    await page
        .getByRole('menu', { name: t('views.help') })
        .getByRole('menuitem', { name: t('workbench.catalogue_open_here') })
        .click();
    await expect(page.locator('[data-pane]')).toHaveCount(2);
    await expect(page.getByRole('tab', { name: t('views.help') })).toBeVisible();
    await expect(cataloguePane(page)).toHaveAttribute('data-pane-view', 'catalogue');
});

/**
 * One pane holding Status, the catalogue, Help and Config in that order, the catalogue shown: Help
 * is a tab of the catalogue's pane with another tab after it, which is the tab the pane would show
 * once Help moved out.
 */
async function catalogueBesideHelp(page: Page): Promise<void> {
    await boot(page);
    await openView(page, 'catalogue', t('views.catalogue'));
    await openView(page, 'help', t('views.help'));
    await openView(page, 'config', t('views.config'));
    await page.getByRole('tab', { name: t('views.catalogue') }).click();
    await expect(cataloguePane(page)).toHaveAttribute('data-pane-view', 'catalogue');
}

/** Pick one item of a catalogue entry's right-click menu. */
async function openFromMenu(page: Page, view: string, label: string, item: string): Promise<void> {
    await page
        .locator(`${SHOWN_VIEW} [data-catalogue] button[data-view="${view}"]`)
        .click({ button: 'right' });
    await page.getByRole('menu', { name: label }).getByRole('menuitem', { name: item }).click();
}

test("Open on this page moves a view out of the catalogue's only pane and leaves the catalogue shown", async ({
    page
}) => {
    // revert: src/lib/state/workbench/layout/open/away.ts:55 => delete
    await catalogueBesideHelp(page);
    await expect(page.locator('[data-pane]')).toHaveCount(1);
    await openFromMenu(page, 'help', t('views.help'), t('workbench.catalogue_open_here'));
    await expect(page.locator('[data-pane]')).toHaveCount(2);
    const help = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.help') })
    });
    await expect(help).toHaveAttribute('data-pane-view', 'help');
    // Help moved out of the catalogue's pane into the new one, so that pane keeps no tab of it.
    await expect(cataloguePane(page).getByRole('tab', { name: t('views.help') })).toHaveCount(0);
    // Config, the tab after Help, is still a tab of the pane, and the pane shows the catalogue.
    await expect(cataloguePane(page).getByRole('tab', { name: t('views.config') })).toHaveCount(1);
    await expect(cataloguePane(page)).toHaveAttribute('data-pane-view', 'catalogue');
});

test("Open on this page moves a view out of the catalogue's pane into the pane beside it and leaves the catalogue shown", async ({
    page
}) => {
    // revert: src/lib/state/workbench/layout/open/away.ts:77 => delete
    await catalogueBesideHelp(page);
    await openFromMenu(page, 'usage', t('views.usage'), t('workbench.catalogue_open_beside'));
    await expect(page.locator('[data-pane]')).toHaveCount(2);
    const usage = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.usage') })
    });
    await expect(usage).toHaveAttribute('data-pane-view', 'usage');
    // The catalogue's pane is where the reader is when its entry is pressed.
    await page.getByRole('tab', { name: t('views.catalogue') }).click();
    await openFromMenu(page, 'help', t('views.help'), t('workbench.catalogue_open_here'));
    await expect(page.locator('[data-pane]')).toHaveCount(2);
    await expect(usage).toHaveAttribute('data-pane-view', 'help');
    // Help went to the end of the other pane's strip, so the catalogue's pane keeps no tab of it.
    await expect(cataloguePane(page).getByRole('tab', { name: t('views.help') })).toHaveCount(0);
    await expect(cataloguePane(page).getByRole('tab', { name: t('views.config') })).toHaveCount(1);
    await expect(cataloguePane(page)).toHaveAttribute('data-pane-view', 'catalogue');
});

test("a catalogue entry dropped on the catalogue's own pane opens in another pane of the page", async ({
    page
}) => {
    // revert: src/lib/state/workbench/drag.svelte.ts:284 => if (false) {
    await boot(page);
    await showRailPage(page, 'views');
    const entry = page.locator(`${SHOWN_VIEW} [data-catalogue] button[data-view="help"]`);
    await entry.scrollIntoViewIfNeeded();
    const from = await entry.boundingBox();
    const onto = await cataloguePane(page).locator('.strip').first().boundingBox();
    if (from === null || onto === null) throw new Error('no entry or strip box');
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(onto.x + onto.width / 2, onto.y + onto.height / 2, { steps: 12 });
    await page.mouse.up();
    await expect(page.getByRole('tab', { name: t('views.help') })).toBeVisible();
    // A drop on the catalogue's own strip is sent to another pane, so that strip took no tab.
    await expect(cataloguePane(page).getByRole('tab', { name: t('views.help') })).toHaveCount(0);
    await expect(cataloguePane(page)).toHaveAttribute('data-pane-view', 'catalogue');
});

test("a catalogue entry dropped on an edge of the catalogue's own pane opens in a new pane beside it", async ({
    page
}) => {
    // revert: src/lib/state/workbench/drag.svelte.ts:294 => else sink.transfer(id, drop.path, AT_END, drop.page);
    await boot(page);
    await showRailPage(page, 'views');
    const panes = await page.locator('[data-pane]').count();
    const entry = page.locator(`${SHOWN_VIEW} [data-catalogue] button[data-view="help"]`);
    await entry.scrollIntoViewIfNeeded();
    const from = await entry.boundingBox();
    const onto = await cataloguePane(page).locator('[data-pane-body]').boundingBox();
    if (from === null || onto === null) throw new Error('no entry or pane body box');
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(onto.x + onto.width - 8, onto.y + onto.height / 2, { steps: 12 });
    await page.mouse.up();
    await expect(page.locator('[data-pane]')).toHaveCount(panes + 1);
    await expect(page.getByRole('tab', { name: t('views.help') })).toBeVisible();
    // The catalogue's pane took no tab and still shows the catalogue.
    await expect(cataloguePane(page).getByRole('tab', { name: t('views.help') })).toHaveCount(0);
    await expect(cataloguePane(page)).toHaveAttribute('data-pane-view', 'catalogue');
});

test("the keyboard opens a catalogue entry's menu with Shift+F10, and its choice opens the view", async ({
    page
}) => {
    // revert: src/lib/ui/menu/ContextMenu.svelte:71 => return;
    await boot(page);
    await showRailPage(page, 'views');
    const help = page.locator(`${SHOWN_VIEW} [data-catalogue] button[data-view="help"]`);
    await help.focus();
    await page.keyboard.press('Shift+F10');
    const menu = page.getByRole('menu', { name: t('views.help') });
    await expect(menu.getByRole('menuitem').first()).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('tab', { name: t('views.help') })).toBeVisible();
    await expect(page.locator('nav [data-rail-page="views"] button')).toHaveClass(/\bactive\b/);
});

test('a tooltip on a hovered control closes when the palette takes the focus', async ({ page }) => {
    await boot(page);
    const button = page.locator('nav [data-rail-page] button').first();
    await button.hover();
    const bubble = page.locator('span.bubble:not([hidden])');
    await expect(bubble).toHaveCount(1);

    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog', { name: t('app.search') })).toBeVisible();
    // the palette took the focus, and the bubble belongs to the control the pointer is on
    await expect(bubble).toHaveCount(0);
});

test('a tooltip describes the control it wraps, and not the wrapper around it', async ({
    page
}) => {
    await boot(page);
    const button = page.locator('nav [data-rail-page] button').first();
    const id = await button.getAttribute('aria-describedby');
    expect(id).toMatch(/^tip-\d+$/);
    await expect(page.locator(`#${id}`)).toHaveAttribute('role', 'tooltip');
    expect(await page.locator('span.tip[aria-describedby]').count()).toBe(0);
});

test('a long tag value ends in an ellipsis inside its card', async ({ page }) => {
    const card = await projectCard(page);
    const label = card.locator('.tag .label').filter({ hasText: LONG_PILLAR }).first();
    await expect(label).toBeVisible();

    expect(await clipped(label)).toBe(true);
    expect(await within(label, card)).toBe(true);
    expect(await label.evaluate((el) => getComputedStyle(el).textOverflow)).toBe('ellipsis');
});

// A cross-link group is the width of its card, and a domain card is the width of the pane, so the
// long title is measured in a window a reader can have rather than in one no title is long enough
// for.
test.describe('in a narrow window', () => {
    test.use({ viewport: { width: 420, height: 900 } });

    test('a long cross-link title ends in an ellipsis inside its card', async ({ page }) => {
        await boot(page);
        await openView(page, 'domains', t('views.domains'));
        const card = page.locator('[data-domain="method"]').first();
        await expect(card).toBeVisible();

        // The groups are closed until they are asked for, and which group holds an idea is the
        // view's business rather than this spec's, so every group of the card is opened.
        const groups = card.locator('button.disclosure');
        const many = await groups.count();
        for (let at = 0; at < many; at += 1) await groups.nth(at).click();

        const label = card.locator('.member .label').filter({ hasText: LONG_PROJECT }).first();
        await expect(label).toBeVisible();
        expect(await label.evaluate((el) => getComputedStyle(el).textOverflow)).toBe('ellipsis');
        expect(await clipped(label)).toBe(true);
        expect(await within(label, card)).toBe(true);
    });
});

test('an intro filters a hub value and draws a catalog line as it is written', async ({ page }) => {
    const alerts: string[] = [];
    page.on('dialog', (dialog) => {
        alerts.push(dialog.message());
        void dialog.dismiss();
    });
    await boot(page);

    await openView(page, 'tasks', t('views.tasks'));
    const hubIntro = page.locator(`${SHOWN_VIEW} .intro`).first();
    await expect(hubIntro).toBeVisible();
    await expect(hubIntro).toContainText('Standing tasks');
    // the intro is markup from the hub file, so the filter takes the script out of it
    await expect(hubIntro.locator('script')).toHaveCount(0);
    await expect(hubIntro).not.toContainText('alert(1)');

    await openView(page, 'domains', t('views.domains'));
    const catalogIntro = page.locator(`${SHOWN_VIEW} .intro`).first();
    await expect(catalogIntro.locator('b').first()).toHaveText('application domain');
    expect(alerts).toEqual([]);
});

// revert: src/lib/ui/tree/TreeItem.svelte:275 => flex: 0 1 auto;
test("a tree row's controls sit at the pane's right edge, one column down the list", async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.locator('[data-fs-row="hub:"]').getByRole('button').first().click();
    const file = page.locator('[data-fs-row="hub:README.md"] [role="treeitem"]');
    const other = page.locator('[data-fs-row="hub:CAREER.yml"] [role="treeitem"]');
    await expect(file).toBeVisible();
    await expect(other).toBeVisible();

    /** The right edge of a row's controls while the pointer rests on it, and of the row. */
    async function edges(row: typeof file): Promise<{ controls: number; row: number }> {
        await row.hover();
        const actions = row.locator('.actions').first();
        await expect(actions).toBeVisible();
        const [rowBox, actionBox] = await Promise.all([row.boundingBox(), actions.boundingBox()]);
        if (rowBox === null || actionBox === null) throw new Error('a row drew no box');
        return { controls: actionBox.x + actionBox.width, row: rowBox.x + rowBox.width };
    }

    const one = await edges(file);
    const two = await edges(other);
    // the controls of both rows end at the same place, whatever the length of the name
    expect(Math.abs(one.controls - two.controls)).toBeLessThan(2);
    // and that place is the row's own right edge, the pane's width
    expect(one.row - one.controls).toBeLessThan(24);
});

// revert: src/lib/ui/tree/TreeItem.svelte:219 => over={undefined}
test("a tree row's words open while the pointer is anywhere over the row", async ({ page }) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const row = page.locator('[data-fs-row="hub:"] [role="treeitem"]').first();
    await expect(row).toBeVisible();
    const box = await row.boundingBox();
    expect(box).not.toBeNull();
    if (box === null) return;

    // the row's own edge, outside the name's words: the name's button fills the row's free width,
    // and the controls at the right edge carry words of their own
    await page.mouse.move(box.x + 1, box.y + box.height / 2);
    await expect(page.locator('span.bubble:not([hidden])')).toHaveCount(1);
});

// revert: src/lib/ui/tree/TreeItem.svelte:190 => delete
test("a press on a tree row's own space opens it, as a press on its name does", async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.locator('[data-fs-row="hub:"]').getByRole('button').first().click();
    const row = page.locator('[data-fs-row="hub:README.md"] [role="treeitem"]');
    await expect(row).toBeVisible();
    const box = await row.boundingBox();
    expect(box).not.toBeNull();
    if (box === null) return;

    // the space past the row's parts, which the name's own button no longer covers
    await page.mouse.click(box.x + box.width - 20, box.y + box.height / 2);
    await expect(page.getByRole('tab', { name: 'README.md' })).toHaveCount(1);
});
