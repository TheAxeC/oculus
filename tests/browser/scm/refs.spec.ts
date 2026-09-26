// Stashes and tags in Chrome, over a repository of the case's own under the system temporary
// directory: a stash made from the view's `...` menu with a message typed into the prompt, then
// popped from the Stashes section; a stash applied, dropped after a confirm, and viewed as its
// diff; an annotated tag created the same way, a tag deleted after a confirm, a tag's row opening
// its commit in the graph, and the tags pushed to the remote. Each write is read back from the
// repository with git.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitIn, gitOut } from '../helpers/git.ts';
import { boot } from '../helpers/rail.ts';
import { keepServedFiles } from '../helpers/files.ts';
import { t } from '../helpers/words.ts';
import { sweepScratch } from '../../fixtures/scratch.ts';
import { diffPane, fromMenu, origin, repository, showAdded } from './scm.ts';

keepServedFiles();

test.afterAll(sweepScratch);

// revert: src/lib/views/sources/repositories/Repositories.svelte:202 => delete
test('makes a stash with a message and pops it again', async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\n' });
    writeFileSync(join(dir, 'a.txt'), 'two\n');
    await boot(page);
    const shown = await showAdded(page, dir);

    await fromMenu(page, t('repositories.stash_tracked'));
    const prompt = page.getByRole('dialog', { name: t('repositories.stash_tracked') });
    await prompt
        .getByRole('textbox', { name: t('repositories.stash_message'), exact: true })
        .fill('kept aside');
    await prompt.getByRole('button', { name: t('repositories.stash_do'), exact: true }).click();

    const stash = shown.locator('[data-stash="stash@{0}"]');
    await expect(stash).toContainText('kept aside', { timeout: 15_000 });
    expect(readFileSync(join(dir, 'a.txt'), 'utf8')).toBe('one\n');
    expect(gitOut(dir, 'stash', 'list')).toContain('kept aside');

    await stash.hover();
    await stash.getByRole('button', { name: t('repositories.stash_pop'), exact: true }).click();
    await expect(shown.locator('[data-stash]')).toHaveCount(0, { timeout: 15_000 });
    expect(readFileSync(join(dir, 'a.txt'), 'utf8')).toBe('two\n');
    expect(gitOut(dir, 'stash', 'list')).toBe('');
});

// revert: src/lib/views/sources/repositories/Repositories.svelte:218 => delete
test('creates an annotated tag at the head and lists it under Tags', async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\n' });
    await boot(page);
    const shown = await showAdded(page, dir);

    await fromMenu(page, t('repositories.tag_create'));
    const prompt = page.getByRole('dialog', { name: t('repositories.tag_create') });
    await prompt
        .getByRole('textbox', { name: t('repositories.tag_name'), exact: true })
        .fill('v1.0');
    await prompt
        .getByRole('textbox', { name: t('repositories.tag_message'), exact: true })
        .fill('The first release');
    await prompt.getByRole('button', { name: t('repositories.tag_do'), exact: true }).click();

    await expect(shown.locator('[data-tag="v1.0"]')).toBeVisible({ timeout: 15_000 });
    expect(gitOut(dir, 'cat-file', '-t', 'v1.0').trim()).toBe('tag');
    expect(gitOut(dir, 'tag', '-n1', 'v1.0')).toContain('The first release');
    expect(gitOut(dir, 'rev-parse', 'v1.0^{commit}')).toBe(gitOut(dir, 'rev-parse', 'HEAD'));
});

/** A repository whose a.txt change is stashed as `kept aside`, the worktree back at `one`. */
function stashed(): string {
    const dir = repository({ 'a.txt': 'one\n' });
    writeFileSync(join(dir, 'a.txt'), 'two\n');
    gitIn(dir, 'stash', 'push', '--quiet', '-m', 'kept aside');
    expect(readFileSync(join(dir, 'a.txt'), 'utf8')).toBe('one\n');
    return dir;
}

/** Press one of a row's own buttons, which it shows while the pointer is over it. */
async function press(row: Locator, label: string): Promise<void> {
    await row.hover();
    await row.getByRole('button', { name: label, exact: true }).click();
}

