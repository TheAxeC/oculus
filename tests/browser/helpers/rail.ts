// Opening the page, opening a view, and showing a rail page. Every spec but boot.spec.ts starts
// with the first.
//
// boot() opens the application for a reader whose saved layout is one page holding the Status tab
// alone, which is the neutral page a spec about anything else starts from, and bootFresh() for a
// browser with no saved layout, which starts on the first rail page. Both wait for the server item
// of the status bar to say the socket is up and for the rail's page buttons: the rail's pages are
// drawn from the config the socket carries, so the rail on the server's HTML is not the rail the
// reader ends up with, and a locator counted before then counts the wrong one.
//
// openView() opens a view in the page on screen through the palette's `:tab` command, which is the
// path that opens any registered view where a view lands without leaving the page: the Views
// catalogue does the same from its own page, and a spec that is not about the catalogue should not
// have to switch to that page and back. pickTheme() puts a theme on through the palette's `:theme`
// command for the same reason, and inSettings() is the way to the other appearance controls, which
// the Settings view holds alone. bookmarkFiles() and openBookmark() read and open the rail's
// Bookmarks menu, whose choices are drawn only while it is open.

import { expect, type Locator, type Page } from '@playwright/test';
import { t } from './words.ts';

/**
 * The selector of the view a pane shows. A pane keeps the view of every tab it has shown mounted
 * and hidden while another tab is shown, so a selector over a pane's views reaches through this to
 * the one on screen.
 */
export const SHOWN_VIEW = '[data-tab-view]:not([hidden])';

/**
 * A point on the window's own ground, outside the rail, every pane and every control: the work
 * area's 4 px margin just right of the 48 px rail, at the top edge. A press there takes the focus
 * off whatever holds it and leaves it in no pane.
 */
export const GROUND = { x: 50, y: 2 };

/** The browser storage key the layout is saved under, state/workbench/layout/saved/storage.ts's. */
const LAYOUT_KEY = 'oculus.layout.v1';

/**
 * The saved layout boot() starts from: one page, named as the first default page is, holding the
 * Status tab alone. It is written in the envelope state/workbench/layout/saved/saved.ts reads.
 */
const STATUS_PAGE = JSON.stringify({
    version: 4,
    pages: [
        {
            id: 'status-page',
            label: t('ui.page_default', 1),
            workbench: {
                root: {
                    kind: 'pane',
                    tabs: [{ id: 'status-tab', view: 'status', state: null }],
                    active: 'status-tab'
                }
            }
        }
    ],
    current: 'status-page'
});

/** Wait until the socket is up and the rail's page buttons are drawn from the pushed config. */
async function settled(page: Page): Promise<void> {
    await expect(page.locator('[data-status-bar] [data-status="server"] button')).toHaveText(
        t('statusbar.server_open')
    );
    await expect(page.locator('nav [data-rail-page] button').first()).toBeVisible();
}

/**
 * Open the application for a reader whose saved layout is the one Status page. The layout is put
 * in the browser's storage before the page's own script runs, on the first load alone, so a reload
 * reads what the page saved since.
 */
export async function boot(page: Page): Promise<void> {
    await page.addInitScript(
        ({ key, value }) => {
            try {
                if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
            } catch {
                // A storage the browser refuses leaves the page to start as a fresh one would.
            }
        },
        { key: LAYOUT_KEY, value: STATUS_PAGE }
    );
    await page.goto('/');
    await settled(page);
    await expect(page.getByRole('tab', { name: t('views.status') })).toBeVisible();
}

/**
 * Open the application in a browser with no saved layout, which starts on the first rail page once
 * the config push has landed; its button is then drawn as the one in force.
 */
export async function bootFresh(page: Page): Promise<void> {
    await page.goto('/');
    await settled(page);
    await expect(page.locator('nav [data-rail-page] button').first()).toHaveClass(/\bactive\b/);
}

/**
 * Open a registered view in the pane a view lands in, by its id, and wait for the tab the rail
 * names with its label.
 */
export async function openView(page: Page, view: string, label: string): Promise<void> {
    await page.keyboard.press('ControlOrMeta+k');
    const box = page.getByPlaceholder(t('app.palette.cmdk_placeholder'));
    await expect(box).toBeFocused();
    await box.fill(`:tab ${view}`);
    await box.press('Enter');
    await expect(box).toHaveCount(0);
    await expect(page.getByRole('tab', { name: label })).toBeVisible();
}

/** Press the rail button of one page, by the arrangement key its `rail:` entry names. */
export async function showRailPage(page: Page, key: string): Promise<void> {
    await page.locator(`nav [data-rail-page="${key}"] button`).click();
}

