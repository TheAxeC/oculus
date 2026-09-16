// The source tab: the control closing Lit Watch's toolbar opens the feed file as an editable tab, an
// unsaved edit survives leaving the tab and coming back, since the shell mounts only the active view
// and the draft belongs to the instance rather than to the component, and a file this machine's mode
// locks opens as the code window under the line that says so.

import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { expect, test } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

/** A folder of the spec's own, under the system temporary directory and asserted to be inside it. */
function scratch(): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-source-spec-'));
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
    await expect(preview.locator('script')).toHaveCount(0);
    expect(await page.evaluate(() => 'specScriptRan' in window)).toBe(false);

    // The toggle takes the half away and gives it back, and the editor stays as it was.
    await page.getByRole('button', { name: t('source.preview'), exact: true }).click();
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
    await expect(page.locator('[data-source-editor="locked.py"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: t('editor.save'), exact: true })).toHaveCount(0);
});
