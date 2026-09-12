// The source tab of Q9: the edit-source bar on Lit Watch opens the feed file as an editable tab,
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
