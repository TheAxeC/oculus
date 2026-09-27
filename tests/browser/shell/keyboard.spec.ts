// The keyboard bindings of shell/keys/keys.ts in a real page: a bare digit shows the rail page of
// its place, `v` and a digit open a view of the catalogue,
// Ctrl and a digit activate a tab of the focused pane, Ctrl and a bracket cycle that pane's tabs
// while a bare Tab stays the browser's focus move, `?` opens and closes the sheet, `/` focuses the
// board's search, the card cursor moves with j and k and Enter opens the card, and `g g` and `G`
// scroll the pane. The focus order itself is here too: the rail and each tab strip are one stop
// with the arrows moving inside them.
//
// Nothing here writes to the hub. The layout lives in the browser's own storage.

import { expect, test, type Page } from '@playwright/test';
import { GROUND, SHOWN_VIEW, boot, openView } from '../helpers/rail.ts';
import { readEngineFile, writeEngineFile } from '../helpers/hub.ts';
import { t } from '../helpers/words.ts';

/** The engine's layout file, whose rail list one case edits and puts back. */
const LAYOUT = 'config/layout.yml';

/** Press a key with nothing focused in a field: a press on the window's ground takes it first. */
async function press(page: Page, key: string): Promise<void> {
    await page.locator('body').click({ position: GROUND });
    await page.keyboard.press(key);
}

test('a bare digit shows the rail page of its place', async ({ page }) => {
    // revert: src/lib/shell/keys/workbench-keys.svelte.ts "return options.railPage(action.index);" => return options.railPage(action.index + 1);
    await boot(page);
    await press(page, '2');
    await expect(page.locator('nav [data-rail-page="projects"] button')).toHaveClass(/\bactive\b/);
    await expect(page.getByRole('tab', { name: t('views.coauthor') })).toBeVisible();
    await press(page, '1');
    await expect(page.locator('nav [data-rail-page="focus"] button')).toHaveClass(/\bactive\b/);
    await press(page, '2');
    // The second press shows the page the first one made, rather than a copy of it.
    await expect(page.getByRole('tab', { name: t('views.coauthor') })).toHaveCount(1);
});

test('the direct chord opens a view of the catalogue, ? toggles the sheet', async ({ page }) => {
    await boot(page);
    await press(page, 'v');
    await page.keyboard.press('2');
    await expect(page.getByRole('tab', { name: t('views.projects') })).toBeVisible();

    await press(page, '?');
    const sheet = page.getByRole('dialog', { name: t('app.keys.title') });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText(t('app.keys.hint'))).toBeVisible();
    await page.keyboard.press('Escape');
    // Escape closed the sheet
    await expect(sheet).toHaveCount(0);
});

test('the card cursor, the search key and the scroll keys act on the focused pane', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    await pane.locator('[data-card]').first().waitFor();

    const visible = pane.locator('[data-card]:visible');
    const firstId = await visible.nth(0).getAttribute('data-card');
    const secondId = await visible.nth(1).getAttribute('data-card');
    await press(page, 'k');
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(1);
    expect(await pane.locator('[data-card][data-cursor]').getAttribute('data-card')).toBe(firstId);
    await page.keyboard.press('k');
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(1);
    expect(await pane.locator('[data-card][data-cursor]').getAttribute('data-card')).toBe(secondId);
    await page.keyboard.press('Escape');
    // Escape clears the cursor
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(0);
    expect(firstId).not.toBeNull();
    expect(secondId).not.toBeNull();

    await press(page, '/');
    await expect(pane.locator(`${SHOWN_VIEW} [data-search]`)).toBeFocused();
    await page.keyboard.press('Escape');

    const scroller = pane.locator(`${SHOWN_VIEW} [data-scroll]`).first();
    await press(page, 'G');
    await expect.poll(() => scroller.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press('g');
    await page.keyboard.press('g');
    await expect.poll(() => scroller.evaluate((node) => node.scrollTop)).toBe(0);
});

test('a pointer press keeps the cursor in one pane and clears it on a pane change', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    let pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    await pane.locator('[data-card]').first().waitFor();
    await pane.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('ui.split_right'), exact: true }).click();

    pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    const other = page.locator('[data-pane]').filter({
        hasNot: page.getByRole('tab', { name: t('views.projects') })
    });
    await pane.dispatchEvent('pointerdown');
    await page.keyboard.press('k');
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(1);

    await pane.dispatchEvent('pointerdown');
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(1);

    await other.dispatchEvent('pointerdown');
    // the press landed in the other pane, and the cursor belongs to the pane the keyboard is in
    await expect(pane.locator('[data-card][data-cursor]')).toHaveCount(0);
});

test('Ctrl and a digit activate the numbered tab of the focused pane', async ({ page }) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    const status = pane.getByRole('tab', { name: t('views.status') });
    const projects = pane.getByRole('tab', { name: t('views.projects') });
    await expect(projects).toHaveAttribute('aria-selected', 'true');
    const opened = await pane.getAttribute('data-pane-active');
    expect(opened).not.toBeNull();

    await page.keyboard.press('Control+1');
    await expect(status).toHaveAttribute('aria-selected', 'true');
    await expect(projects).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('Control+2');
    await expect(projects).toHaveAttribute('aria-selected', 'true');
    await expect(pane).toHaveAttribute('data-pane-active', String(opened));

    // A digit past the pane's last tab leaves the tab it has.
    await page.keyboard.press('Control+9');
    await expect(projects).toHaveAttribute('aria-selected', 'true');
    await expect(pane).toHaveAttribute('data-pane-active', String(opened));

    await press(page, 'v');
    await page.keyboard.press('1');
    await expect(pane.getByRole('tab', { name: t('views.focus') })).toHaveAttribute(
        'aria-selected',
        'true'
    );
});

