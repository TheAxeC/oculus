// The status bar in Chrome: its size, which is VS Code's at every text scale, its two groups in
// their order, every item reached by Tab with its tooltip over it, and the right-click menu that
// hides an item and keeps it hidden across a reload.
//
// Each item pressed and the view it opens is tests/browser/shell/settings.spec.ts's; the source
// items, the branch and sync items and the notifications have a spec each beside this one.

import { expect, test } from '@playwright/test';
import { SHOWN_VIEW } from '../helpers/rail.ts';
import { removeFromHub, writeHubFile } from '../helpers/hub.ts';
import { t } from '../helpers/words.ts';
import { UI_KEY, bootOn, button, item, sourceTab } from './status.ts';

/** The file the source tab of these cases holds, written into the served hub and taken away. */
const FILE = 'status-bar-probe.py';

/** Its text, a Python function indented by four spaces. */
const TEXT = 'def f():\n    return 1\n';

test.beforeEach(() => writeHubFile(FILE, TEXT));
test.afterEach(() => removeFromHub(FILE));

// revert: src/lib/themes/tokens.css:87 => --status-text: calc(12px * var(--text-scale, 1));
// revert: src/lib/ui/controls/ToolButton.svelte:235 => height: auto;
test('the bar is 22 px high and every item 22 px with 12 px words, at the largest text scale too', async ({
    page
}) => {
    await bootOn(page, [sourceTab('probe', 'hub', FILE)], {
        version: 2,
        textScale: 1.6
    });
    await expect(item(page, 'caret')).toBeVisible();
    const bar = page.locator('[data-status-bar]');
    expect((await bar.boundingBox())?.height).toBe(22);
    const sizes = await page
        .locator('[data-status-bar] [data-status] button')
        .evaluateAll((buttons) =>
            buttons.map((one) => ({
                height: one.getBoundingClientRect().height,
                size: getComputedStyle(one).fontSize
            }))
        );
    expect(sizes.length).toBeGreaterThan(10);
    for (const one of sizes) expect(one).toEqual({ height: 22, size: '12px' });
    // The scale did reach the rest of the window: a pane's tab is drawn larger than at one.
    const tab = await page
        .getByRole('tab', { name: FILE })
        .evaluate((node) => getComputedStyle(node).fontSize);
    expect(Number.parseFloat(tab)).toBeGreaterThan(14);
});

// revert: src/lib/shell/Workbench.svelte:325 => flex-direction: row;
test("the bar runs the window's whole width, under the rail as well as the panes", async ({
    page
}) => {
    await bootOn(page, [sourceTab('probe', 'hub', FILE)]);
    await expect(item(page, 'caret')).toBeVisible();
    const bar = await page.locator('[data-status-bar]').boundingBox();
    const rail = await page.locator('nav[data-rail]').boundingBox();
    const width = page.viewportSize()?.width ?? 0;
    expect(bar?.x).toBe(0);
    expect(bar?.width).toBe(width);
    // The rail stops where the bar starts, as VS Code's activity bar stops at its status bar.
    expect((rail?.y ?? 0) + (rail?.height ?? 0)).toBe(bar?.y);
});

// revert: src/lib/shell/status/StatusBar.svelte:101 => delete
// revert: src/lib/shell/status/StatusBar.svelte:188 => delete
test('the left group and the right group hold their items in VS Code order, the bell last', async ({
    page
}) => {
    await bootOn(page, [sourceTab('probe', 'hub', FILE)]);
    await expect(item(page, 'caret')).toBeVisible();
    const names = (group: string) =>
        page
            .locator(`[data-status-group="${group}"] [data-status]`)
            .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-status')));
    // The served hub is a repository with no upstream, so its branch is drawn and no sync.
    expect(await names('left')).toEqual(['host', 'branch', 'findings', 'hpc', 'usage', 'server']);
    expect(await names('right')).toEqual([
        'caret',
        'indent',
        'encoding',
        'line_ending',
        'language',
        'sessions',
        'unsaved',
        'bell'
    ]);
    const left = await page.locator('[data-status-group="left"]').boundingBox();
    const right = await page.locator('[data-status-group="right"]').boundingBox();
    const bar = await page.locator('[data-status-bar]').boundingBox();
    // The two groups sit at the two ends of the bar.
    expect(left?.x).toBe(bar?.x);
    expect(Math.round((right?.x ?? 0) + (right?.width ?? 0))).toBe(
        Math.round((bar?.x ?? 0) + (bar?.width ?? 0))
    );
});

