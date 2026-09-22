// Opening the page, and opening a view from the rail. Every spec but boot.spec.ts starts with both.
//
// boot() waits for the socket line of views/system/status/Status.svelte, which is the default tab:
// the rail is drawn from the config the socket carries, so the rail on the server's HTML is not the
// rail the reader ends up with, and a locator counted before that line appears counts the wrong
// one.
//
// shell/rail/ActivityRail.svelte draws a small group as one button per view, carrying `data-view`,
// and a group of more than four as one menu whose list holds the same ids. So openView tries the
// button first and walks the group menus after it, which means a view moving between groups in
// config/layout.yml costs no spec a change.

import { expect, type Page } from '@playwright/test';
import { t } from './words.ts';

/**
 * Open the application and wait until the socket is up, the first snapshot is in, and the rail is
 * the one the reader ends up with.
 *
 * The groups come from the configuration the socket pushes, so until that push lands the rail has no
 * groups at all and draws every view as its own button. The push then puts the large groups into
 * flyouts, which takes those buttons out of the page; a click that started on one is a click on an
 * element the retry finds detached. So the wait is for `data-group` to exist, which the rail draws
 * only after the push and only for a group of more than GROUP_MAX views: config/layout.yml's
 * `nav_groups` has several such groups, and a configuration whose groups were all small would leave
 * this waiting, since there would then be no flyout to wait for.
 */
export async function boot(page: Page): Promise<void> {
    await page.goto('/');
    await expect(page.getByText(t('app.socket', t('app.socket_open')))).toBeVisible();
    await expect(page.locator('nav button[data-view]').first()).toBeVisible();
    await expect(page.locator('nav [data-group]').first()).toBeVisible();
}

/** Open a registered view in the pane a view lands in, by its id and the words the rail calls it. */
export async function openView(page: Page, view: string, label: string): Promise<void> {
    const direct = page.locator(`nav button[data-view="${view}"]`);
    if ((await direct.count()) > 0) {
        await direct.click();
        await expect(page.getByRole('tab', { name: label })).toBeVisible();
        return;
    }
    const groups = page.locator('nav [data-group]');
    const many = await groups.count();
    for (let at = 0; at < many; at += 1) {
        await groups.nth(at).getByRole('button').first().click();
        const item = page.getByRole('menuitem', { name: label, exact: true });
        if ((await item.count()) > 0) {
            await item.click();
            await expect(page.getByRole('tab', { name: label })).toBeVisible();
            return;
        }
        await page.keyboard.press('Escape');
    }
    throw new Error(`the rail offers no view ${view}`);
}
