// The source tab: the edit-source bar on Lit Watch opens the feed file as an editable tab,
// and an unsaved edit survives leaving the tab and coming back, since the shell mounts only the
// active view and the draft belongs to the instance, not the component.

import { expect, test } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

test('the edit-source bar opens the feed file and an unsaved edit survives a tab switch', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'radar', t('views.radar'));
    const bar = page.locator('[data-edit-source]');
    await expect(bar).toBeVisible();
    await bar.getByRole('button').first().click();
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

    // The file window is read only, and its control hands the same file to the source tab.
    await page.getByRole('button', { name: t('file.edit'), exact: true }).click();
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
    await expect(preview.locator('script')).toHaveCount(0);
    expect(await page.evaluate(() => 'specScriptRan' in window)).toBe(false);

    // The toggle takes the half away and gives it back, and the editor stays as it was.
    await page.getByRole('button', { name: t('source.preview'), exact: true }).click();
    await expect(preview).toHaveCount(0);
    await page.getByRole('button', { name: t('source.preview'), exact: true }).click();
    await expect(preview.locator('h1')).toHaveText('Heading');

    // Nothing is saved: the hub copy's README.md stays as it was.
});
