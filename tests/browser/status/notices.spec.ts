// The notifications in Chrome: a rail write the server refuses is said in a notification and in no
// fixed line beside the rail; the notification shows as a toast over the status bar's right end
// for eight seconds, counts on the bell, and lists in the centre the bell opens with its time and
// its action, where Clear and Clear All take it away; Do Not Disturb stops the toast, keeps the
// entry, and is still on after a reload.
//
// The refusal is the server's answer to the rail write, which the case stands in for by answering
// POST /api/write itself, so the engine's layout.yml is never written.

import { expect, test, type Page } from '@playwright/test';
import { SHOWN_VIEW, boot, showRailPage } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';
import { button } from './status.ts';

/** The sentence a rail write refused for an unwritable file comes to. */
const REFUSED = t('workbench.rail_refused', t('workbench.rail_unwritable'));

/** Answer every rail write as the server does when layout.yml cannot be written. */
async function refuseRailWrites(page: Page): Promise<void> {
    await page.route('**/api/write', async (route) => {
        const body = route.request().postDataJSON() as { kind?: string } | null;
        if (body?.kind !== 'rail') {
            await route.continue();
            return;
        }
        await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ ok: false, error: 'unwritable', changed: [], refused: [] })
        });
    });
}

/** Hide one rail page through its right-click menu, which writes the rail list. */
async function hideRailPage(page: Page, key: string): Promise<void> {
    await page.locator(`nav [data-rail-page="${key}"] button`).click({ button: 'right' });
    await page.getByRole('menuitem', { name: t('ui.rail_hide') }).click();
}

/** The toasts on screen. */
function toasts(page: Page) {
    return page.locator('[data-toast]');
}

/** The centre, once the bell has opened it. */
function centre(page: Page) {
    return page.locator('[data-notice-centre]');
}

// revert: src/lib/shell/rail/ActivityRail.svelte:84 => if (refused === '' || refused !== '') return;
test('a rail write the server refuses posts a notification, and no line is drawn beside the rail', async ({
    page
}) => {
    await refuseRailWrites(page);
    await boot(page);
    await hideRailPage(page, 'inbox');
    await expect(toasts(page)).toHaveCount(1);
    await expect(toasts(page)).toContainText(REFUSED);
    await expect(toasts(page)).toHaveAttribute('role', 'alert');
    // The rail keeps its button, and holds no line of its own saying why.
    await expect(page.locator('nav [data-rail-page="inbox"]')).toHaveCount(1);
    // The rail draws no line of its own for the refused write.
    await expect(page.locator('.refusal')).toHaveCount(0);
    // Nor does anything in the rail speak up as an alert.
    await expect(page.locator('nav').getByRole('alert')).toHaveCount(0);
    await expect(button(page, 'bell')).toHaveText('1');
    await expect(button(page, 'bell').locator('[data-glyph]')).toHaveAttribute(
        'data-glyph',
        'bell_unread'
    );
});

