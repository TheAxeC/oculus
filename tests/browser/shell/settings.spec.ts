// The Settings view on the Views and Settings page and the status bar along the foot of the window:
// the view changes the theme, puts the CRT overlay on and off, keeps the icons on a terminal theme,
// and edits the rail list, which config/layout.yml is written with and the rail follows; a rail
// entry hand-edited to a glyph the vocabulary lacks draws no button; each item of the status bar
// opens the view that says more about it, the unsaved count the first tab it counts, on its own
// page.
//
// The rail case writes the served engine's own layout.yml, a copy under the system temporary
// directory, and puts the file back as it found it.

import { expect, test, type Page } from '@playwright/test';
import { SHOWN_VIEW, boot, openView, pagesRow, pickTheme, showRailPage } from '../helpers/rail.ts';
import { readEngineFile, writeEngineFile } from '../helpers/hub.ts';
import { t } from '../helpers/words.ts';

const LAYOUT = 'config/layout.yml';

/** The Settings view on screen. */
function settings(page: Page): ReturnType<Page['locator']> {
    return page.locator(`${SHOWN_VIEW} [data-settings-view]`);
}

/** One item of the status bar, by the name its `data-status` gives it. */
function item(page: Page, name: string): ReturnType<Page['locator']> {
    return page.locator(`[data-status-bar] [data-status="${name}"] button`);
}

test('the Settings view changes the theme', async ({ page }) => {
    // revert: src/lib/views/system/workbench/Appearance.svelte:64 => onpick={(name: string) => setTheme('light')}
    await boot(page);
    await showRailPage(page, 'views');
    await settings(page)
        .getByRole('button', { name: t('ui.theme') })
        .click();
    await page.getByRole('menuitem', { name: 'mocha', exact: true }).click();
    await expect(page.locator('body')).toHaveClass(/\bmocha\b/);
    await expect(settings(page).locator('[data-theme-name]')).toContainText('mocha');
});

