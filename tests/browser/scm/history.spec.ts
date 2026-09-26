// The history a repository shows in Chrome, over repositories of the case's own under the system
// temporary directory: the graph with a commit the upstream holds and the branch does not, fetched
// from the view's `...` menu, its next page by Load More, a commit's file opening its diff, a
// commit's id and message copied from its menu, and blame turned on in a source tab, with a line
// not yet committed and a press on a blamed line opening its commit in the graph.

import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitIn, gitOut } from '../helpers/git.ts';
import { boot } from '../helpers/rail.ts';
import { keepServedFiles } from '../helpers/files.ts';
import { t } from '../helpers/words.ts';
import { sweepScratch } from '../../fixtures/scratch.ts';
import {
    diffPane,
    fromMenu,
    openSource,
    origin,
    pushedElsewhere,
    repository,
    showAdded
} from './scm.ts';

keepServedFiles();

test.afterAll(sweepScratch);

// revert: src/lib/views/sources/repositories/graph/Graph.svelte:232 => {#if false}
test('draws the graph with an incoming commit once the upstream is fetched', async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\n' });
    const bare = origin(dir);
    // Another clone pushes a commit the working copy has not fetched.
    const incoming = pushedElsewhere(bare, 'b.txt', 'From elsewhere');
    const head = gitOut(dir, 'rev-parse', 'HEAD').trim();

    await boot(page);
    const shown = await showAdded(page, dir);
    const graph = shown.locator('[data-group="graph"]');
    // The head's own row is drawn and marked as the head, with its lane.
    const own = graph.locator(`[data-commit="${head}"]`).first();
    await expect(own.getByRole('treeitem')).toHaveAttribute('aria-current', 'true');
    await expect(own.locator('svg.lanes')).toHaveCount(1);
    await expect(own.locator('svg.lanes circle.head')).toHaveCount(1);
    // Nothing is fetched yet, so the upstream holds nothing the branch does not know of.
    await expect(graph.locator('[data-graph="incoming"]')).toHaveCount(0);

    await fromMenu(page, t('repositories.fetch'));
    await expect(graph.locator('[data-graph="incoming"]')).toBeVisible({ timeout: 15_000 });
    await expect(
        graph.locator('[data-graph="incoming"]').getByRole('treeitem', {
            name: t('repositories.incoming'),
            exact: true
        })
    ).toBeVisible();
    await expect(graph.locator(`[data-commit="${incoming}"]`).first()).toContainText(
        'From elsewhere'
    );
});

// revert: src/lib/views/sources/source/Source.svelte:340 => onclick={() => undefined}
test('turns blame on in a source tab, and a blamed line opens its commit in the graph', async ({
    page
}) => {
    const dir = repository({ 'a.txt': 'one\ntwo\nthree\n' });
    writeFileSync(join(dir, 'a.txt'), 'one\nchanged\nthree\n');
    const first = gitOut(dir, 'rev-parse', 'HEAD').trim();
    await boot(page);
    await showAdded(page, dir);
    const editor = await openSource(page, dir, 'a.txt');
    // Blame starts off, so the gutter holds line numbers and marks alone.
    await expect(editor.locator('[data-blame-line]')).toHaveCount(0);

    await page.getByRole('button', { name: t('source.blame'), exact: true }).click();
    const blamed = editor.locator('[data-blame-line="1"]');
    await expect(blamed).toHaveAttribute('aria-label', new RegExp(`${first.slice(0, 7)}.*First`), {
        timeout: 15_000
    });
    await expect(blamed).toContainText('Oculus Browser Spec');
    // The line changed on disk is not in any commit yet, and says so.
    await expect(editor.locator('[data-blame-line="2"]')).toHaveAttribute(
        'aria-label',
        t('repositories.blame_uncommitted')
    );
    await expect(editor.locator('[data-blame-line="2"]')).toBeDisabled();
    // The status bar says the caret line's blame.
    await expect(page.locator('[data-status-bar] [data-status="blame"]')).toBeVisible();

    await blamed.click();
    const opened = page.locator(`[data-view="repositories"] [data-commit="${first}"]`).first();
    await expect(opened.getByRole('treeitem')).toHaveAttribute('aria-expanded', 'true');
});

