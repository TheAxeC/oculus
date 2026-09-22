// The source tab: the control closing Lit Watch's toolbar opens the feed file as an editable tab, an
// unsaved edit survives leaving the tab and coming back, since the shell mounts only the active view
// and the draft belongs to the instance rather than to the component, and a file this machine's mode
// locks opens as the code window under the line that says so.
//
// Closing a tab is here too, because the question a tab holding an unsaved edit asks is the pane's
// answer to what the instance holds, which only a rendered page has.

import { chmodSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { expect, test } from '@playwright/test';
import { boot, openView } from '../helpers/rail.ts';
import { t, tabNamed } from '../helpers/words.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

test.afterAll(sweepScratch);

/** A folder of the spec's own, under the system temporary directory and asserted to be inside it. */
function scratch(): string {
    const dir = scratchDir('oculus-source-spec-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return dir;
}

test('the toolbar control opens the feed file and an unsaved edit survives a tab switch', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'radar', t('views.radar'));
    const control = page.locator('[data-source-path="feeds/literature-radar.yml"]');
    await expect(control).toBeVisible();
    await control.getByRole('button', { name: t('views.open_source') }).click();
    const editor = page.locator('[data-source-editor]');
    await expect(editor).toBeVisible();
    const area = editor.getByRole('textbox');
    await expect(area).not.toHaveValue('');
    const before = await area.inputValue();
    await area.focus();
    await page.keyboard.press('End');
    await page.keyboard.type(' typed-in-the-spec');
    await expect(area).toHaveValue(`${before} typed-in-the-spec`);

    await page.getByRole('tab', { name: t('views.radar') }).click();
    // the tab was switched away, so the editor of the other tab is not on the page
    await expect(editor).toHaveCount(0);
    await page.getByRole('tab', { name: 'literature-radar.yml' }).click();
    await expect(page.locator('[data-source-editor]').getByRole('textbox')).toHaveValue(
        `${before} typed-in-the-spec`
    );
    // Nothing is saved: the demo hub's feed file stays as it was.
});

// The rendered half beside the editor, which is the one place the sanitiser runs over what a reader
// typed: the node suite has no document, so what a script tag in the text comes to is checked here.
test('a Markdown file opens for editing and the preview follows what is typed', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.locator('[data-fs-row="hub:"]').getByRole('button').first().click();
    await page.locator('[data-fs-row="hub:README.md"]').getByRole('button').first().click();

    // A text file of the tree opens in the source tab; a Markdown one splits into the two halves.
    const editor = page.locator('[data-source-editor="README.md"]');
    await expect(editor).toBeVisible();
    const preview = page.locator('[data-source-preview="README.md"]');
    await expect(preview).toBeVisible();

    // What is typed is rendered without a save and without a request: the working copy is the source.
    const area = editor.getByRole('textbox');
    await area.fill('## Typed in the spec\n\nA line of it.\n');
    await expect(preview.locator('h2')).toHaveText('Typed in the spec');
    await expect(preview.locator('p')).toHaveText('A line of it.');

    // A script the file carries is markup somebody else wrote, so the filter takes it out.
    await area.fill('# Heading\n\n<script>window.specScriptRan = true;</' + 'script>\n');
    await expect(preview.locator('h1')).toHaveText('Heading');
    // a script in a file is markup somebody else wrote, so the filter takes it out of the preview
    await expect(preview.locator('script')).toHaveCount(0);
    expect(await page.evaluate(() => 'specScriptRan' in window)).toBe(false);

    // The toggle takes the half away and gives it back, and the editor stays as it was.
    await page.getByRole('button', { name: t('source.preview'), exact: true }).click();
    // the toggle closed the preview half
    await expect(preview).toHaveCount(0);
    await page.getByRole('button', { name: t('source.preview'), exact: true }).click();
    await expect(preview.locator('h1')).toHaveText('Heading');

    // Nothing is saved: the hub copy's README.md stays as it was.
});

