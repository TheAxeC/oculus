// Conflicts in Chrome that a merge or a rebase leaves, over repositories of the case's own under
// the system temporary directory: the three conflicts a deletion makes (both sides deleted a path,
// the current branch deleted one the other changed, and the other way round) taken in the merge
// editor or marked resolved from the Repositories view, a merge aborted, and a rebase carried on
// once its conflict is resolved. Each write is read back from the repository with git.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitIn, gitOut, gitTry } from '../helpers/git.ts';
import { boot } from '../helpers/rail.ts';
import { keepServedFiles } from '../helpers/files.ts';
import { t } from '../helpers/words.ts';
import { sweepScratch } from '../../fixtures/scratch.ts';
import { DELETED, deletionConflicts } from '../../server/git/deletions.ts';
import { repository, showAdded } from './scm.ts';

keepServedFiles();

test.afterAll(sweepScratch);

/** A repository whose merge of `side` stopped on the three conflicts a deletion makes. */
function deletions(): string {
    const dir = repository({ 'a.txt': 'one\n' });
    deletionConflicts(
        dir,
        (root: string, ...args: string[]) =>
            args[0] === 'merge' ? gitTry(root, ...args) : gitIn(root, ...args),
        'main'
    );
    expect(gitOut(dir, 'ls-files', '-u')).not.toBe('');
    return dir;
}

/** The unmerged entries git holds for a path, which a resolved conflict has none of. */
function unmerged(dir: string, path: string): string {
    return gitOut(dir, 'ls-files', '-u', '--', path);
}

/** Open the merge editor over one conflicted path from its Merge Changes row. */
async function openMerge(page: Page, shown: Locator, path: string): Promise<Locator> {
    const row = shown.locator(`[data-group="changes"] [data-entry="${path}"]`);
    await row.hover();
    await row.getByRole('button', { name: t('repositories.merge_open'), exact: true }).click();
    const editor = page.locator(`[data-view="repositories-merge"][data-path="${path}"]`);
    await expect(editor).toBeVisible();
    return editor;
}

/** Press OK on the confirm dialog on screen. */
async function confirm(page: Page): Promise<void> {
    await page.getByRole('button', { name: t('ui.confirm_ok'), exact: true }).click();
}

// revert: src/lib/views/sources/repositories/merge/Merge.svelte:134 => if (false) {
test('takes the deletion both sides made by Complete Merge over the empty Result', async ({
    page
}) => {
    const dir = deletions();
    await boot(page);
    const shown = await showAdded(page, dir);

    const editor = await openMerge(page, shown, DELETED.both);
    await expect(editor.locator('[data-merge-deleted="both"]')).toBeVisible();
    await expect(editor.locator('[data-merge-result]').getByRole('textbox')).toHaveValue('');
    await page.getByRole('button', { name: t('repositories.merge_complete'), exact: true }).click();
    await expect(
        page.getByText(t('repositories.merge_delete_confirm', DELETED.both))
    ).toBeVisible();
    await confirm(page);
    await expect(editor.locator('[data-merge-done]')).toBeVisible();
    await expect.poll(() => unmerged(dir, DELETED.both)).toBe('');
    expect(gitOut(dir, 'ls-files', '--', DELETED.both)).toBe('');
    expect(existsSync(join(dir, DELETED.both))).toBe(false);
});

// revert: src/lib/views/sources/repositories/merge/Merge.svelte:143 => done = true;
test('takes the deletion the current branch made by Accept Deletion, after a confirm', async ({
    page
}) => {
    const dir = deletions();
    await boot(page);
    const shown = await showAdded(page, dir);

    const editor = await openMerge(page, shown, DELETED.ours);
    await expect(editor.locator('[data-merge-deleted="ours"]')).toBeVisible();
    await page.getByRole('button', { name: t('repositories.merge_delete'), exact: true }).click();
    await expect(
        page.getByText(t('repositories.merge_delete_confirm', DELETED.ours))
    ).toBeVisible();
    await confirm(page);
    await expect(editor.locator('[data-merge-done]')).toBeVisible();
    await expect.poll(() => unmerged(dir, DELETED.ours)).toBe('');
    expect(gitOut(dir, 'ls-files', '--', DELETED.ours)).toBe('');
    expect(existsSync(join(dir, DELETED.ours))).toBe(false);
});

// revert: src/lib/views/sources/repositories/merge/Merge.svelte:156 => {#if false}
// revert: src/lib/views/sources/repositories/merge/Merge.svelte:134 => if (sides !== null && sides.deleted !== '') {
test('keeps the side the other branch deleted by Accept Current and Complete Merge', async ({
    page
}) => {
    const dir = deletions();
    await boot(page);
    const shown = await showAdded(page, dir);

    const editor = await openMerge(page, shown, DELETED.theirs);
    await expect(editor.locator('[data-merge-deleted="theirs"]')).toBeVisible();
    await expect(
        page.getByRole('button', { name: t('repositories.merge_delete'), exact: true })
    ).toBeVisible();
    await editor
        .locator('[data-merge-side="current"] [data-conflict]')
        .getByRole('button', { name: t('repositories.accept_current'), exact: true })
        .click();
    await page.getByRole('button', { name: t('repositories.merge_complete'), exact: true }).click();
    await expect(editor.locator('[data-merge-done]')).toBeVisible();
    await expect.poll(() => unmerged(dir, DELETED.theirs)).toBe('');
    expect(readFileSync(join(dir, DELETED.theirs), 'utf8')).toBe('changed by this side\n');
    expect(gitOut(dir, 'show', `:${DELETED.theirs}`)).toBe('changed by this side\n');
});