/**
 * Put a theme on through the palette's `:theme` command, by the name config/appearance.yml gives
 * it, and wait until the page draws it: the light theme puts no class on the body.
 */
export async function pickTheme(page: Page, name: string): Promise<void> {
    await page.keyboard.press('ControlOrMeta+k');
    const box = page.getByPlaceholder(t('app.palette.cmdk_placeholder'));
    await expect(box).toBeFocused();
    await box.fill(`:theme ${name}`);
    await box.press('Enter');
    await expect(box).toHaveCount(0);
    const drawn = name === 'light' ? /^(?!.*\b(dark|rice)\b)/ : new RegExp(`\\b${name}\\b`);
    await expect(page.locator('body')).toHaveClass(drawn);
}

/**
 * Press controls of the Settings view on the Views and Settings page, then come back to the Status
 * page boot() starts on: the appearance controls live there and nowhere else, and a spec about
 * another view asks them from there.
 */
export async function inSettings(
    page: Page,
    press: (settings: Locator) => Promise<void>
): Promise<void> {
    await showRailPage(page, 'views');
    const settings = page.locator(`${SHOWN_VIEW} [data-settings-view]`);
    await expect(settings).toBeVisible();
    await press(settings);
    await page
        .locator(`${SHOWN_VIEW} [data-pages] [data-page-row="${t('ui.page_default', 1)}"]`)
        .getByRole('button', { name: t('workbench.pages_open') })
        .click();
    await expect(page.locator('nav [data-rail-page] button.active')).toHaveCount(0);
}

/** The row of one page in the Pages view on screen, by the name the view calls it. */
export function pagesRow(page: Page, name: string): Locator {
    return page.locator(`${SHOWN_VIEW} [data-pages] [data-page-row="${name}"]`);
}

/**
 * Make a page from the Pages view on the Views and Settings page, which shows it at once: the new
 * page is on screen, on the default view.
 */
export async function makePage(page: Page): Promise<void> {
    await showRailPage(page, 'views');
    await page
        .locator(`${SHOWN_VIEW} [data-pages]`)
        .getByRole('button', { name: t('ui.page_new') })
        .click();
    await expect(page.locator('nav [data-rail-page] button.active')).toHaveCount(0);
}

/** Show one page by its name, from the Pages view on the Views and Settings page. */
export async function showPage(page: Page, name: string): Promise<void> {
    await showRailPage(page, 'views');
    await pagesRow(page, name)
        .getByRole('button', { name: t('workbench.pages_open') })
        .click();
}

/**
 * A second page, made from a Pages view opened on the first, and the first page shown again from a
 * Pages view opened on the second; the first page is left holding its Status tab alone and the
 * second its Status and Pages tabs. No Views and Settings page is made, so the two pages are the
 * only ones there are.
 */
export async function twoPages(page: Page): Promise<void> {
    await openView(page, 'pages', t('views.pages'));
    await page
        .locator('[data-pages]')
        .getByRole('button', { name: t('ui.page_new') })
        .click();
    // The new page is on screen with its Status tab alone, so no Pages view is drawn on it yet.
    await expect(pagesRow(page, t('ui.page_default', 2))).toHaveCount(0);
    await openView(page, 'pages', t('views.pages'));
    await pagesRow(page, t('ui.page_default', 1))
        .getByRole('button', { name: t('workbench.pages_open') })
        .click();
    const first = page.locator('[data-pane]').first();
    await first
        .locator('.tab', { has: page.getByRole('tab', { name: t('views.pages') }) })
        .getByRole('button', { name: t('ui.close_tab') })
        .click();
    await expect(first.getByRole('tab')).toHaveCount(1);
}

/** The rail's Bookmarks menu opener. */
function bookmarksOpener(page: Page): Locator {
    return page.locator('nav').getByRole('button', { name: t('ui.docs'), exact: true });
}

/**
 * The files the rail's Bookmarks menu lists, each as the `root/path` its choice names, read by
 * opening the menu and closing it again. The choice that says there is none names no file.
 */
export async function bookmarkFiles(page: Page): Promise<string[]> {
    await bookmarksOpener(page).click();
    const menu = page.getByRole('menu', { name: t('ui.docs') });
    await expect(menu).toBeVisible();
    const titles = await menu
        .getByRole('menuitem')
        .evaluateAll((items) => items.map((one) => one.getAttribute('title') ?? ''));
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    return titles.filter((title) => title !== t('ui.bookmarks_none_tip'));
}

/** Open one bookmark from the rail's Bookmarks menu, by the `root/path` its choice names. */
export async function openBookmark(page: Page, file: string): Promise<void> {
    await bookmarksOpener(page).click();
    await page
        .getByRole('menu', { name: t('ui.docs') })
        .locator(`[role="menuitem"][title="${file}"]`)
        .click();
}
