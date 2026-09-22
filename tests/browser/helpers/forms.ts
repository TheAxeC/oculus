// What the form specs share: the ui store's per-instance records as the browser's own storage holds
// them, the keys of those that hold entry form drafts, and a tab switched away from and back to,
// with the view checked to be gone in between, since a pane mounts only its active tab.

import { expect, type Locator, type Page } from '@playwright/test';
import { t, tabNamed } from './words.ts';

/** The ui store's per-instance records, by key, as the browser's storage holds them now. */
export async function uiInstances(page: Page): Promise<Record<string, unknown>> {
    const raw = await page.evaluate(() => localStorage.getItem('oculus.ui.v1'));
    if (raw === null) return {};
    const held = JSON.parse(raw) as { instances?: Record<string, unknown> };
    return held.instances ?? {};
}

/** The ui store keys holding form drafts in the browser's storage. */
export async function draftKeys(page: Page): Promise<string[]> {
    return Object.keys(await uiInstances(page)).filter((key) => key.endsWith('#forms'));
}

/**
 * Leave a tab for the Status tab of the same pane and come back to it: `view` is a locator inside
 * the tab's view, which is gone while Status is shown and drawn again after the return.
 */
export async function switchAndBack(page: Page, tab: string, view: Locator): Promise<void> {
    await page.getByRole('tab', { name: tabNamed(t('views.status')) }).click();
    await expect(view).toHaveCount(0);
    await page.getByRole('tab', { name: tabNamed(tab) }).click();
    await expect(view).toBeVisible();
}