/** Press OK on the confirm dialog on screen, once it says `question`. */
async function confirmed(page: Page, question: string): Promise<void> {
    await expect(page.getByText(question)).toBeVisible();
    await page.getByRole('button', { name: t('ui.confirm_ok'), exact: true }).click();
}

// revert: src/lib/views/sources/repositories/refs/Stashes.svelte:72 => onclick={() => undefined}
test('applies a stash and keeps it', async ({ page }) => {
    const dir = stashed();
    await boot(page);
    const shown = await showAdded(page, dir);

    await press(shown.locator('[data-stash="stash@{0}"]'), t('repositories.stash_apply'));
    await expect.poll(() => readFileSync(join(dir, 'a.txt'), 'utf8')).toBe('two\n');
    expect(gitOut(dir, 'stash', 'list')).toContain('kept aside');
    await expect(shown.locator('[data-stash="stash@{0}"]')).toBeVisible();
});

// revert: src/lib/views/sources/repositories/refs/Stashes.svelte:88 => onclick={() => undefined}
test('drops a stash after a confirm, and leaves the worktree as it is', async ({ page }) => {
    const dir = stashed();
    await boot(page);
    const shown = await showAdded(page, dir);

    await press(shown.locator('[data-stash="stash@{0}"]'), t('repositories.stash_drop'));
    await confirmed(page, t('repositories.stash_drop_confirm', 'stash@{0}'));
    await expect(shown.locator('[data-stash]')).toHaveCount(0, { timeout: 15_000 });
    expect(gitOut(dir, 'stash', 'list')).toBe('');
    expect(readFileSync(join(dir, 'a.txt'), 'utf8')).toBe('one\n');
});

// revert: src/lib/views/sources/repositories/refs/Stashes.svelte:60 => onclick={() => undefined}
test('shows what a stash holds as its diff, from its row', async ({ page }) => {
    const dir = stashed();
    await boot(page);
    const shown = await showAdded(page, dir);

    await shown.locator('[data-stash="stash@{0}"]').getByRole('treeitem').click();
    const file = diffPane(page).locator('[data-diff-file="a.txt"]');
    await expect(file).toBeVisible();
    await expect(file.locator('.cell.removed')).toContainText('one');
    await expect(file.locator('.cell.added')).toContainText('two');
});

// revert: src/lib/views/sources/repositories/refs/Tags.svelte:26 => delete
test('deletes a tag after a confirm', async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\n' });
    gitIn(dir, 'tag', 'v1');
    await boot(page);
    const shown = await showAdded(page, dir);

    await press(shown.locator('[data-tag="v1"]'), t('repositories.tag_delete'));
    await confirmed(page, t('repositories.tag_delete_confirm', 'v1'));
    await expect(shown.locator('[data-tag]')).toHaveCount(0, { timeout: 15_000 });
    expect(gitOut(dir, 'tag', '-l')).toBe('');
});

// revert: src/lib/views/sources/repositories/refs/Tags.svelte:55 => onclick={() => undefined}
test("opens a tag's commit in the graph from its row", async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\n' });
    const first = gitOut(dir, 'rev-parse', 'HEAD').trim();
    gitIn(dir, 'tag', 'v1');
    writeFileSync(join(dir, 'a.txt'), 'two\n');
    gitIn(dir, 'commit', '--quiet', '-am', 'Second');
    await boot(page);
    const shown = await showAdded(page, dir);

    await shown.locator('[data-tag="v1"]').getByRole('treeitem').click();
    const opened = shown.locator(`[data-group="graph"] [data-commit="${first}"]`).first();
    await expect(opened.getByRole('treeitem')).toHaveAttribute('aria-expanded', 'true');
    await expect(shown.locator('[data-commit-file="a.txt"]')).toBeVisible();
});

// revert: src/lib/views/sources/repositories/Repositories.svelte:151 => delete
test('pushes every tag to the remote from the menu, after a confirm', async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\n' });
    const bare = origin(dir);
    gitIn(dir, 'tag', 'v1');
    gitIn(dir, 'tag', '-a', 'v2', '-m', 'The second');
    await boot(page);
    await showAdded(page, dir);

    await fromMenu(page, t('repositories.tags_push'));
    await confirmed(page, t('repositories.tags_push_confirm'));
    await expect.poll(() => gitOut(bare, 'tag', '-l')).toBe('v1\nv2\n');
});
