// A conflicting merge resolved in Chrome, over a repository of the case's own under the system
// temporary directory: git stops a merge on a conflict, the view lists the path under Merge
// Changes, the three-way merge editor settles the conflict and completes the merge, and the commit
// box commits it with the message git prepared. The repository is read back with git.

import { expect, test } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitIn, gitOut, gitTry } from '../helpers/git.ts';
import { boot } from '../helpers/rail.ts';
import { keepServedFiles } from '../helpers/files.ts';
import { t } from '../helpers/words.ts';
import { sweepScratch } from '../../fixtures/scratch.ts';
import { repository, showAdded } from './scm.ts';

keepServedFiles();

test.afterAll(sweepScratch);

// revert: src/lib/views/sources/repositories/merge/Merge.svelte "if (await repositories.resolve(root, path, result)) done = true;" => done = true;
test('resolves a conflicting merge in the merge editor and commits it', async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\ntwo\nthree\n' });
    gitIn(dir, 'checkout', '--quiet', '-b', 'other');
    writeFileSync(join(dir, 'a.txt'), 'one\ntheirs\nthree\n');
    gitIn(dir, 'commit', '--quiet', '-am', 'Theirs');
    gitIn(dir, 'checkout', '--quiet', 'main');
    writeFileSync(join(dir, 'a.txt'), 'one\nours\nthree\n');
    gitIn(dir, 'commit', '--quiet', '-am', 'Ours');
    // The merge stops on the conflict, which git reports with a failing status.
    expect(gitTry(dir, 'merge', '--no-edit', 'other')).toBe(1);

    await boot(page);
    const shown = await showAdded(page, dir);
    await expect(shown.locator('[data-sequence="merging"]')).toBeVisible();
    // The commit box starts with the message git prepared for the merge.
    await expect(
        shown.getByRole('textbox', { name: t('git.commit_label'), exact: true })
    ).toHaveValue(/Merge branch 'other'/);

    const row = shown.locator('[data-group="changes"] [data-entry="a.txt"]');
    await row.hover();
    await row.getByRole('button', { name: t('repositories.merge_open'), exact: true }).click();
    const editor = page.locator('[data-view="repositories-merge"][data-path="a.txt"]');
    // The count of conflicts still open is on the pane's bar, above the editor.
    await expect(page.locator('[data-conflicts-left="1"]')).toBeVisible();
    await editor
        .locator('[data-merge-side="incoming"] [data-conflict]')
        .getByRole('button', { name: t('repositories.accept_incoming'), exact: true })
        .click();
    await expect(page.locator('[data-conflicts-left="0"]')).toBeVisible();
    await expect(editor.locator('[data-merge-result]').getByRole('textbox')).toHaveValue(
        'one\ntheirs\nthree\n'
    );
    await page.getByRole('button', { name: t('repositories.merge_complete'), exact: true }).click();
    await expect(editor.locator('[data-merge-done]')).toBeVisible();
    await expect.poll(() => gitOut(dir, 'ls-files', '--unmerged')).toBe('');
    expect(readFileSync(join(dir, 'a.txt'), 'utf8')).toBe('one\ntheirs\nthree\n');

    await shown.getByRole('button', { name: t('git.commit'), exact: true }).click();
    await page.getByRole('button', { name: t('ui.confirm_ok'), exact: true }).click();
    await expect(shown.locator('[data-sequence]')).toHaveCount(0, { timeout: 15_000 });
    // The merge commit has both branches as its parents, and git's message.
    expect(gitOut(dir, 'rev-list', '--parents', '-n', '1', 'HEAD').trim().split(' ')).toHaveLength(
        3
    );
    expect(gitOut(dir, 'log', '-1', '--format=%s')).toContain("Merge branch 'other'");
});
