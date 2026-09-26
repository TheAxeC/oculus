// The commit box and the Changes heads in Chrome, over repositories of the case's own under the
// system temporary directory, a bare remote beside the ones that push: a pull from the view's
// `...` menu, Commit (Amend), Commit and Push and Commit and Sync from the Commit button's list,
// Ctrl+Enter and Cmd+Enter in the message field, and Stage All, Unstage All and Discard All on the
// group heads. Each write is read back from the repository with git.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitIn, gitOut } from '../helpers/git.ts';
import { boot } from '../helpers/rail.ts';
import { keepServedFiles } from '../helpers/files.ts';
import { t } from '../helpers/words.ts';
import { sweepScratch } from '../../fixtures/scratch.ts';
import { fromMenu, origin, pushedElsewhere, repository, showAdded } from './scm.ts';

keepServedFiles();

test.afterAll(sweepScratch);

/** Press OK on the confirm dialog on screen, once it says `question`. */
async function confirmed(page: Page, question: string): Promise<void> {
    await expect(page.getByText(question)).toBeVisible();
    await page.getByRole('button', { name: t('ui.confirm_ok'), exact: true }).click();
}

/** Type a commit message into the shown repository's box. */
async function typed(shown: Locator, message: string): Promise<Locator> {
    const box = shown.getByRole('textbox', { name: t('git.commit_label'), exact: true });
    await box.fill(message);
    return box;
}

/** Choose one way to commit from the list beside the Commit button. */
async function commitAs(page: Page, shown: Locator, label: string): Promise<void> {
    await shown
        .locator('[data-commit-split]')
        .getByRole('button', { name: t('git.commit_more'), exact: true })
        .click();
    await page.getByRole('menuitem', { name: label, exact: true }).click();
}

/** The subjects of the branch's commits, newest first. */
function subjects(dir: string, ref = 'HEAD'): string[] {
    return gitOut(dir, 'log', '--format=%s', ref).trim().split('\n');
}

// revert: src/lib/views/sources/repositories/Repositories.svelte:160 => delete
test('pulls what the upstream holds from the menu, after a confirm', async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\n' });
    const bare = origin(dir);
    const incoming = pushedElsewhere(bare, 'b.txt', 'From elsewhere');
    gitIn(dir, 'fetch', '--quiet');
    await boot(page);
    await showAdded(page, dir);

    await fromMenu(page, t('repositories.pull'));
    await confirmed(page, t('repositories.pull_confirm', 'main', 'origin/main'));
    await expect.poll(() => gitOut(dir, 'rev-parse', 'HEAD').trim()).toBe(incoming);
    expect(readFileSync(join(dir, 'b.txt'), 'utf8')).toBe('b.txt\n');
});

// revert: src/lib/views/shared/changes/CommitBox.svelte:140 => onpick={() => commit('commit')}
test('amends the last commit by Commit (Amend), with the message typed', async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\n' });
    writeFileSync(join(dir, 'a.txt'), 'two\n');
    gitIn(dir, 'add', 'a.txt');
    await boot(page);
    const shown = await showAdded(page, dir);

    await typed(shown, 'Amended');
    await commitAs(page, shown, t('git.commit_amend'));
    await confirmed(page, t('git.amend_confirm', 'main'));
    await expect.poll(() => subjects(dir)).toEqual(['Amended']);
    expect(gitOut(dir, 'show', 'HEAD:a.txt')).toBe('two\n');
});

// revert: src/lib/state/sources/repositories/repositories.svelte.ts:245 => delete
test('commits and pushes by Commit and Push', async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\n' });
    const bare = origin(dir);
    writeFileSync(join(dir, 'a.txt'), 'two\n');
    gitIn(dir, 'add', 'a.txt');
    await boot(page);
    const shown = await showAdded(page, dir);

    await typed(shown, 'Pushed');
    await commitAs(page, shown, t('git.commit_push'));
    await confirmed(page, t('git.commit_push_confirm', 1, 'main', 'origin/main'));
    await expect.poll(() => subjects(bare, 'main')).toEqual(['Pushed', 'First']);
    expect(gitOut(bare, 'rev-parse', 'main')).toBe(gitOut(dir, 'rev-parse', 'HEAD'));
});