test('a file this machine locks opens read only, says so, and offers nothing to type into', async ({
    page
}) => {
    const dir = scratch();
    const key = dir.split(sep).at(-1) ?? '';
    const file = join(dir, 'locked.py');
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    writeFileSync(file, 'print("locked")\n');
    chmodSync(file, 0o444);

    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    await page.getByRole('textbox', { name: t('files.root_dir') }).fill(dir);
    await page.getByRole('button', { name: t('files.add'), exact: true }).click();
    await expect(page.locator(`[data-fs-row="${key}:"]`)).toBeVisible();
    await page.locator(`[data-fs-row="${key}:"]`).getByRole('button').first().click();
    await page.locator(`[data-fs-row="${key}:locked.py"]`).getByRole('button').first().click();

    // The code window under the sentence: no textarea to type into and no Save to press.
    await expect(page.locator('[data-source-locked="locked.py"]')).toContainText(
        t('source.readonly')
    );
    await expect(page.locator('[data-fs-code="locked.py"]')).toBeVisible();
    // this machine locks the file, so there is nothing to type into
    await expect(page.locator('[data-source-editor="locked.py"]')).toHaveCount(0);
    // and nothing to save either
    await expect(page.getByRole('button', { name: t('editor.save'), exact: true })).toHaveCount(0);
});

test('a tab holding an unsaved edit asks before it closes, and a clean one goes at once', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'radar', t('views.radar'));
    const open = async (): Promise<void> => {
        await page
            .locator('[data-source-path="feeds/literature-radar.yml"]')
            .getByRole('button', { name: t('views.open_source') })
            .click();
        await expect(page.locator('[data-source-editor]')).toBeVisible();
    };
    const tab = page.getByRole('tab', { name: 'literature-radar.yml' });
    const closeControl = page
        .locator('.tab', { has: tab })
        .getByRole('button', { name: t('ui.close_tab') });

    // Nothing has been typed, so the close control takes the tab away with no question.
    await open();
    await closeControl.click();
    // nothing was typed, so the close takes the tab away without asking
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    // and the tab it was pressed on is gone with it
    await expect(tab).toHaveCount(0);

    // With an edit in it the same control asks, and a cancel leaves both the tab and the edit.
    await open();
    const area = page.locator('[data-source-editor]').getByRole('textbox');
    const before = await area.inputValue();
    await area.focus();
    await page.keyboard.press('End');
    await page.keyboard.type(' typed-in-the-spec');
    await closeControl.click();
    const asked = page.getByRole('alertdialog');
    await expect(asked).toBeVisible();
    await expect(asked).toContainText(t('ui.tab_close_dirty'));
    await asked.getByRole('button', { name: t('ui.confirm_cancel'), exact: true }).click();
    // cancel closes the question and keeps the tab
    await expect(asked).toHaveCount(0);
    await expect(tab).toHaveCount(1);
    await expect(page.locator('[data-source-editor]').getByRole('textbox')).toHaveValue(
        `${before} typed-in-the-spec`
    );

    // The keyboard goes back to the control the question was raised from, the close control here.
    await expect(closeControl).toBeFocused();

    // Delete on the tab takes the same guard, and a cancel puts the keyboard back on the tab.
    await tab.focus();
    await page.keyboard.press('Delete');
    await expect(asked).toBeVisible();
    await expect(asked).toContainText(t('ui.tab_close_dirty'));
    await expect(tab).toHaveCount(1);
    await asked.getByRole('button', { name: t('ui.confirm_cancel'), exact: true }).click();
    // cancel closes the question and keeps the tab
    await expect(asked).toHaveCount(0);
    await expect(tab).toBeFocused();

    // The tab goes on the yes.
    await page.keyboard.press('Delete');
    await expect(asked).toBeVisible();
    await asked.getByRole('button', { name: t('ui.confirm_ok'), exact: true }).click();
    // the yes closes the question and takes the tab with it
    await expect(asked).toHaveCount(0);
    // the yes took the tab away
    await expect(tab).toHaveCount(0);

    // The closed tab's button went with it, so the tab that now sits where it sat takes the
    // keyboard and the strip's one stop, rather than the focus falling to the document.
    await expect(page.getByRole('tab', { name: t('views.radar') })).toBeFocused();
    await expect(page.getByRole('tab', { name: t('views.radar') })).toHaveAttribute(
        'tabindex',
        '0'
    );

    // Nothing is saved: the demo hub's feed file stays as it was.
});

