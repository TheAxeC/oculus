// The Repositories view in a real browser, over the served copy of the hub, which the layer makes a
// git repository of its own with one commit in it: the repository picker, the sections and their
// heads, the diff a change row opens, and a worktree made and taken away.
//
// Every write here lands inside that copy: the worktree is made under its own worktrees folder and
// taken away again in the same case, so the copy the next spec file serves is the one the layer
// made. Nothing reaches the machine's own checkout.

import { expect, test, type Page } from '@playwright/test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { gitIn } from './git.ts';
import { boot, openView } from './rail.ts';
import { hubDir } from './hub.ts';
import { t } from './words.ts';
import { scratchDir, sweepScratch } from '../scratch.ts';

test.afterAll(sweepScratch);

/** The file the browser layer leaves changed in the copy it serves, which the diff pane opens. */
const CHANGED = 'feeds/position-leads.yml';

/** The name the case makes its worktree under, and where the view says it will go. */
const NAME = 'browser-case';

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

        // the confirm removed the worktree, so its row is gone
        await expect(row).toHaveCount(0);
        await expect.poll(() => existsSync(worktree())).toBe(false);
    });

    // Revert: return `''` for every shape from shapeBadge of views/shared/repo-shape.ts, or filter
    // by `stateOf(root)?.repository === true` in pickerRoots of state/repositories.ts; the folder
    // that is no repository then carries no badge, or leaves the list entirely.
    test('picks among every root, the folder that is no repository saying so on its row', async ({
        page
    }) => {
        // Two repositories whose last folders are both `repo`, and a folder that is none, all under
        // this case's own temporary folders and added as roots through the file browser.
        const made = [0, 1].map(() => {
            const parent = scratchDir('oculus-repositories-spec-');
            expect(resolve(parent).startsWith(resolve(tmpdir()) + sep)).toBe(true);
            const dir = join(parent, 'repo');
            mkdirSync(dir);
            writeFileSync(join(dir, 'a.txt'), 'a\n');
            gitIn(dir, 'init', '--quiet', '--initial-branch=main');
            gitIn(dir, 'add', '--all');
            gitIn(dir, 'commit', '--quiet', '-m', 'one');
            return { dir, label: `${parent.split(sep).at(-1) ?? ''}/repo` };
        });
        const loose = scratchDir('oculus-repositories-loose-');
        expect(resolve(loose).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        const looseName = loose.split(sep).at(-1) ?? '';

        await boot(page);
        await openView(page, 'files', t('views.files'));
        for (const dir of [made[0].dir, made[1].dir, loose]) {
            await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
            await page.getByRole('textbox', { name: t('files.root_dir') }).fill(dir);
            await page.getByRole('button', { name: t('files.add'), exact: true }).click();
            // the add closed the form, which is what says it was taken
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
        // The folder that is no repository is a row like any other, saying which it is. The badge
        // is out of the accessible name, so the row is still found by its label alone.
        const folder = page.getByRole('menuitem', { name: looseName, exact: true });
        await expect(folder).toHaveCount(1);
        await expect(folder).toContainText(t('repositories.pick_norepo'));
        await expect(folder.locator('.item-badge')).toHaveAttribute(
            'title',
            /not a git repository/
        );
        // A repository that reads says its name alone.
        await expect(
            page.getByRole('menuitem', { name: made[0].label, exact: true }).locator('.item-badge')
            // Nothing is wrong with this root, so no few words are drawn at the end of its row.
        ).toHaveCount(0);
        await page.keyboard.press('Escape');

        await pick(page, made[1].label);
        await expect(shown).toHaveAttribute('data-root', new RegExp(`${made[1].label}$`));
        // one repository is drawn at a time, and the pick moved it to another one
        await expect(page.locator(`[data-root="${hubDir()}"]`)).toHaveCount(0);

        // Back to the hub, which the other cases of this file draw.
        await pick(page, hubDir().split(sep).at(-1) ?? '');
        await expect(shown).toHaveAttribute('data-root', hubDir());
    });

    // Revert: filter by `stateOf(root)?.repository === true` in pickerRoots of
    // state/repositories.ts; the deleted root leaves the picker and the view hands itself to the
    // hub, so the row this case waits for never appears.
    test('keeps a root whose folder the reader deleted, saying it is gone', async ({ page }) => {
        const doomed = scratchDir('oculus-repositories-doomed-');
        expect(resolve(doomed).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        const label = doomed.split(sep).at(-1) ?? '';
        try {
            writeFileSync(join(doomed, 'a.txt'), 'a\n');
            gitIn(doomed, 'init', '--quiet', '--initial-branch=main');
            gitIn(doomed, 'add', '--all');
            gitIn(doomed, 'commit', '--quiet', '-m', 'one');

            await boot(page);
            await openView(page, 'files', t('views.files'));
            await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
            await page.getByRole('textbox', { name: t('files.root_dir') }).fill(doomed);
            await page.getByRole('button', { name: t('files.add'), exact: true }).click();
            // The form closes once the root was taken, which is how this waits for the save.
            await expect(page.getByRole('textbox', { name: t('files.root_dir') })).toHaveCount(0);

            await openView(page, 'repositories', t('views.repositories'));
            const opener = page.locator('[data-repo-picker]').getByRole('button').first();
            const row = page.getByRole('menuitem', { name: label, exact: true });

            // The channel reads the roots again once the workspaces file has changed, and the row
            // is a repository that reads, so it carries no badge yet.
            await expect
                .poll(
                    async () => {
                        await opener.click();
                        const listed = await row.count();
                        await page.keyboard.press('Escape');
                        return listed;
                    },
                    { timeout: 10_000 }
                )
                .toBe(1);
            await opener.click();
            // This root reads as a repository again, so the few words about its state are gone.
            await expect(row.locator('.item-badge')).toHaveCount(0);
            await page.keyboard.press('Escape');

            await pick(page, label);
            const shown = page.locator('[data-view="repositories"] [data-root]');
            await expect(shown).toHaveAttribute('data-root', new RegExp(`${label}$`));

            rmSync(doomed, { recursive: true, force: true });

            // The root stays picked and stays in the list; both say the folder is not there.
            await expect(shown.locator('[data-repo="missing"]')).toBeVisible({ timeout: 20_000 });
            await expect(shown.getByText(t('sessions.ch_nofolder'))).toBeVisible();
            await expect(shown).toHaveAttribute('data-root', new RegExp(`${label}$`));
            await opener.click();
            await expect(row.locator('.item-badge')).toContainText(t('repositories.pick_missing'));
            await page.keyboard.press('Escape');

            // Back to the hub, which the other cases of this file draw.
            await pick(page, hubDir().split(sep).at(-1) ?? '');
            await expect(shown).toHaveAttribute('data-root', hubDir());
        } finally {
            rmSync(doomed, { recursive: true, force: true });
        }
    });

    // Revert: drop the `symbolic-ref --short HEAD` read from state() in server/git.ts, so the
    // repository with no commit is drawn as its error row rather than its branch and its files.
    test('lists a repository with no commit yet and switches to it', async ({ page }) => {
        const fresh = scratchDir('oculus-repositories-fresh-');
        expect(resolve(fresh).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        // The folder goes when the case ends, whatever the case did, so no repository is left
        // behind.
        try {
            gitIn(fresh, 'init', '--quiet', '--initial-branch=start');
            writeFileSync(join(fresh, 'loose.txt'), 'x\n');
            const label = fresh.split(sep).at(-1) ?? '';

            await boot(page);
            await openView(page, 'files', t('views.files'));
            await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
            await page.getByRole('textbox', { name: t('files.root_dir') }).fill(fresh);
            await page.getByRole('button', { name: t('files.add'), exact: true }).click();
            // the add closed the form, which is what says it was taken
            await expect(page.getByRole('textbox', { name: t('files.root_dir') })).toHaveCount(0);

            await openView(page, 'repositories', t('views.repositories'));
            const shown = page.locator('[data-view="repositories"] [data-root]');
            await expect(shown).toHaveAttribute('data-root', hubDir());

            // The channel reads the roots again once the workspaces file has changed, so the picker
            // is asked until it lists the new repository.
            const opener = page.locator('[data-repo-picker]').getByRole('button').first();
            await expect
                .poll(
                    async () => {
                        await opener.click();
                        const listed = await page
                            .getByRole('menuitem', { name: label, exact: true })
                            .count();
                        await page.keyboard.press('Escape');
                        return listed;
                    },
                    { timeout: 10_000 }
                )
                .toBe(1);

            await pick(page, label);
            await expect(shown).toHaveAttribute('data-root', new RegExp(`${label}$`));
            const section = page.locator('[data-view="repositories"] [data-root]');
            await expect(section.getByText('start', { exact: true }).first()).toBeVisible();
            await expect(section.locator('[data-entry="loose.txt"]')).toBeVisible();
            await expect(section.getByText(t('repositories.log_empty'))).toBeVisible();
            // Revert: push `sessions.ch_insync` whenever `bits` is empty in
            // views/shared/branch-state.ts. The branch has no upstream, so the line says nothing.
            await expect(section.getByText(t('sessions.ch_insync'))).toHaveCount(0);

            // Back to the hub, which the other cases of this file draw.
            await pick(page, hubDir().split(sep).at(-1) ?? '');
            await expect(shown).toHaveAttribute('data-root', hubDir());
        } finally {
            rmSync(fresh, { recursive: true, force: true });
        }
    });

    // Revert: in repositories/Repo.svelte write the row's attribute as a bare attribute of its own
    // rather than `data-repo={shape}`; the spelling the two git views share for one fact is then
    // gone and the selector below resolves to nothing.
    test('draws a repository whose read fails as one row under the failed spelling', async ({
        page
    }) => {
        const broken = scratchDir('oculus-repositories-broken-');
        expect(resolve(broken).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        // The folder goes when the case ends, whatever the case did.
        try {
            gitIn(broken, 'init', '--quiet', '--initial-branch=main');
            // An index git cannot parse: the root is a repository, and its status read fails.
            writeFileSync(join(broken, '.git', 'index'), 'not an index\n');
            const label = broken.split(sep).at(-1) ?? '';

            await boot(page);
            await openView(page, 'files', t('views.files'));
            await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
            await page.getByRole('textbox', { name: t('files.root_dir') }).fill(broken);
            await page.getByRole('button', { name: t('files.add'), exact: true }).click();
            // The form closes once the root was taken, which is how this waits for the save.
            await expect(page.getByRole('textbox', { name: t('files.root_dir') })).toHaveCount(0);

            await openView(page, 'repositories', t('views.repositories'));
            const shown = page.locator('[data-view="repositories"] [data-root]');

            // The channel reads the roots again once the workspaces file has changed, so the picker
            // is asked until it lists the new repository.
            const opener = page.locator('[data-repo-picker]').getByRole('button').first();
            await expect
                .poll(
                    async () => {
                        await opener.click();
                        const listed = await page
                            .getByRole('menuitem', { name: label, exact: true })
                            .count();
                        await page.keyboard.press('Escape');
                        return listed;
                    },
                    { timeout: 10_000 }
                )
                .toBe(1);

            await pick(page, label);
            await expect(shown).toHaveAttribute('data-root', new RegExp(`${label}$`));
            const failed = shown.locator('[data-repo="failed"]');
            await expect(failed).toBeVisible();
            await expect(failed).toContainText('index');
            // A read that failed draws one sentence in place of the sections, never both.
            await expect(shown.locator('[data-group="changes"]')).toHaveCount(0);

            // Back to the hub, which the other cases of this file draw.
            await pick(page, hubDir().split(sep).at(-1) ?? '');
            await expect(shown).toHaveAttribute('data-root', hubDir());
        } finally {
            rmSync(broken, { recursive: true, force: true });
        }
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
        // the log section is closed, so its commits are not drawn
        await expect(log.getByText('The demo hub as it is shipped')).toHaveCount(0);

        await openView(page, 'files', t('views.files'));
        await page.getByRole('tab', { name: t('views.repositories') }).click();
        await expect(head).toHaveAttribute('aria-expanded', 'false');
        // the tab switch brought the section back closed, so its commits are still not drawn
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
