// The Repositories view in a real browser, over the served copy of the hub, which the layer makes a
// git repository of its own with one commit in it.
//
// Every write here lands inside that copy: the worktree is made under its own worktrees folder and
// taken away again in the same case, so the copy the next spec file serves is the one the layer
// made. Nothing reaches the machine's own checkout.

import { expect, test } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { boot, openView } from './rail.ts';
import { hubDir } from './hub.ts';
import { t } from './words.ts';

/** The file the browser layer leaves changed in the copy it serves, which the diff pane opens. */
const CHANGED = 'feeds/position-leads.yml';

/** The name the case makes its worktree under, and where the view says it will go. */
const NAME = 'browser-case';

function worktree(): string {
    return join(hubDir(), '.agents', 'worktrees', NAME);
}

test.describe('the Repositories view', () => {
    test('draws the served hub with its branch line and its log', async ({ page }) => {
        await boot(page);
        await openView(page, 'repositories', t('views.repositories'));

        const section = page.locator(`[data-root="${hubDir()}"]`);
        await expect(section).toBeVisible();
        await expect(section.getByText('main', { exact: true }).first()).toBeVisible();
        await expect(section.getByText('The demo hub as it is shipped')).toBeVisible();
        // The layer's .gitignore carries the rule, so no warning is drawn.
        await expect(section.getByText(t('repositories.worktrees_unignored'))).toHaveCount(0);
        await expect(section.getByText(t('repositories.worktrees_empty'))).toBeVisible();
    });

    test("opens one file's diff in a pane of its own", async ({ page }) => {
        await boot(page);
        await openView(page, 'repositories', t('views.repositories'));
        const section = page.locator(`[data-root="${hubDir()}"]`);

        // The layer commits the copy and then rewrites its dated lead, so that file is always one
        // of the changed rows, whatever a spec before this one wrote into the hub.
        const row = section.locator(`[data-group="changes"] [data-entry="${CHANGED}"]`);
        await expect(row).toBeVisible();
        await row.getByRole('button', { name: t('repositories.diff') }).click();

        // The pane is named for what it is over, and draws the diff the endpoint answered.
        await expect(page.getByRole('tab', { name: CHANGED })).toBeVisible();
        await expect(page.getByRole('region', { name: CHANGED })).toContainText('deadline');
    });

    test('makes a worktree, lists it, and takes it away again', async ({ page }) => {
        await boot(page);
        await openView(page, 'repositories', t('views.repositories'));
        const section = page.locator(`[data-root="${hubDir()}"]`);

        const worktrees = section.locator('[data-group="worktrees"]');
        await worktrees.getByLabel(t('repositories.worktree_new_label')).fill(NAME);
        await expect(
            worktrees.getByText(t('repositories.worktree_path', worktree()))
        ).toBeVisible();
        await worktrees
            .getByRole('button', { name: t('repositories.worktree_new_create') })
            .click();
        await page.getByRole('button', { name: t('ui.confirm_ok') }).click();

        const row = section.locator(`[data-entry="${worktree()}"]`);
        await expect(row).toBeVisible();
        await expect(row.getByText(NAME).first()).toBeVisible();
        await expect.poll(() => existsSync(worktree())).toBe(true);

        await row.getByRole('button', { name: t('repositories.remove') }).click();
        await page.getByRole('button', { name: t('ui.confirm_ok') }).click();

        await expect(row).toHaveCount(0);
        await expect.poll(() => existsSync(worktree())).toBe(false);
    });
});