// revert: src/lib/views/sources/repositories/graph/Graph.svelte:284 => onclick={() => undefined}
test('draws the next page of the graph by Load More', async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\n' });
    // Fifty-four commits after the first: one page of fifty, and four more behind Load More.
    for (let at = 1; at < 55; at += 1) {
        gitIn(dir, 'commit', '--quiet', '--allow-empty', '-m', `Commit ${at}`);
    }
    await boot(page);
    const shown = await showAdded(page, dir);
    const graph = shown.locator('[data-group="graph"]');
    await expect(graph.locator('li.commit')).toHaveCount(50, { timeout: 15_000 });

    await graph
        .locator('[data-graph="more"]')
        .getByRole('treeitem', { name: t('repositories.graph_more'), exact: true })
        .click();
    await expect(graph.locator('li.commit')).toHaveCount(55);
    // The history ends at the fifty-fifth commit, so there is no further page to load.
    await expect(graph.locator('[data-graph="more"]')).toHaveCount(0);
    const first = gitOut(dir, 'rev-list', '--max-parents=0', 'HEAD').trim();
    await expect(graph.locator(`[data-commit="${first}"]`)).toHaveCount(1);
});

// revert: src/lib/views/sources/repositories/graph/CommitFiles.svelte:90 => onclick={() => undefined}
test("opens a file of a commit in the graph as that commit's diff", async ({ page }) => {
    const dir = repository({ 'a.txt': 'one\n' });
    writeFileSync(join(dir, 'a.txt'), 'one\ntwo\n');
    gitIn(dir, 'commit', '--quiet', '-am', 'Second');
    const head = gitOut(dir, 'rev-parse', 'HEAD').trim();
    await boot(page);
    const shown = await showAdded(page, dir);
    const graph = shown.locator('[data-group="graph"]');

    await graph.locator(`[data-commit="${head}"]`).getByRole('treeitem').click();
    const file = graph.locator('[data-commit-file="a.txt"]');
    await expect(file).toBeVisible();
    await file.getByRole('treeitem').click();
    const diff = diffPane(page).locator('[data-diff-file="a.txt"]');
    await expect(diff).toBeVisible();
    await expect(diff.locator('.cell.added')).toContainText('two');
});

// revert: src/lib/views/sources/repositories/graph/Graph.svelte:101 => delete
test("reaches an open commit's files by the arrow keys, and Enter opens one's diff", async ({
    page
}) => {
    const dir = repository({ 'a.txt': 'one\n' });
    writeFileSync(join(dir, 'a.txt'), 'one\ntwo\n');
    gitIn(dir, 'commit', '--quiet', '-am', 'Second');
    const head = gitOut(dir, 'rev-parse', 'HEAD').trim();
    await boot(page);
    const shown = await showAdded(page, dir);
    const graph = shown.locator('[data-group="graph"]');

    const own = graph.locator(`[data-commit="${head}"]`).getByRole('treeitem');
    await own.click();
    const file = graph.locator('[data-commit-file="a.txt"]').getByRole('treeitem');
    await expect(file).toBeVisible();
    await own.focus();
    await page.keyboard.press('ArrowDown');
    await expect(file).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(diffPane(page).locator('[data-diff-file="a.txt"]')).toBeVisible();
});

// revert: src/lib/views/sources/repositories/graph/Graph.svelte:146 => void navigator.clipboard.writeText(one.subject);
test("copies a commit's id and its whole message from its menu", async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const dir = repository({ 'a.txt': 'one\n' });
    writeFileSync(join(dir, 'a.txt'), 'two\n');
    gitIn(dir, 'commit', '--quiet', '-am', 'The subject', '-m', 'And a body line.');
    const head = gitOut(dir, 'rev-parse', 'HEAD').trim();
    await boot(page);
    const shown = await showAdded(page, dir);
    const row = shown.locator(`[data-group="graph"] [data-commit="${head}"]`);
    const clipboard = (): Promise<string> => page.evaluate(() => navigator.clipboard.readText());

    const copy = async (label: string): Promise<void> => {
        await row.hover();
        await row.getByRole('button', { name: t('repositories.commit_menu'), exact: true }).click();
        await page.getByRole('menuitem', { name: label, exact: true }).click();
    };
    await copy(t('repositories.copy_id'));
    await expect.poll(clipboard).toBe(head);
    await copy(t('repositories.copy_message'));
    await expect.poll(clipboard).toBe('The subject\n\nAnd a body line.');
});