test('a pane holding one tab with an unsaved edit asks before its menu closes it', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'radar', t('views.radar'));
    await page
        .locator('[data-source-path="feeds/literature-radar.yml"]')
        .getByRole('button', { name: t('views.open_source') })
        .click();
    await expect(page.locator('[data-source-editor]')).toBeVisible();

    // The tab moves into a pane of its own, so the close below is a pane holding exactly one tab.
    const first = page.locator('[data-pane]').first();
    await first.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('ui.split_right') }).click();
    const beside = page.locator('[data-pane]').last();
    await expect(beside.getByRole('tab')).toHaveCount(1);

    const area = beside.locator('[data-source-editor]').getByRole('textbox');
    await area.focus();
    await page.keyboard.press('End');
    await page.keyboard.type(' typed-in-the-spec');

    const menu = beside.getByRole('button', { name: t('ui.pane_menu'), exact: true });
    await menu.click();
    await page.getByRole('menuitem', { name: t('ui.pane_close') }).click();
    const asked = page.getByRole('alertdialog');
    await expect(asked).toBeVisible();
    // One tab is the tab's own question, in the tab's own words rather than the pane's count.
    await expect(asked).toContainText(t('ui.tab_close_dirty'));
    await asked.getByRole('button', { name: t('ui.confirm_cancel'), exact: true }).click();
    // cancel closes the question and keeps the pane
    await expect(asked).toHaveCount(0);
    await expect(beside.getByRole('tab')).toHaveCount(1);
    // The keyboard goes back to the control the question was raised from.
    await expect(menu).toBeFocused();

    await menu.click();
    await page.getByRole('menuitem', { name: t('ui.pane_close') }).click();
    await page
        .getByRole('alertdialog')
        .getByRole('button', { name: t('ui.confirm_ok'), exact: true })
        .click();
    // the yes closed the pane, and its tab went with it
    await expect(page.getByRole('tab', { name: 'literature-radar.yml' })).toHaveCount(0);

    // Nothing is saved: the demo hub's feed file stays as it was.
});

test('a page holding one tab with an unsaved edit asks before it closes', async ({ page }) => {
    await boot(page);
    const strip = page.getByRole('region', { name: t('ui.pages') });
    await strip.getByRole('button', { name: t('ui.page_menu') }).click();
    await page.getByRole('menuitem', { name: t('ui.page_new') }).click();
    await expect(strip.getByRole('tab')).toHaveCount(2);

    // The new page is brought down to one tab, the source tab, with an unsaved edit in it.
    await openView(page, 'radar', t('views.radar'));
    await page
        .locator('[data-source-path="feeds/literature-radar.yml"]')
        .getByRole('button', { name: t('views.open_source') })
        .click();
    const editor = page.locator('[data-source-editor]');
    await expect(editor).toBeVisible();
    for (const name of [t('views.status'), t('views.radar')]) {
        await page
            .locator('.tab', { has: page.getByRole('tab', { name: tabNamed(name) }) })
            .getByRole('button', { name: t('ui.close_tab') })
            .click();
    }
    const pane = page.locator('[data-pane]').first();
    await expect(pane.getByRole('tab')).toHaveCount(1);
    const area = editor.getByRole('textbox');
    await area.focus();
    await page.keyboard.press('End');
    await page.keyboard.type(' typed-in-the-spec');

    // The page's own close: one tab, so the words are the tab's and not the page's count.
    await strip.getByRole('tab', { name: t('ui.page_default', 2) }).hover();
    await strip
        .getByRole('button', { name: t('ui.close_tab') })
        .last()
        .click();
    const asked = page.getByRole('alertdialog');
    await expect(asked).toBeVisible();
    await expect(asked).toContainText(t('ui.tab_close_dirty'));
    await asked.getByRole('button', { name: t('ui.confirm_cancel'), exact: true }).click();
    // cancel closes the question and keeps the page
    await expect(asked).toHaveCount(0);
    await expect(strip.getByRole('tab')).toHaveCount(2);
    await expect(editor.getByRole('textbox')).toHaveValue(/ typed-in-the-spec$/);

    // Nothing is saved: the demo hub's feed file stays as it was.
});