// revert: src/lib/state/sources/repositories/repositories.svelte.ts:246 => delete
test('commits, pulls and pushes by Commit and Sync', async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\n' });
    const bare = origin(dir);
    const incoming = pushedElsewhere(bare, 'b.txt', 'From elsewhere');
    gitIn(dir, 'config', 'pull.rebase', 'false');
    writeFileSync(join(dir, 'a.txt'), 'two\n');
    gitIn(dir, 'add', 'a.txt');
    await boot(page);
    const shown = await showAdded(page, dir);

    await typed(shown, 'Synced');
    await commitAs(page, shown, t('git.commit_sync'));
    await confirmed(page, t('git.commit_sync_confirm', 1, 'main', 'origin/main'));
    await expect.poll(() => subjects(bare, 'main'), { timeout: 15_000 }).toContain('Synced');
    expect(gitOut(bare, 'rev-parse', 'main')).toBe(gitOut(dir, 'rev-parse', 'HEAD'));
    // The pull took the commit pushed elsewhere, which the local branch now holds.
    expect(gitOut(dir, 'merge-base', '--is-ancestor', incoming, 'HEAD')).toBe('');
});

// revert: src/lib/views/shared/changes/CommitBox.svelte:104 => return;
test('commits by Ctrl+Enter in the message field, after a confirm', async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\n' });
    writeFileSync(join(dir, 'a.txt'), 'two\n');
    gitIn(dir, 'add', 'a.txt');
    await boot(page);
    const shown = await showAdded(page, dir);

    const box = await typed(shown, 'By the keys');
    await box.press('Control+Enter');
    await confirmed(page, t('git.commit_confirm', 1, 'main'));
    await expect.poll(() => subjects(dir)).toEqual(['By the keys', 'First']);
});

// revert: src/lib/views/shared/changes/CommitBox.svelte:104 => if (event.key !== 'Enter' || !event.ctrlKey) return;
test('commits by Cmd+Enter in the message field, after a confirm', async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\n' });
    writeFileSync(join(dir, 'a.txt'), 'two\n');
    gitIn(dir, 'add', 'a.txt');
    await boot(page);
    const shown = await showAdded(page, dir);

    const box = await typed(shown, 'By the command key');
    await box.press('Meta+Enter');
    await confirmed(page, t('git.commit_confirm', 1, 'main'));
    await expect.poll(() => subjects(dir)).toEqual(['By the command key', 'First']);
});

/** A group head's own button, which it shows while the pointer is over it. */
async function head(shown: Locator, group: string, label: string): Promise<void> {
    const row = shown.locator(`[data-changes="${group}"]`);
    await row.hover();
    await row.getByRole('button', { name: label, exact: true }).click();
}

/** The paths git holds staged. */
function staged(dir: string): string {
    return gitOut(dir, 'diff', '--cached', '--name-only');
}

// revert: src/lib/views/sources/repositories/Changes.svelte:142 => onclick={() => undefined}
// revert: src/lib/views/sources/repositories/Changes.svelte:151 => onclick={() => undefined}
// revert: src/lib/views/sources/repositories/Changes.svelte:125 => onclick={() => undefined}
test('stages every change, then every untracked file, then unstages them all', async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\n', 'b.txt': 'one\n' });
    writeFileSync(join(dir, 'a.txt'), 'two\n');
    writeFileSync(join(dir, 'b.txt'), 'two\n');
    writeFileSync(join(dir, 'c.txt'), 'new\n');
    await boot(page);
    const shown = await showAdded(page, dir);

    await head(shown, 'changed', t('git.stage_all'));
    await expect.poll(() => staged(dir)).toBe('a.txt\nb.txt\n');
    await head(shown, 'untracked', t('git.stage_all_untracked'));
    await expect.poll(() => staged(dir)).toBe('a.txt\nb.txt\nc.txt\n');
    await head(shown, 'staged', t('git.unstage_all'));
    await expect.poll(() => staged(dir)).toBe('');
    expect(gitOut(dir, 'status', '--porcelain')).toBe(' M a.txt\n M b.txt\n?? c.txt\n');
});

// revert: src/lib/views/sources/repositories/Changes.svelte:90 => delete
test('discards every tracked change after a confirm, and keeps the untracked file', async ({
    page
}) => {
    const dir = repository({ 'a.txt': 'one\n', 'b.txt': 'one\n' });
    writeFileSync(join(dir, 'a.txt'), 'two\n');
    writeFileSync(join(dir, 'b.txt'), 'two\n');
    writeFileSync(join(dir, 'c.txt'), 'new\n');
    await boot(page);
    const shown = await showAdded(page, dir);

    await head(shown, 'changed', t('git.discard_all'));
    await confirmed(page, t('git.discard_all_confirm', 2));
    await expect.poll(() => gitOut(dir, 'status', '--porcelain')).toBe('?? c.txt\n');
    expect(readFileSync(join(dir, 'a.txt'), 'utf8')).toBe('one\n');
    expect(readFileSync(join(dir, 'b.txt'), 'utf8')).toBe('one\n');
});
