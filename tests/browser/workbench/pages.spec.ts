// The pages of the workbench: a browser with no saved layout starts on the first rail page; a rail
// button shows its page, made from its arrangement the first time and kept as the reader arranged
// it after that, across a reload too, and draws the badges of the views its page holds; no strip
// of pages is drawn over the panes; and the Pages view on the Views and Settings page makes a
// page, renames one, shows another and closes one, asking first when the page holds more than one
// tab.
//
// Nothing here writes to the hub. The layout lives in the browser's own storage, and Playwright
// gives every test a context of its own: a case that boots starts on a saved page of the Status
// view, and the one case that boots fresh starts on the first rail page.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { SHOWN_VIEW, boot, bootFresh, openView, pagesRow, showRailPage } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';

/** The rail button of one page, by its arrangement key. */
function railButton(page: Page, key: string): Locator {
    return page.locator(`nav [data-rail-page="${key}"] button`);
}

test('a browser with no saved layout opens on the first rail page, and digit 1 shows it again', async ({
    page
}) => {
    // revert: src/lib/shell/Workbench.svelte:155 => if (false) client.layout.startOnRailPage(first.page, first.label, first.node);
    await bootFresh(page);
    await expect(railButton(page, 'focus')).toHaveClass(/\bactive\b/);
    await expect(page.getByRole('tab', { name: t('views.focus') })).toBeVisible();
    // The first rail page is the one page there was: no page no button owns was made.
    await showRailPage(page, 'views');
    await expect(page.locator(`${SHOWN_VIEW} [data-pages] [data-page-row]`)).toHaveCount(2);
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('1');
    await expect(railButton(page, 'focus')).toHaveClass(/\bactive\b/);
});

test('a browser with no saved layout draws no page before its first rail page', async ({
    page
}) => {
    // revert: src/lib/shell/Workbench.svelte:248 => {#if false}
    // Every tab name drawn from the first paint on, so a page drawn and replaced is seen too.
    await page.addInitScript(() => {
        const seen: string[] = [];
        (window as unknown as { tabsSeen: string[] }).tabsSeen = seen;
        new MutationObserver(() => {
            for (const tab of document.querySelectorAll('[role="tab"]')) {
                const name = tab.textContent.trim();
                if (name !== '' && !seen.includes(name)) seen.push(name);
            }
        }).observe(document, { childList: true, subtree: true });
    });
    await bootFresh(page);
    await expect(page.getByRole('tab', { name: t('views.focus') })).toBeVisible();
    const seen = await page.evaluate(() => (window as unknown as { tabsSeen: string[] }).tabsSeen);
    expect(seen.some((name) => name.startsWith(t('views.status')))).toBe(false);
});

