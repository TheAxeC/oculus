// The Repositories view in a real browser, over the served copy of the hub, which the layer makes a
// git repository of its own with one commit in it: the repository picker, the sections and their
// heads, the diff a change row opens, and a worktree made and taken away.
//
// Every write here lands inside that copy: the worktree is made under its own worktrees folder and
// taken away again in the same case, so the copy the next spec file serves is the one the layer
// made. Nothing reaches the machine's own checkout.

import { expect, test, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { boot, openView } from './rail.ts';
import { hubDir } from './hub.ts';
import { t } from './words.ts';

/** The file the browser layer leaves changed in the copy it serves, which the diff pane opens. */
const CHANGED = 'feeds/position-leads.yml';

/** The name the case makes its worktree under, and where the view says it will go. */
const NAME = 'browser-case';

/**
 * One git command in a repository this spec made under the temporary directory, with the identity on
 * the command line so no git configuration of the machine is read or written.
 */
function gitIn(dir: string, ...args: string[]): void {
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const done = spawnSync(
        'git',
        [
            '-c',
            'user.email=nobody@example.invalid',
            '-c',
            'user.name=Oculus Repositories Spec',
            '-c',
            'commit.gpgsign=false',
            '-C',
            dir,
            ...args
        ],
        { encoding: 'utf8', timeout: 60000 }
    );
    expect(done.status, done.stderr).toBe(0);
}

/** Pick one repository by the name the picker lists it under. */
async function pick(page: Page, name: string): Promise<void> {
    await page.locator('[data-repo-picker]').getByRole('button').first().click();
    await page.getByRole('menuitem', { name, exact: true }).click();
}

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
        // The row itself opens the diff as well; the control on it is the one pressed here.
        await row.hover();
        await row.getByRole('button', { name: t('repositories.diff'), exact: true }).click();

        // The pane is named for what it is over, and draws the diff the endpoint answered.
        await expect(page.getByRole('tab', { name: CHANGED })).toBeVisible();
        await expect(page.getByRole('region', { name: CHANGED })).toContainText('deadline');
    });

    test('makes a worktree, lists it, and takes it away again', async ({ page }) => {
        await boot(page);
        await openView(page, 'repositories', t('views.repositories'));
        const section = page.locator(`[data-root="${hubDir()}"]`);

        const worktrees = section.locator('[data-group="worktrees"]');
        await worktrees.getByRole('textbox', { name: t('repositories.worktree_new') }).fill(NAME);
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

        await row.hover();
        await row.getByRole('button', { name: t('repositories.remove'), exact: true }).click();
        await page.getByRole('button', { name: t('ui.confirm_ok') }).click();

        await expect(row).toHaveCount(0);
        await expect.poll(() => existsSync(worktree())).toBe(false);
    });

    // Revert: pass `gitRoots()` to the picker unfiltered, in views/Repositories.svelte.
    test('picks among the repositories alone, two of one name told apart by their parents', async ({
        page
    }) => {
        // Two repositories whose last folders are both `repo`, and a folder that is none, all under
        // this case's own temporary folders and added as roots through the file browser.
        const made = [0, 1].map(() => {
            const parent = mkdtempSync(join(tmpdir(), 'oculus-repositories-spec-'));
            expect(resolve(parent).startsWith(resolve(tmpdir()) + sep)).toBe(true);
            const dir = join(parent, 'repo');
            mkdirSync(dir);
            writeFileSync(join(dir, 'a.txt'), 'a\n');
            gitIn(dir, 'init', '--quiet', '--initial-branch=main');
            gitIn(dir, 'add', '--all');
            gitIn(dir, 'commit', '--quiet', '-m', 'one');
            return { dir, label: `${parent.split(sep).at(-1) ?? ''}/repo` };
        });
        const loose = mkdtempSync(join(tmpdir(), 'oculus-repositories-loose-'));
        expect(resolve(loose).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        const looseName = loose.split(sep).at(-1) ?? '';

        await boot(page);
        await openView(page, 'files', t('views.files'));
        for (const dir of [made[0].dir, made[1].dir, loose]) {
            await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
            await page.getByRole('textbox', { name: t('files.root_dir') }).fill(dir);
            await page.getByRole('button', { name: t('files.add'), exact: true }).click();
            await expect(page.getByRole('textbox', { name: t('files.root_dir') })).toHaveCount(0);
        }

        await openView(page, 'repositories', t('views.repositories'));
        const shown = page.locator('[data-view="repositories"] [data-root]');
        await expect(shown).toHaveAttribute('data-root', hubDir());

        // The channel reads the roots again once the workspaces file has changed, so the picker is
        // asked until it lists the new repositories.
        const opener = page.locator('[data-repo-picker]').getByRole('button').first();
        await expect
            .poll(
                async () => {
                    await opener.click();
                    const listed = await page
                        .getByRole('menuitem', { name: made[1].label, exact: true })
                        .count();
                    await page.keyboard.press('Escape');
                    return listed;
                },
                { timeout: 10_000 }
            )
            .toBe(1);
        await opener.click();
        await expect(page.getByRole('menuitem', { name: made[0].label, exact: true })).toHaveCount(
            1
        );
        await expect(page.getByRole('menuitem', { name: looseName })).toHaveCount(0);
        await page.keyboard.press('Escape');

        await pick(page, made[1].label);
        await expect(shown).toHaveAttribute('data-root', new RegExp(`${made[1].label}$`));
        await expect(page.locator(`[data-root="${hubDir()}"]`)).toHaveCount(0);

        // Back to the hub, which the other cases of this file draw.
        await pick(page, hubDir().split(sep).at(-1) ?? '');
        await expect(shown).toHaveAttribute('data-root', hubDir());
    });

    // Revert: read `open` as true whatever `collapsed` holds for the log in repositories/Repo.svelte.
    test('closes a section from its head, and keeps it closed after a tab switch', async ({
        page
    }) => {
        await boot(page);
        await openView(page, 'repositories', t('views.repositories'));
        const log = page.locator(`[data-root="${hubDir()}"] [data-group="log"]`);
        const head = log.getByRole('treeitem', { name: t('repositories.log'), exact: true });

        await expect(log.getByText('The demo hub as it is shipped')).toBeVisible();
        await head.getByRole('button').first().click();
        await expect(head).toHaveAttribute('aria-expanded', 'false');
        await expect(log.getByText('The demo hub as it is shipped')).toHaveCount(0);

        await openView(page, 'files', t('views.files'));
        await page.getByRole('tab', { name: t('views.repositories') }).click();
        await expect(head).toHaveAttribute('aria-expanded', 'false');
        await expect(log.getByText('The demo hub as it is shipped')).toHaveCount(0);

        // Opened again, so the page this run saves draws the log as the first case expects it.
        await head.getByRole('button').first().click();
        await expect(log.getByText('The demo hub as it is shipped')).toBeVisible();
    });

    // Revert: make every row's tabindex 0 in ui/TreeView.svelte's nav.
    test("is one stop the arrow keys move along, with a row's controls one Tab from it", async ({
        page
    }) => {
        await boot(page);
        await openView(page, 'repositories', t('views.repositories'));
        const section = page.locator(`[data-root="${hubDir()}"]`);
        const changes = section.getByRole('treeitem', {
            name: t('repositories.changes'),
            exact: true
        });

        // From the picker, Tab lands on the first head and a second Tab leaves the tree for the
        // first field, past every row and every control.
        await page.locator('[data-repo-picker]').getByRole('button').first().focus();
        await page.keyboard.press('Tab');
        await expect(changes).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(
            section.getByRole('textbox', { name: t('git.branch_new'), exact: true })
        ).toBeFocused();

        // Down walks the rows: the changed group, then the changed file, whose controls Tab reaches.
        await changes.focus();
        await page.keyboard.press('ArrowDown');
        const group = section.locator('[data-changes="changed"] [role="treeitem"]');
        await expect(group).toBeFocused();
        await page.keyboard.press('ArrowDown');
        const file = section.locator(`[data-group="changes"] [data-entry="${CHANGED}"]`);
        await expect(file.getByRole('treeitem')).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(
            file.getByRole('button', { name: t('repositories.diff'), exact: true })
        ).toBeFocused();

        // Left from the file goes up to its group, and Left on the open group closes it.
        await file.getByRole('treeitem').focus();
        await page.keyboard.press('ArrowLeft');
        await expect(group).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(group).toHaveAttribute('aria-expanded', 'false');
        await page.keyboard.press('ArrowRight');
        await expect(group).toHaveAttribute('aria-expanded', 'true');
    });
});
