// The Source Control specs' own helpers: a repository of the case's own under the system temporary
// directory, a bare remote it tracks and a commit another clone pushes there, the Repositories
// list's row for a root, a root added through the file browser and shown in the Repositories view,
// a file of it opened in a source tab, a choice of the view's `...` menu, and the diff pane with
// the frame around it. The repository carries its identity in its own configuration, so a commit
// the server makes in it reads nothing of the machine's.

import { expect, type Locator, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { gitIn, gitOut } from '../helpers/git.ts';
import { row } from '../helpers/files.ts';
import { openView } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';
import { scratchDir } from '../../fixtures/scratch.ts';

/** A repository on `main` holding these files in one commit, under a folder of its own. */
export function repository(files: Record<string, string>): string {
    const dir = scratchDir('oculus-scm-');
    gitIn(dir, 'init', '--quiet', '--initial-branch=main');
    gitIn(dir, 'config', 'user.name', 'Oculus Browser Spec');
    gitIn(dir, 'config', 'user.email', 'nobody@example.invalid');
    gitIn(dir, 'config', 'commit.gpgsign', 'false');
    gitIn(dir, 'config', 'tag.gpgsign', 'false');
    for (const [path, text] of Object.entries(files)) writeFileSync(join(dir, path), text);
    gitIn(dir, 'add', '--all');
    gitIn(dir, 'commit', '--quiet', '-m', 'First');
    return dir;
}

/** A bare repository under a folder of its own that `dir`'s main is pushed to and tracks. */
export function origin(dir: string): string {
    const bare = join(scratchDir('oculus-scm-origin-'), 'origin.git');
    mkdirSync(bare);
    gitIn(bare, 'init', '--quiet', '--bare', '--initial-branch=main');
    gitIn(dir, 'remote', 'add', 'origin', bare);
    gitIn(dir, 'push', '--quiet', '-u', 'origin', 'main');
    return bare;
}

/** A commit another clone of `bare` pushes to its main, adding one file; answers its hash. */
export function pushedElsewhere(bare: string, path: string, message: string): string {
    const other = join(scratchDir('oculus-scm-other-'), 'other');
    gitIn(join(other, '..'), 'clone', '--quiet', bare, other);
    writeFileSync(join(other, path), `${path}\n`);
    gitIn(other, 'add', path);
    gitIn(other, 'commit', '--quiet', '-m', message);
    gitIn(other, 'push', '--quiet', 'origin', 'main');
    return gitOut(other, 'rev-parse', 'HEAD').trim();
}

/** The name the file browser and the Repositories list give a root: its last folder. */
export function labelOf(dir: string): string {
    return dir.split(sep).at(-1) ?? '';
}

/** The row the Repositories list draws for a root, found by the name it lists it under. */
export function listRow(page: Page, name: string): Locator {
    return page.locator('[data-repo-row]').getByRole('treeitem', { name, exact: true });
}

/** The whole entry of a root in the Repositories list, its badge and its count with its row. */
export function listEntry(page: Page, name: string): Locator {
    return page
        .locator('[data-repo-row]')
        .filter({ has: page.getByRole('treeitem', { name, exact: true }) });
}

/** Choose one repository by the name the list draws it under. */
export async function pick(page: Page, name: string): Promise<void> {
    await listRow(page, name).click();
}

/** Add a folder as a root through the file browser, which the page is to show already. */
export async function addRoot(page: Page, dir: string): Promise<void> {
    await openView(page, 'files', t('views.files'));
    await page.getByRole('button', { name: t('files.add_root'), exact: true }).click();
    await page.getByRole('textbox', { name: t('files.root_dir') }).fill(dir);
    await page.getByRole('button', { name: t('files.add'), exact: true }).click();
    // the add closed the form, which is what says it was taken
    await expect(page.getByRole('textbox', { name: t('files.root_dir') })).toHaveCount(0);
}

/**
 * Add a folder as a root, then show it in the Repositories view. The channel reads the roots again
 * once the workspaces file has changed, so this waits until the list draws the folder. Answers the
 * view's shown section, which then names the folder.
 */
export async function showAdded(page: Page, dir: string): Promise<Locator> {
    const label = labelOf(dir);
    await addRoot(page, dir);
    await openView(page, 'repositories', t('views.repositories'));
    await expect(listRow(page, label)).toHaveCount(1, { timeout: 10_000 });
    await pick(page, label);
    const shown = page.locator('[data-view="repositories"] [data-root]');
    await expect(shown).toHaveAttribute('data-root', new RegExp(`${label}$`));
    return shown;
}

/** Open one file of an added root in a source tab from the file browser. */
export async function openSource(page: Page, dir: string, path: string): Promise<Locator> {
    const key = labelOf(dir);
    await openView(page, 'files', t('views.files'));
    await expect(row(page, key)).toBeVisible();
    await row(page, key).click();
    await row(page, key, path).click();
    const editor = page.locator(`[data-source-editor="${path}"]`);
    await expect(editor).toBeVisible();
    return editor;
}

/** Choose one item of the Repositories view's `...` menu by its words. */
export async function fromMenu(page: Page, label: string): Promise<void> {
    await page
        .locator('[data-repo-menu]')
        .getByRole('button', { name: t('repositories.menu'), exact: true })
        .click();
    await page.getByRole('menuitem', { name: label, exact: true }).click();
}

/** The one diff pane on screen. */
export function diffPane(page: Page): Locator {
    return page.locator('[data-view="repositories-diff"]:visible');
}

/** The pane around the diff on screen, whose bar holds the layout, the moves and Open File. */
export function diffFrame(page: Page): Locator {
    return page.locator('section.pane').filter({ has: diffPane(page) });
}