test('a rail page button draws the badges of the views its page holds', async ({ page }) => {
    // revert: src/lib/shell/rail/ActivityRail.svelte:253 => {#if false}
    // revert: src/lib/shell/rail/ActivityRail.svelte:376 => position: absolute; bottom: 0;
    await boot(page);
    await showRailPage(page, 'views');
    // Each view here sits in the arrangement of the rail page named beside it; the demo hub gives
    // the first of them that counts anything a number, which the catalogue draws beside the view.
    const held: [string, string][] = [
        ['projects', 'projects'],
        ['leads', 'feeds'],
        ['repositories', 'explorer'],
        ['audit', 'info'],
        ['inbox', 'inbox']
    ];
    const counted: [string, string][] = [];
    for (const [view, key] of held) {
        const listed = page
            .locator(`${SHOWN_VIEW} [data-catalogue] .entry`, {
                has: page.locator(`button[data-view="${view}"]`)
            })
            .locator('.badge');
        if ((await listed.count()) === 0) continue;
        const text = ((await listed.textContent()) ?? '').trim();
        if (/^\d/.test(text)) counted.push([key, text]);
    }
    expect(counted.map(([key]) => key)).toContain('projects');
    // The Projects page holds Projects, Coauthor and Archive in that tab order, and its button
    // draws their counts in the same order.
    const order: string[] = [];
    for (const view of ['projects', 'coauthor', 'archive']) {
        const badge = page
            .locator(`${SHOWN_VIEW} [data-catalogue] .entry`, {
                has: page.locator(`button[data-view="${view}"]`)
            })
            .locator('.badge');
        order.push(((await badge.textContent()) ?? '').trim());
    }
    const drawn = (
        await page
            .locator('nav [data-rail-page="projects"] [data-rail-badges] .badge')
            .allTextContents()
    ).map((text) => text.trim());
    const at = order.map((text) => drawn.indexOf(text));
    expect(at.every((index) => index >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    // The badges sit under the button, clear of its name.
    const button = await page.locator('nav [data-rail-page="projects"] button').boundingBox();
    const row = await page
        .locator('nav [data-rail-page="projects"] [data-rail-badges]')
        .boundingBox();
    expect(button).not.toBeNull();
    expect(row).not.toBeNull();
    if (button !== null && row !== null)
        expect(row.y).toBeGreaterThanOrEqual(button.y + button.height - 1);
    for (const [key, text] of counted) {
        await expect(
            page
                .locator(`nav [data-rail-page="${key}"] [data-rail-badges] .badge`, {
                    hasText: text
                })
                .first()
        ).toBeVisible();
    }
});

test('a rail button shows its page, and a second press shows it as it was left', async ({
    page
}) => {
    // revert: src/lib/state/workbench/layout.svelte.ts:287 => const found = undefined;
    await boot(page);
    await showRailPage(page, 'projects');
    for (const view of ['views.projects', 'views.coauthor', 'views.archive']) {
        await expect(page.getByRole('tab', { name: t(view) })).toBeVisible();
    }
    await expect(railButton(page, 'projects')).toHaveClass(/\bactive\b/);
    await openView(page, 'help', t('views.help'));

    await showRailPage(page, 'focus');
    await expect(railButton(page, 'focus')).toHaveClass(/\bactive\b/);
    // The Help tab was opened on the Projects page, so the Focus page does not hold it.
    await expect(page.getByRole('tab', { name: t('views.help') })).toHaveCount(0);

    await showRailPage(page, 'projects');
    await expect(page.getByRole('tab', { name: t('views.help') })).toBeVisible();
    await expect(page.getByRole('tab', { name: t('views.projects') })).toBeVisible();
});

test('a rail page the reader rearranged is the same page after a reload', async ({ page }) => {
    // revert: src/lib/state/workbench/layout/saved/saved.ts:298 => delete
    await boot(page);
    await showRailPage(page, 'projects');
    await openView(page, 'help', t('views.help'));
    // Renamed, so after the reload the page is found by its button's key and not by its name.
    await showRailPage(page, 'views');
    const projects = pagesRow(page, 'Projects');
    await projects.getByRole('button', { name: t('workbench.pages_rename') }).click();
    await projects.getByRole('textbox').fill('Mine');
    await projects.getByRole('textbox').press('Enter');
    await expect(pagesRow(page, 'Mine')).toBeVisible();
    await showRailPage(page, 'focus');

    // The reload comes back to the Focus page, so it waits for the rail the config push draws
    // rather than for the Status view's socket line.
    await page.reload();
    await expect(railButton(page, 'focus')).toHaveClass(/\bactive\b/);
    await showRailPage(page, 'projects');
    await expect(page.getByRole('tab', { name: t('views.help') })).toBeVisible();
    await expect(railButton(page, 'projects')).toHaveClass(/\bactive\b/);
});

test('no strip of pages is drawn over the panes', async ({ page }) => {
    // revert: src/lib/shell/Workbench.svelte:244 => <div class="area"><div role="tablist" aria-label="Pages"></div>
    await boot(page);
    // The page on screen is one pane, and its strip is the only list of tabs in the window.
    await expect(page.getByRole('tablist')).toHaveCount(1);
    // The one page there is was never given a name, and nothing draws a tab for a page.
    await expect(page.getByRole('tab', { name: t('ui.page_default', 1) })).toHaveCount(0);
});

test('the Pages view makes a page, renames it, shows another and closes one', async ({ page }) => {
    // revert: src/lib/views/system/workbench/Pages.svelte:106 => if (typed !== '') renamePage(renaming.id, 'Other');
    await boot(page);
    await showRailPage(page, 'views');
    const pages = page.locator(`${SHOWN_VIEW} [data-pages]`);
    await expect(pages).toBeVisible();
    await pages.getByRole('button', { name: t('ui.page_new') }).click();
    // The new page is shown at once, on the default view, and no rail button is its.
    await expect(page.locator('nav [data-rail-page] button.active')).toHaveCount(0);
    await expect(page.getByRole('tab', { name: t('views.status') })).toBeVisible();

    await showRailPage(page, 'views');
    const made = pagesRow(page, t('ui.page_default', 3));
    await expect(made).toBeVisible();
    await made.getByRole('button', { name: t('workbench.pages_rename') }).click();
    const box = made.getByRole('textbox', {
        name: t('workbench.pages_rename_label', t('ui.page_default', 3))
    });
    await expect(box).toBeFocused();
    await box.fill('Renamed');
    await box.press('Enter');
    await expect(pagesRow(page, 'Renamed')).toBeVisible();

    // A name typed away to nothing is not a name: the page keeps the one it has.
    const renamed = pagesRow(page, 'Renamed');
    await renamed.getByRole('button', { name: t('workbench.pages_rename') }).click();
    await renamed.getByRole('textbox').fill('   ');
    await renamed.getByRole('textbox').press('Enter');
    await expect(pagesRow(page, 'Renamed')).toBeVisible();

    await pagesRow(page, t('ui.page_default', 1))
        .getByRole('button', { name: t('workbench.pages_open') })
        .click();
    await expect(page.getByRole('tab', { name: t('views.status') })).toBeVisible();
    // The first page holds the Status view alone, so no Pages view is on screen once it shows.
    await expect(page.locator(`${SHOWN_VIEW} [data-pages]`)).toHaveCount(0);

    await showRailPage(page, 'views');
    await pagesRow(page, 'Renamed')
        .getByRole('button', { name: t('workbench.pages_close') })
        .click();
    // The close took the renamed page off the list.
    await expect(pagesRow(page, 'Renamed')).toHaveCount(0);
    // The renamed page held one saved tab, so its close asked nothing.
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
});

test('closing a page of several tabs asks first: cancel keeps it, confirm removes it', async ({
    page
}) => {
    // revert: src/lib/views/system/workbench/Pages.svelte:71 => const asks = 'none';
    await boot(page);
    await showRailPage(page, 'projects');
    await showRailPage(page, 'views');
    const projects = pagesRow(page, 'Projects');
    await projects.getByRole('button', { name: t('workbench.pages_close') }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: t('ui.confirm_cancel') }).click();
    // Cancel closes the question and keeps the page.
    await expect(dialog).toHaveCount(0);
    await expect(projects).toBeVisible();

    await projects.getByRole('button', { name: t('workbench.pages_close') }).click();
    await page
        .getByRole('alertdialog')
        .getByRole('button', { name: t('ui.confirm_ok') })
        .click();
    // The confirm took the page away, which is the whole of what it was asked.
    await expect(projects).toHaveCount(0);
    // The button makes the page again from its arrangement.
    await showRailPage(page, 'projects');
    await expect(page.getByRole('tab', { name: t('views.coauthor') })).toBeVisible();
});
