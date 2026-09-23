// The change log in Chrome: a manifest field edited from the editor shows up as a row of History,
// and the control on that row puts the value back in the file.
//
// The write goes to the temporary copy of demo/, and the undo is what takes it out again; the
// manifest is read back from disk at both ends, so what the page says happened is checked against
// the bytes. The log itself is written under this run's own HOME, which serve.ts makes.

import { expect, test } from '@playwright/test';
import { pressCardAction } from '../helpers/cards.ts';
import { readHubFile, readHubYaml } from '../helpers/hub.ts';
import { boot, openView } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';

const PROJECT = 'projects/manuscripts/sparse-attention';
const FIELD = 'status.line';
const TYPED = 'A line the browser layer typed.';

/** The label the manifest form draws one field by, read from the schema rather than typed here. */
function labelOf(field: string): string {
    const schema = loadConfig(engineDir()).config.manifest_schema as {
        fields: Record<string, { label: string }>;
    };
    if (!(field in schema.fields)) {
        throw new Error(`config/catalogs/manifest-schema.yml names no field ${field}`);
    }
    return schema.fields[field].label;
}

/** The status line the manifest holds now. */
function lineOf(): string {
    const status = readHubYaml(`${PROJECT}/project.yml`).status;
    if (typeof status !== 'object' || status === null) throw new Error('no status map');
    return String((status as Record<string, unknown>).line);
}

test('a manifest edit shows in History and its control puts the value back', async ({ page }) => {
    const before = readHubFile(`${PROJECT}/project.yml`);
    const held = lineOf();
    const manifest = readHubYaml(`${PROJECT}/project.yml`);
    const short = String(manifest.short);
    const title = String(manifest.title);

    await boot(page);
    await openView(page, 'projects', t('views.projects'));

    const card = page.locator('.slot').filter({ hasText: short }).first();
    await pressCardAction(page, card, t('project.card.edit_manifest'));
    // The editor's tab carries the view's own name; the pane it opens is headed by the project.
    await expect(page.getByRole('tab', { name: t('views.editor') })).toBeVisible();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    await page.getByRole('textbox', { name: labelOf(FIELD) }).fill(TYPED);
    await page.getByRole('button', { name: t('editor.save'), exact: true }).click();
    await expect(page.getByText(t('editor.saved', FIELD), { exact: true })).toBeVisible();
    await expect.poll(() => lineOf()).toBe(TYPED);

    await openView(page, 'history', t('views.history'));
    const row = page.locator('[data-change]').first();
    await expect(row).toContainText(`${PROJECT}/project.yml`);
    await expect(row).toContainText(t('history.named', String(manifest.id), FIELD));
    await expect(row).toContainText(held);
    await expect(row).toContainText(TYPED);

    await row.getByRole('button', { name: t('history.undo') }).click();
    await expect(
        page.getByText(t('history.undone', t('history.named', String(manifest.id), FIELD)))
    ).toBeVisible();
    await expect.poll(() => lineOf()).toBe(held);
    // The undo is a write of its own, so the row above the one it took back is the undo itself.
    await expect(page.locator('[data-change]').first()).toContainText(held);
    expect(readHubFile(`${PROJECT}/project.yml`)).toBe(before);
});