test('the Settings view puts the CRT overlay on and takes it off', async ({ page }) => {
    // revert: src/lib/views/system/workbench/Appearance.svelte:104 => onclick={() => setCrt(crt())}
    await boot(page);
    await showRailPage(page, 'views');
    const toggle = settings(page).getByRole('button', { name: t('ui.crt_on'), exact: true });
    await expect(page.locator('body')).not.toHaveClass(/\bcrt\b/);
    await toggle.click();
    await expect(page.locator('body')).toHaveClass(/\bcrt\b/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(page.locator('body')).not.toHaveClass(/\bcrt\b/);
});

test('the Settings view keeps the icons on a terminal theme', async ({ page }) => {
    // revert: src/lib/views/system/workbench/Appearance.svelte:122 => onclick={() => setIcons(icons())}
    await boot(page);
    await pickTheme(page, 'mocha');
    const mark = page.locator('nav [data-rail-page="focus"] .glyph');
    // A terminal palette draws each glyph as its ASCII stand-in, as text and with no drawing.
    await expect(mark.locator('svg')).toHaveCount(0);
    await showRailPage(page, 'views');
    // A terminal theme draws a control's name inside brackets, so the name is matched as a part.
    await settings(page)
        .getByRole('button', { name: t('ui.icons') })
        .click();
    // Asked for the icons, the rail draws the icon the glyph name maps to.
    await expect(mark.locator('svg')).toHaveCount(1);
});

test('the Settings view edits the rail list, its typing is unsaved, and the rail follows', async ({
    page
}) => {
    // revert: src/lib/views/system/workbench/RailEditor.svelte:111 => const answer = { ok: true, changed: [], refused: [] };
    const before = readEngineFile(LAYOUT);
    try {
        await boot(page);
        await showRailPage(page, 'views');
        const label = settings(page).getByRole('textbox', {
            name: t('workbench.rail_label', 1),
            exact: true
        });
        await label.fill('Board');
        await expect(item(page, 'unsaved')).toHaveText(t('workbench.status_unsaved', 1));
        await settings(page)
            .getByRole('button', { name: t('workbench.rail_save'), exact: true })
            .click();
        await expect(settings(page).getByRole('status')).toHaveText(t('workbench.rail_saved'));
        await expect(page.locator('nav [data-rail-page="focus"] button')).toHaveAttribute(
            'aria-label',
            'Board'
        );
        expect(readEngineFile(LAYOUT)).toContain(
            '  - { label: "Board", glyph: compass, page: focus }\n'
        );
        // The file now holds what was typed, so the tab holds no text a save has not taken.
        await expect(item(page, 'unsaved')).toHaveText(t('workbench.status_unsaved', 0));
    } finally {
        writeEngineFile(LAYOUT, before);
        await expect(page.locator('nav [data-rail-page="focus"] button')).toHaveAttribute(
            'aria-label',
            'Focus'
        );
    }
});

test('a rail entry hand-edited to a glyph the vocabulary does not hold draws no button', async ({
    page
}) => {
    // revert: src/lib/state/workbench/navigation/rail.ts:37 => const read = readRail(config.rail, arrangementKeys(arrangements));
    const before = readEngineFile(LAYOUT);
    const entry = '  - { label: "Projects", glyph: paper, page: projects }\n';
    expect(before).toContain(entry);
    try {
        await boot(page);
        await expect(page.locator('nav [data-rail-page="projects"]')).toHaveCount(1);
        writeEngineFile(LAYOUT, before.replace(entry, entry.replace('paper', 'nonesuch')));
        // The watcher pushes the edited file and the rail redraws without the entry.
        await expect(page.locator('nav [data-rail-page="projects"]')).toHaveCount(0);
        await expect(page.locator('nav [data-rail-page="pillars"]')).toHaveCount(1);
    } finally {
        writeEngineFile(LAYOUT, before);
    }
    await expect(page.locator('nav [data-rail-page="projects"]')).toHaveCount(1);
});

test('each status bar item opens its view', async ({ page }) => {
    // revert: src/lib/shell/status/StatusBar.svelte:48 => onclick={() => openView('status')}
    await boot(page);
    await expect(item(page, 'socket')).toHaveText(
        t('workbench.status_socket', t('workbench.status_socket_open'))
    );
    await openView(page, 'help', t('views.help'));
    await item(page, 'socket').click();
    await expect(page.getByRole('tab', { name: t('views.status') })).toHaveAttribute(
        'aria-selected',
        'true'
    );
    await item(page, 'usage').click();
    await expect(page.getByRole('tab', { name: t('views.usage') })).toHaveAttribute(
        'aria-selected',
        'true'
    );
    await item(page, 'hpc').click();
    await expect(page.getByRole('tab', { name: t('views.hpc') })).toHaveAttribute(
        'aria-selected',
        'true'
    );
    await item(page, 'sessions').click();
    await expect(page.getByRole('tab', { name: t('sessions.rail_title') })).toHaveAttribute(
        'aria-selected',
        'true'
    );
});

test('the unsaved count opens the first unsaved tab on its own page', async ({ page }) => {
    // revert: src/lib/shell/status/StatusBar.svelte:31 => delete
    await boot(page);
    await expect(item(page, 'unsaved')).toBeDisabled();
    await showRailPage(page, 'views');
    await settings(page)
        .getByRole('textbox', { name: t('workbench.rail_label', 2), exact: true })
        .fill('Typed, not saved');
    await pagesRow(page, t('ui.page_default', 1))
        .getByRole('button', { name: t('workbench.pages_open') })
        .click();
    // The Status page was made by no rail button, so none is drawn as the one in force.
    await expect(page.locator('nav [data-rail-page] button.active')).toHaveCount(0);

    await item(page, 'unsaved').click();
    await expect(page.locator('nav [data-rail-page="views"] button')).toHaveClass(/\bactive\b/);
    await expect(
        settings(page).getByRole('textbox', { name: t('workbench.rail_label', 2), exact: true })
    ).toHaveValue('Typed, not saved');
});
