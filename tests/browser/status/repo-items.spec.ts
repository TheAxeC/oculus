// The status bar's branch and sync items in Chrome, over a repository of the case's own: a working
// copy under the system temporary directory with a bare upstream beside it, a second branch, and
// one commit not yet pushed. It is added to the file browser as a root, and a file of it opened in
// a source tab is what makes it the repository the bar draws. The branch picker checks a branch
// out, and the sync item pushes the commit, each after the confirm, and the repository on disk is
// read back to prove it.

import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { keepServedFiles, row } from '../helpers/files.ts';
import { gitIn } from '../helpers/git.ts';
import { t } from '../helpers/words.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';
import { bootOn, button, item } from './status.ts';

keepServedFiles();

test.afterAll(sweepScratch);

/** The working copy's folder name, which is also the key the file browser gives its root. */
const WORK = 'status-work';

/**
 * A working copy on `main` tracking a bare upstream, with a second branch `draft` and one commit
 * on `main` the upstream does not hold.
 */
function repository(): { work: string; bare: string } {
    const top = scratchDir('oculus-status-git-');
    const bare = join(top, 'origin.git');
    const work = join(top, WORK);
    mkdirSync(bare);
    mkdirSync(work);
    gitIn(bare, 'init', '--bare', '-b', 'main');
    gitIn(work, 'init', '-b', 'main');
    writeFileSync(join(work, 'a.txt'), 'one\n');
    gitIn(work, 'add', 'a.txt');
    gitIn(work, 'commit', '-m', 'One');
    gitIn(work, 'remote', 'add', 'origin', bare);
    gitIn(work, 'push', '-u', 'origin', 'main');
    gitIn(work, 'branch', 'draft');
    writeFileSync(join(work, 'a.txt'), 'one\ntwo\n');
    gitIn(work, 'commit', '-am', 'Two');
    return { work, bare };
}

/** Add the working copy as a root of the file browser and open its file in a source tab. */
async function openIn(page: Page, work: string): Promise<void> {
    await bootOn(page, [{ id: 'files', view: 'files', state: null }]);
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    await page.getByRole('textbox', { name: t('files.root_dir') }).fill(work);
    await page.getByRole('button', { name: t('files.add'), exact: true }).click();
    await expect(row(page, WORK)).toBeVisible();
    await row(page, WORK).click();
    await row(page, WORK, 'a.txt').click();
    await expect(page.locator('[data-source-editor="a.txt"]')).toBeVisible();
    // The git channel reads the new root on its next pass, and the bar follows it.
    await expect(item(page, 'branch')).toHaveAttribute('data-repo', new RegExp(`${WORK}$`), {
        timeout: 15_000
    });
}

// revert: src/lib/shell/status/RepoItems.svelte:58 => act: () => undefined
test('the branch item lists the branches of the tab repository, and a choice checks it out after the confirm', async ({
    page
}) => {
    const { work } = repository();
    await openIn(page, work);
    await expect(button(page, 'branch')).toHaveText('main');
    await button(page, 'branch').click();
    const menu = page.getByRole('menu', { name: t('statusbar.branch_menu', WORK) });
    await expect(menu.getByRole('menuitem')).toHaveText(['draft', 'main']);
    await expect(menu.getByRole('menuitem', { name: 'main' })).toHaveAttribute(
        'aria-current',
        'true'
    );
    await menu.getByRole('menuitem', { name: 'draft' }).click();
    const asked = page.getByRole('alertdialog', { name: t('git.branch_switch_confirm', 'draft') });
    await expect(asked).toBeVisible();
    await asked.getByRole('button', { name: t('repositories.switch'), exact: true }).click();
    await expect(button(page, 'branch')).toHaveText('draft', { timeout: 15_000 });
    expect(readFileSync(join(work, '.git', 'HEAD'), 'utf8').trim()).toBe('ref: refs/heads/draft');
});

// revert: src/lib/shell/status/RepoItems.svelte:72 => act: () => undefined
test('the sync item draws how far the branch is from its upstream, and pushes a branch only ahead after the confirm', async ({
    page
}) => {
    const { work, bare } = repository();
    await openIn(page, work);
    const sync = button(page, 'sync');
    await expect(sync.locator('[data-sync="behind"]')).toHaveText('0');
    await expect(sync.locator('[data-sync="ahead"]')).toHaveText('1');
    await sync.click();
    const asked = page.getByRole('alertdialog', {
        name: t('git.push_confirm', 'main', 'origin/main')
    });
    await expect(asked).toBeVisible();
    await asked.getByRole('button', { name: t('git.push'), exact: true }).click();
    await expect(sync.locator('[data-sync="ahead"]')).toHaveText('0', { timeout: 15_000 });
    const pushed = readFileSync(join(bare, 'refs', 'heads', 'main'), 'utf8').trim();
    const local = readFileSync(join(work, '.git', 'refs', 'heads', 'main'), 'utf8').trim();
    expect(pushed).toBe(local);
    // In step with its upstream, the item opens the Repositories view rather than pushing.
    await sync.click();
    await expect(page.getByRole('tab', { name: t('views.repositories') })).toHaveAttribute(
        'aria-selected',
        'true'
    );
});