// revert: src/lib/views/sources/repositories/Changes.svelte:238 => ? undefined
test('marks every conflict of a deletion resolved from its row, leaving nothing unmerged', async ({
    page
}) => {
    const dir = deletions();
    await boot(page);
    const shown = await showAdded(page, dir);

    const paths = gitOut(dir, 'diff', '--name-only', '--diff-filter=U').trim().split('\n');
    expect(paths.sort()).toEqual([
        DELETED.both,
        DELETED.ours,
        'renamed-here.txt',
        'renamed-there.txt',
        DELETED.theirs
    ]);
    for (const path of paths) {
        const row = shown.locator(`[data-group="changes"] [data-entry="${path}"]`);
        await row.hover();
        await row.getByRole('button', { name: t('repositories.merge_mark'), exact: true }).click();
        await expect.poll(() => unmerged(dir, path)).toBe('');
    }
    expect(gitOut(dir, 'ls-files', '-u')).toBe('');
    // The worktree held these two, so marking them resolved kept them as they stand.
    expect(readFileSync(join(dir, DELETED.ours), 'utf8')).toBe('changed by the other side\n');
    expect(readFileSync(join(dir, DELETED.theirs), 'utf8')).toBe('changed by this side\n');
});

/** A repository whose `main` and `other` change a.txt's middle line apart. */
function diverged(): string {
    const dir = repository({ 'a.txt': 'one\ntwo\nthree\n' });
    gitIn(dir, 'checkout', '--quiet', '-b', 'other');
    writeFileSync(join(dir, 'a.txt'), 'one\ntheirs\nthree\n');
    gitIn(dir, 'commit', '--quiet', '-am', 'Theirs');
    gitIn(dir, 'checkout', '--quiet', 'main');
    writeFileSync(join(dir, 'a.txt'), 'one\nours\nthree\n');
    gitIn(dir, 'commit', '--quiet', '-am', 'Ours');
    return dir;
}

// revert: src/lib/views/sources/repositories/Repo.svelte:102 => delete
test('aborts a merge that stopped on a conflict, after a confirm', async ({ page }) => {
    const dir = diverged();
    expect(gitTry(dir, 'merge', '--no-edit', 'other')).toBe(1);
    await boot(page);
    const shown = await showAdded(page, dir);

    await expect(shown.locator('[data-sequence="merging"]')).toBeVisible();
    await shown.getByRole('button', { name: t('repositories.abort'), exact: true }).click();
    await expect(page.getByText(t('repositories.abort_confirm'))).toBeVisible();
    await confirm(page);
    await expect(shown.locator('[data-sequence]')).toHaveCount(0, { timeout: 15_000 });
    expect(existsSync(join(dir, '.git', 'MERGE_HEAD'))).toBe(false);
    expect(readFileSync(join(dir, 'a.txt'), 'utf8')).toBe('one\nours\nthree\n');
    expect(gitOut(dir, 'status', '--porcelain')).toBe('');
});

// revert: src/lib/views/sources/repositories/Repo.svelte:108 => delete
test('carries a rebase on once its conflict is resolved, by Continue after a confirm', async ({
    page
}) => {
    const dir = diverged();
    expect(gitTry(dir, 'rebase', 'other')).not.toBe(0);
    await boot(page);
    const shown = await showAdded(page, dir);

    await expect(shown.locator('[data-sequence="rebasing"]')).toBeVisible();
    const carryOn = shown.getByRole('button', { name: t('repositories.continue'), exact: true });
    // Continue is offered only once nothing is left unmerged.
    await expect(carryOn).toHaveCount(0);
    const editor = await openMerge(page, shown, 'a.txt');
    await editor
        .locator('[data-merge-side="incoming"] [data-conflict]')
        .getByRole('button', { name: t('repositories.accept_incoming'), exact: true })
        .click();
    await page.getByRole('button', { name: t('repositories.merge_complete'), exact: true }).click();
    await expect(editor.locator('[data-merge-done]')).toBeVisible();

    await carryOn.click();
    await expect(page.getByText(t('repositories.continue_confirm'))).toBeVisible();
    await confirm(page);
    await expect(shown.locator('[data-sequence]')).toHaveCount(0, { timeout: 15_000 });
    expect(existsSync(join(dir, '.git', 'rebase-merge'))).toBe(false);
    expect(gitOut(dir, 'log', '--format=%s').trim().split('\n')).toEqual([
        'Ours',
        'Theirs',
        'First'
    ]);
});