// revert: src/lib/shell/status/Toast.svelte:23 => const timer = setTimeout(() => settle(id), 60_000);
// revert: src/lib/shell/status/Bell.svelte:98 => left: 8px;
// revert: src/lib/shell/status/NoticeCentre.svelte:112 => left: 8px;
test('a toast goes after eight seconds, the bell counts it, and the centre lists it until it is cleared', async ({
    page
}) => {
    await refuseRailWrites(page);
    await boot(page);
    await hideRailPage(page, 'inbox');
    await expect(toasts(page)).toHaveCount(1);
    const shown = Date.now();
    // The toast stands over the bar's right end, 8 px in from it.
    const toast = await toasts(page).boundingBox();
    const under = await page.locator('[data-status-bar]').boundingBox();
    expect((toast?.y ?? 0) + (toast?.height ?? 0)).toBeLessThanOrEqual(under?.y ?? 0);
    expect(
        Math.round((under?.x ?? 0) + (under?.width ?? 0) - ((toast?.x ?? 0) + (toast?.width ?? 0)))
    ).toBe(8);
    await expect(toasts(page)).toHaveCount(0, { timeout: 10_000 });
    // It stood for the eight seconds and not much less.
    expect(Date.now() - shown).toBeGreaterThan(7000);
    await hideRailPage(page, 'calendar');
    await expect(toasts(page)).toHaveCount(1);
    await expect(button(page, 'bell')).toHaveText('2');

    // Opening the centre puts the toast away and marks both seen.
    await button(page, 'bell').click();
    await expect(centre(page)).toBeVisible();
    // Opening the centre puts every toast away, since the centre lists them all.
    await expect(toasts(page)).toHaveCount(0);
    await expect(button(page, 'bell')).toHaveText('');
    const entries = centre(page).locator('[data-notice]');
    await expect(entries).toHaveCount(2);
    await expect(entries.first()).toContainText(REFUSED);
    await expect(entries.first().locator('time')).toHaveText(/^\d\d:\d\d$/);
    // The centre stands over the bar's right end.
    const panel = await centre(page).boundingBox();
    const bar = await page.locator('[data-status-bar]').boundingBox();
    expect((panel?.y ?? 0) + (panel?.height ?? 0)).toBeLessThanOrEqual(bar?.y ?? 0);
    // Its right edge is the bar's, 8 px in, as VS Code's centre stands over the bell.
    const barRight = (bar?.x ?? 0) + (bar?.width ?? 0);
    expect(Math.round(barRight - ((panel?.x ?? 0) + (panel?.width ?? 0)))).toBe(8);

    // Clear takes one away, and Clear All the rest.
    await entries
        .first()
        .getByRole('button', { name: t('statusbar.centre_clear'), exact: true })
        .click();
    await expect(entries).toHaveCount(1);
    await centre(page)
        .getByRole('button', { name: t('statusbar.centre_clear_all'), exact: true })
        .click();
    // Clear All took the last entry away.
    await expect(entries).toHaveCount(0);
    await expect(centre(page)).toContainText(t('statusbar.centre_empty'));

    // Escape hides the centre and gives the keyboard back to the bell.
    await page.keyboard.press('Escape');
    // Escape hid the centre.
    await expect(centre(page)).toHaveCount(0);
    await expect(button(page, 'bell')).toBeFocused();
});

// revert: src/lib/shell/status/NoticeEntry.svelte:46 => <ToolButton label={action.label} onclick={() => undefined} />
test("a notification's action does what it names, from its toast", async ({ page }) => {
    await refuseRailWrites(page);
    await boot(page);
    await hideRailPage(page, 'inbox');
    await toasts(page)
        .getByRole('button', { name: t('statusbar.rail_settings'), exact: true })
        .click();
    await expect(page.locator('[data-tab-view]:not([hidden]) [data-settings-view]')).toBeVisible();
    // Pressing the action answered the toast, which puts it away.
    await expect(toasts(page)).toHaveCount(0);
});

// revert: src/lib/state/client/context.ts:231 => delete
test('a write the server refuses from a view posts a notification beside the line the view draws', async ({
    page
}) => {
    await refuseRailWrites(page);
    await boot(page);
    await showRailPage(page, 'views');
    const settings = page.locator(`${SHOWN_VIEW} [data-settings-view]`);
    await settings
        .getByRole('textbox', { name: t('workbench.rail_label', 1), exact: true })
        .fill('Refused');
    await settings.getByRole('button', { name: t('workbench.rail_save'), exact: true }).click();
    // The view says why in its own line, and the notification says it beside it.
    await expect(settings.getByRole('status')).toContainText(t('workbench.rail_unwritable'));
    await expect(toasts(page)).toHaveCount(1);
    await expect(toasts(page)).toContainText(t('statusbar.notice_write_refused', 'unwritable'));
    await expect(button(page, 'bell')).toHaveText('1');
});

// revert: src/lib/state/workbench/navigation/notices.svelte.ts:71 => toast: true
test('Do Not Disturb stops the toast and keeps the entry, and is still on after a reload', async ({
    page
}) => {
    await refuseRailWrites(page);
    await boot(page);
    await button(page, 'bell').click();
    const quiet = centre(page).getByRole('button', {
        name: t('statusbar.centre_quiet'),
        exact: true
    });
    await quiet.click();
    await expect(quiet).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await expect(button(page, 'bell').locator('[data-glyph]')).toHaveAttribute(
        'data-glyph',
        'bell_quiet'
    );

    await hideRailPage(page, 'inbox');
    await expect(button(page, 'bell')).toHaveText('1');
    // Do Not Disturb keeps the notification off the screen, in the list alone.
    await expect(toasts(page)).toHaveCount(0);
    await button(page, 'bell').click();
    await expect(centre(page).locator('[data-notice]')).toContainText(REFUSED);

    await page.reload();
    await expect(button(page, 'bell').locator('[data-glyph]')).toHaveAttribute(
        'data-glyph',
        'bell_quiet'
    );
    await button(page, 'bell').click();
    await expect(
        centre(page).getByRole('button', { name: t('statusbar.centre_quiet'), exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
});