// revert: src/lib/ui/controls/ToolButton.svelte:121 => placement={rail ? 'beside' : 'below'}
test('every item is reached by Tab, opens its tooltip over the bar, and opens what it names on Enter', async ({
    page
}) => {
    await bootOn(page, [sourceTab('probe', 'hub', FILE)]);
    await expect(item(page, 'caret')).toBeVisible();
    const bar = await page.locator('[data-status-bar]').boundingBox();
    await button(page, 'host').focus();
    const reached: string[] = [];
    for (let step = 0; step < 20; step += 1) {
        const name = await page.evaluate(
            () =>
                document.activeElement?.closest('[data-status]')?.getAttribute('data-status') ?? ''
        );
        if (name === '' || reached.includes(name)) break;
        reached.push(name);
        await page.keyboard.press('Tab');
    }
    // The unsaved item is held back while no tab holds unsaved text, so Tab passes it by.
    expect(reached).toEqual([
        'host',
        'branch',
        'findings',
        'hpc',
        'usage',
        'server',
        'caret',
        'indent',
        'encoding',
        'line_ending',
        'language',
        'sessions',
        'bell'
    ]);
    await button(page, 'host').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    const tip = page.getByRole('tooltip', { name: /oculus runs on/ });
    await expect(tip).toBeVisible();
    const bubble = await tip.boundingBox();
    expect((bubble?.y ?? 0) + (bubble?.height ?? 0)).toBeLessThanOrEqual(bar?.y ?? 0);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('tab', { name: t('views.status'), exact: true })).toHaveAttribute(
        'aria-selected',
        'true'
    );
});

// revert: src/lib/state/workbench/ui.svelte.ts:262-270 => statusHidden: [],
test('a right-click lists every item, unchecking one hides it, and it stays hidden after a reload', async ({
    page
}) => {
    await bootOn(page, [sourceTab('probe', 'hub', FILE)]);
    await expect(item(page, 'usage')).toBeVisible();
    await button(page, 'usage').click({ button: 'right' });
    const menu = page.getByRole('menu', { name: t('statusbar.hide_menu') });
    await expect(menu.getByRole('menuitem')).toHaveCount(15);
    const usage = menu.getByRole('menuitem', { name: t('statusbar.item_usage'), exact: true });
    await expect(usage).toHaveAttribute('aria-current', 'true');
    await usage.click();
    // Unchecked in the menu, the item is drawn no more.
    await expect(item(page, 'usage')).toHaveCount(0);
    expect(await page.evaluate((key) => localStorage.getItem(key) ?? '', UI_KEY)).toContain(
        '"statusHidden":["usage"]'
    );

    await page.reload();
    await expect(button(page, 'server')).toHaveText(t('statusbar.server_open'));
    // The reload read the hidden set back from the saved appearance.
    await expect(item(page, 'usage')).toHaveCount(0);

    // A right-click on the bar's own ground offers it back.
    const bar = await page.locator('[data-status-group="left"]').boundingBox();
    await page.mouse.click((bar?.x ?? 0) + (bar?.width ?? 0) + 40, (bar?.y ?? 0) + 11, {
        button: 'right'
    });
    const back = page
        .getByRole('menu', { name: t('statusbar.hide_menu') })
        .getByRole('menuitem', { name: t('statusbar.item_usage'), exact: true });
    await expect(back).toHaveAttribute('aria-current', 'false');
    await back.click();
    await expect(item(page, 'usage')).toHaveCount(1);
    await expect(page.locator(`${SHOWN_VIEW} [data-source-editor]`)).toBeVisible();
});