test('Ctrl and a bracket cycle the focused pane, and a bare Tab moves the focus', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    const status = pane.getByRole('tab', { name: t('views.status') });
    const projects = pane.getByRole('tab', { name: t('views.projects') });

    await page.keyboard.press('Control+1');
    await expect(status).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('Control+]');
    await expect(projects).toHaveAttribute('aria-selected', 'true');
    await expect(status).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('Control+[');
    await expect(status).toHaveAttribute('aria-selected', 'true');

    // The first tab wraps round to the last, which is the view opened above.
    await page.keyboard.press('Control+[');
    await expect(projects).toHaveAttribute('aria-selected', 'true');

    // A bare Tab belongs to the browser: the focus leaves the strip, and the pane keeps the tabs
    // it had with the same one showing.
    const count = await pane.getByRole('tab').count();
    await projects.focus();
    const before = await page.evaluateHandle(() => document.activeElement);
    await page.keyboard.press('Tab');
    await expect
        .poll(() => page.evaluate((held) => document.activeElement !== held, before))
        .toBe(true);
    expect(
        await page.evaluate(() => document.activeElement?.closest('[role="tablist"]') !== null)
    ).toBe(false);
    expect(await page.evaluate(() => document.activeElement?.tagName ?? '')).not.toBe('BODY');
    await expect(projects).toHaveAttribute('aria-selected', 'true');
    await expect(status).toHaveAttribute('aria-selected', 'false');
    expect(await pane.getByRole('tab').count()).toBe(count);
});

test('the rail and a tab strip are each one stop, the arrows moving inside them', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects') })
    });
    // The whole strip is one stop: its two scroll controls and the close control of each tab are
    // out of the order, and the pane menu beside them keeps a stop of its own.
    const strip = pane.locator('.strip').first();
    await expect(strip.locator('[tabindex="0"]')).toHaveCount(1);
    await expect(strip.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
    await expect(
        pane.getByRole('button', { name: t('ui.pane_menu'), exact: true })
        // the pane menu keeps a stop of its own, so it is not taken out of the tab order
    ).not.toHaveAttribute('tabindex', '-1');

    const projects = pane.getByRole('tab', { name: t('views.projects') });
    const status = pane.getByRole('tab', { name: t('views.status') });
    await projects.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(status).toBeFocused();
    // The arrow carries the stop with the focus and leaves the showing tab where it is.
    await expect(status).toHaveAttribute('tabindex', '0');
    await expect(projects).toHaveAttribute('tabindex', '-1');
    await expect(projects).toHaveAttribute('aria-selected', 'true');

    // Out of the strip and back lands where the reader was, not on the showing tab.
    await page.keyboard.press('Tab');
    await expect(status).not.toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(status).toBeFocused();

    // Selecting a tab brings the stop back to what the reader is looking at.
    await page.keyboard.press('Enter');
    await expect(status).toHaveAttribute('aria-selected', 'true');
    await expect(status).toHaveAttribute('tabindex', '0');
    await expect(projects).toHaveAttribute('tabindex', '-1');

    const rail = page.locator('[data-rail]');
    await expect(rail.locator('[data-stop][tabindex="0"]')).toHaveCount(1);
    await rail.locator('[data-stop]').first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(rail.locator('[data-stop]').nth(1)).toBeFocused();
    await expect(rail.locator('[data-stop][tabindex="0"]')).toHaveCount(1);
});

test('Delete closes the focused tab and the keyboard lands on the tab that takes its place', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    // The pane is found by the tab that stays, since the one this case closes is what a locator
    // over it would stop matching.
    const pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.status') })
    });
    const count = await pane.getByRole('tab').count();
    const projects = pane.getByRole('tab', { name: t('views.projects') });
    await expect(projects).toHaveCount(1);
    await projects.focus();
    await page.keyboard.press('Delete');
    await expect(pane.getByRole('tab')).toHaveCount(count - 1);
    // Delete closed the tab it was focused on
    await expect(projects).toHaveCount(0);
    // The focus is on a tab of the strip, not on the document, and that tab is the strip's stop.
    expect(await page.evaluate(() => document.activeElement?.getAttribute('role') ?? '')).toBe(
        'tab'
    );
    expect(await page.evaluate(() => document.activeElement?.getAttribute('tabindex'))).toBe('0');
});

test('a rail page taken out of the list under the focus hands the stop to its neighbour', async ({
    page
}) => {
    // revert: src/lib/shell/rail/ActivityRail.svelte "if (holding) recoverStop(moved);" => delete
    await boot(page);
    const rail = page.locator('[data-rail]');
    const inbox = rail.locator('[data-stop="page:inbox"]');
    await inbox.focus();
    const before = readEngineFile(LAYOUT);
    try {
        writeEngineFile(
            LAYOUT,
            before.replace('  - { label: "Inbox", glyph: inbox, page: inbox }\n', '')
        );
        // The button went with its entry, and the one that took its place holds the keyboard.
        await expect(inbox).toHaveCount(0);
        await expect(rail.locator('[data-stop="page:views"]')).toBeFocused();
        await expect(rail.locator('[data-stop][tabindex="0"]')).toHaveCount(1);
    } finally {
        writeEngineFile(LAYOUT, before);
        await expect(inbox).toHaveCount(1);
    }
});
