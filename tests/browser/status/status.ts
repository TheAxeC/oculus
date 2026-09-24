// The status bar specs' own helpers: an item of the bar by the name its `data-status` gives it,
// and a boot onto one page holding the tabs a case names, so a case about a source tab starts with
// that tab on screen and needs no other view to open it.

import { expect, type Locator, type Page } from '@playwright/test';
import { t } from '../helpers/words.ts';

/** The browser storage key the layout is saved under, state/workbench/layout/saved/storage.ts's. */
const LAYOUT_KEY = 'oculus.layout.v1';

/** The browser storage key the appearance is saved under, state/workbench/ui.svelte.ts's. */
export const UI_KEY = 'oculus.ui.v1';

/** One tab of the page a case boots onto: its id, its view and its state. */
export type SeedTab = { id: string; view: string; state: unknown };

/** One item of the status bar, by its `data-status`. */
export function item(page: Page, name: string): Locator {
    return page.locator(`[data-status-bar] [data-status="${name}"]`);
}

/** The button of one item. */
export function button(page: Page, name: string): Locator {
    return item(page, name).locator('button').first();
}

/**
 * Open the application on one page holding these tabs, the first on screen, with the layout put
 * in the browser's storage before the page's own script runs, on the first load alone, so a
 * reload reads what the page saved since. `ui` seeds the appearance envelope the same way.
 */
export async function bootOn(page: Page, tabs: SeedTab[], ui?: unknown): Promise<void> {
    const layout = JSON.stringify({
        version: 4,
        pages: [
            {
                id: 'status-spec-page',
                label: t('ui.page_default', 1),
                workbench: { root: { kind: 'pane', tabs, active: tabs[0].id } }
            }
        ],
        current: 'status-spec-page'
    });
    await page.addInitScript(
        ({ layoutKey, layoutValue, uiKey, uiValue }) => {
            try {
                if (localStorage.getItem(layoutKey) === null) {
                    localStorage.setItem(layoutKey, layoutValue);
                }
                if (uiValue !== '' && localStorage.getItem(uiKey) === null) {
                    localStorage.setItem(uiKey, uiValue);
                }
            } catch {
                // A storage the browser refuses leaves the page to start as a fresh one would.
            }
        },
        {
            layoutKey: LAYOUT_KEY,
            layoutValue: layout,
            uiKey: UI_KEY,
            uiValue: ui === undefined ? '' : JSON.stringify(ui)
        }
    );
    await page.goto('/');
    await expect(button(page, 'server')).toHaveText(t('statusbar.server_open'));
    await expect(page.locator('nav [data-rail-page] button').first()).toBeVisible();
}

/** A source tab over one file of a served root, as the file browser opens one. */
export function sourceTab(id: string, root: string, path: string): SeedTab {
    return { id, view: 'source', state: { root, path, label: path.split('/').at(-1) ?? path } };
}
