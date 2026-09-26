// The diff pane in Chrome, over a repository of the case's own under the system temporary
// directory: a hunk staged from the side-by-side diff, the move between changes by Alt+F5 and by
// the bar's buttons, one line of a staged hunk unstaged, a block and chosen lines reverted after a
// confirm, the inline layout, Open File, a late answer of an older read dropped, the chosen lines
// dropped when a read moves them, a long line kept in the pane, and a mark in a source tab's
// gutter opening the diff at that change. Each write is read back from the repository with git,
// since what the pane draws after it is only the pane's account of it.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitIn, gitOut } from '../helpers/git.ts';
import { boot } from '../helpers/rail.ts';
import { keepServedFiles } from '../helpers/files.ts';
import { t } from '../helpers/words.ts';
import { sweepScratch } from '../../fixtures/scratch.ts';
import { diffFrame, diffPane, openSource, repository, showAdded } from './scm.ts';

keepServedFiles();

test.afterAll(sweepScratch);

/** Twenty numbered lines, the file every case here changes. */
const TWENTY = Array.from({ length: 20 }, (_, at) => `line ${at + 1}\n`).join('');

/** The twenty lines with some of them rewritten, by line number. */
function rewritten(lines: Record<number, string>): string {
    return Array.from({ length: 20 }, (_, at) => `${lines[at + 1] ?? `line ${at + 1}`}\n`).join('');
}

// revert: src/lib/views/sources/repositories/diff/Diff.svelte:226 => return;
test('stages a hunk from the side-by-side diff', async ({ page }) => {
    const dir = repository({ 'a.txt': TWENTY });
    writeFileSync(join(dir, 'a.txt'), rewritten({ 10: 'line ten' }));
    await boot(page);
    const shown = await showAdded(page, dir);

    await shown
        .locator('[data-group="changes"] [data-entry="a.txt"]')
        .getByRole('treeitem')
        .click();
    const pane = diffPane(page);
    const file = pane.locator('[data-diff-file="a.txt"]');
    await expect(file).toHaveAttribute('data-mode', 'side');
    // The removed line and the line that replaced it share one row, each on its own side.
    const pair = file.locator('.pair').filter({ hasText: 'line ten' });
    await expect(pair).toContainText('line 10');
    // Seven unchanged lines lead to the change, so all but the three beside it are folded.
    await expect(
        file.getByRole('button', { name: t('repositories.fold_open', 6), exact: true })
    ).toBeVisible();

    await file
        .locator('[data-hunk="0"]')
        .getByRole('button', { name: t('repositories.hunk_stage'), exact: true })
        .click();
    await expect.poll(() => gitOut(dir, 'diff', '--cached', '--name-only')).toBe('a.txt\n');
    expect(gitOut(dir, 'diff', '--name-only')).toBe('');
    expect(gitOut(dir, 'show', ':a.txt')).toBe(rewritten({ 10: 'line ten' }));
    // The worktree diff is empty now, which the pane reads again and says.
    await expect(pane).toContainText(t('repositories.diff_empty'));
});

// revert: src/lib/views/sources/repositories/diff/DiffFile.svelte:273 => min-width: max-content;
// revert: src/lib/views/sources/repositories/diff/DiffFile.svelte:277 => white-space: pre;
test('keeps both sides of a long line in the pane, the line wrapped in its own column', async ({
    page
}) => {
    const long = Array.from({ length: 60 }, (_, at) => `word${at}`).join(' ');
    const dir = repository({ 'a.txt': TWENTY });
    writeFileSync(join(dir, 'a.txt'), rewritten({ 10: long }));
    await boot(page);
    const shown = await showAdded(page, dir);
    await shown
        .locator('[data-group="changes"] [data-entry="a.txt"]')
        .getByRole('treeitem')
        .click();
    const pane = diffPane(page);
    const file = pane.locator('[data-diff-file="a.txt"]');
    await expect(file).toHaveAttribute('data-mode', 'side');
    const pair = file.locator('.pair').filter({ hasText: 'word59' });
    await expect(pair).toContainText('line 10');
    const fits = await file.evaluate((section) => {
        const holder = section.parentElement?.getBoundingClientRect();
        const cells = [...section.querySelectorAll('.pair')]
            .filter((row) => row.textContent.includes('word59'))
            .flatMap((row) => [...row.querySelectorAll('.cell')])
            .map((cell) => cell.getBoundingClientRect());
        return {
            within: holder !== undefined && cells.every((one) => one.right <= holder.right + 1),
            wrapped: cells.some((one) => one.height > 40)
        };
    });
    expect(fits).toEqual({ within: true, wrapped: true });
});

// revert: src/lib/views/sources/repositories/diff/Diff.svelte:205 => return;
test('moves to the next change by Alt+F5 and back by Shift+Alt+F5', async ({ page }) => {
    // revert: src/lib/views/sources/repositories/diff/Diff.svelte:207 => go(stepChange(at, changes.length, 1));
    const dir = repository({ 'a.txt': TWENTY });
    // Three changes seven unchanged lines apart, so each is a hunk of its own.
    writeFileSync(join(dir, 'a.txt'), rewritten({ 2: 'line two', 10: 'line ten', 18: 'line 18!' }));
    await boot(page);
    const shown = await showAdded(page, dir);

    await shown
        .locator('[data-group="changes"] [data-entry="a.txt"]')
        .getByRole('treeitem')
        .click();
    const file = diffPane(page).locator('[data-diff-file="a.txt"]');
    await expect(file.locator('.bar')).toHaveCount(3);
    // revert: src/lib/views/sources/repositories/diff/Diff.svelte:185 => const shownAt = $derived(changes.at(at));
    const current = file.locator('.bar.current');
    // No change is the current one until the keys move to one.
    await expect(current).toHaveCount(0);

    await diffPane(page).getByRole('region').focus();
    await page.keyboard.press('Alt+F5');
    await expect(current).toHaveAttribute('data-hunk', '0');
    await page.keyboard.press('Alt+F5');
    await expect(current).toHaveAttribute('data-hunk', '1');
    await page.keyboard.press('Shift+Alt+F5');
    await expect(current).toHaveAttribute('data-hunk', '0');
});

// revert: src/lib/views/sources/repositories/diff/DiffFile.svelte:161 => onclick={() => onhunk(hunk, 'unstage', null)}
test('unstages the chosen lines of a staged hunk and keeps the rest staged', async ({ page }) => {
    const dir = repository({ 'a.txt': TWENTY });
    writeFileSync(join(dir, 'a.txt'), rewritten({ 5: 'line five', 6: 'line six' }));
    gitIn(dir, 'add', 'a.txt');
    await boot(page);
    const shown = await showAdded(page, dir);

    await shown
        .locator('[data-group="changes"] [data-entry="a.txt"]')
        .getByRole('treeitem')
        .click();
    const file = diffPane(page).locator('[data-diff-file="a.txt"]');
    // Git writes the two removed lines, then the two added: rows 4 and 5 go, rows 6 and 7 come.
    // Choosing the removed line 5 and the line five that replaced it unstages that change alone.
    await file.locator('[data-choose="4"]').click();
    await file.locator('[data-choose="6"]').click();
    await file
        .locator('[data-hunk="0"]')
        .getByRole('button', { name: t('repositories.lines_unstage', 2), exact: true })
        .click();

    await expect.poll(() => gitOut(dir, 'show', ':a.txt')).toBe(rewritten({ 6: 'line six' }));
    // The worktree keeps both changes: an unstage never touches the file.
    expect(gitOut(dir, 'diff', '--name-only')).toBe('a.txt\n');
});

// revert: src/lib/views/sources/source/Gutter.svelte:96 => onclick={() => undefined}
test("a mark in a source tab's gutter opens the diff at that change", async ({ page }) => {
    const dir = repository({ 'a.txt': TWENTY });
    writeFileSync(join(dir, 'a.txt'), rewritten({ 3: 'line three' }));
    await boot(page);
    await showAdded(page, dir);
    const editor = await openSource(page, dir, 'a.txt');

    const mark = editor.locator('[data-mark-line="3"]');
    await expect(mark).toHaveAttribute('data-mark', 'modified', { timeout: 15_000 });
    // Only the changed line carries a mark.
    await expect(editor.locator('[data-mark]')).toHaveCount(1);
    await mark.click();
    const file = diffPane(page).locator('[data-diff-file="a.txt"]');
    await expect(file.locator('.pair').filter({ hasText: 'line three' })).toContainText('line 3');
});

/** Open the worktree diff of a.txt from its Changes row, answering the file's part of the pane. */
async function openDiff(page: Page, dir: string): Promise<Locator> {
    const shown = await showAdded(page, dir);
    await shown
        .locator('[data-group="changes"] [data-entry="a.txt"]')
        .getByRole('treeitem')
        .click();
    const file = diffPane(page).locator('[data-diff-file="a.txt"]');
    await expect(file).toBeVisible();
    return file;
}

/** Press OK on the confirm dialog on screen, once it says `question`. */
async function confirmed(page: Page, question: string): Promise<void> {
    await expect(page.getByText(question)).toBeVisible();
    await page.getByRole('button', { name: t('ui.confirm_ok'), exact: true }).click();
}

// revert: src/lib/views/sources/repositories/diff/Diff.svelte:234 => act: () => undefined
test('reverts one block in the worktree after a confirm, and leaves the other', async ({
    page
}) => {
    const dir = repository({ 'a.txt': TWENTY });
    writeFileSync(join(dir, 'a.txt'), rewritten({ 2: 'line two', 18: 'line 18!' }));
    await boot(page);
    const file = await openDiff(page, dir);

    await file
        .locator('[data-hunk="0"]')
        .getByRole('button', { name: t('repositories.hunk_revert'), exact: true })
        .click();
    await confirmed(page, t('repositories.hunk_revert_confirm', 'a.txt'));
    await expect
        .poll(() => readFileSync(join(dir, 'a.txt'), 'utf8'))
        .toBe(rewritten({ 18: 'line 18!' }));
    // A revert touches the worktree alone.
    expect(gitOut(dir, 'diff', '--cached', '--name-only')).toBe('');
});

// revert: src/lib/views/sources/repositories/diff/DiffFile.svelte:178 => onclick={() => onhunk(hunk, 'revert', null)}
test('reverts the chosen lines of a block after a confirm, and keeps the rest', async ({
    page
}) => {
    const dir = repository({ 'a.txt': TWENTY });
    writeFileSync(join(dir, 'a.txt'), rewritten({ 5: 'line five', 6: 'line six' }));
    await boot(page);
    const file = await openDiff(page, dir);

    // Rows 4 and 5 are the two lines git removed, rows 6 and 7 the two it added.
    await file.locator('[data-choose="4"]').click();
    await file.locator('[data-choose="6"]').click();
    await file
        .locator('[data-hunk="0"]')
        .getByRole('button', { name: t('repositories.lines_revert', 2), exact: true })
        .click();
    await confirmed(page, t('repositories.lines_revert_confirm', 2, 'a.txt'));
    await expect
        .poll(() => readFileSync(join(dir, 'a.txt'), 'utf8'))
        .toBe(rewritten({ 6: 'line six' }));
});

// revert: src/lib/views/sources/repositories/diff/Diff.svelte:268 => onclick={() => setMode('side')}
test('lays the diff out inline by the toggle, one row per line with both numbers', async ({
    page
}) => {
    const dir = repository({ 'a.txt': TWENTY });
    writeFileSync(join(dir, 'a.txt'), rewritten({ 10: 'line ten' }));
    await boot(page);
    const file = await openDiff(page, dir);
    await expect(file).toHaveAttribute('data-mode', 'side');

    await diffFrame(page)
        .getByRole('button', { name: t('repositories.diff_inline'), exact: true })
        .click();
    await expect(file).toHaveAttribute('data-mode', 'inline');
    await expect(
        diffFrame(page).getByRole('button', { name: t('repositories.diff_inline'), exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
    // The removed line and the line that replaced it are two rows, one under the other.
    await expect(file.locator('.line').filter({ hasText: 'line 10' })).toHaveCount(1);
    await expect(file.locator('.line').filter({ hasText: 'line ten' })).toHaveCount(1);
});

// revert: src/lib/views/sources/repositories/diff/Diff.svelte:243 => const change = changes.at(at);
test('opens the file at its top by Open File while no change is current', async ({ page }) => {
    const dir = repository({ 'a.txt': TWENTY });
    writeFileSync(join(dir, 'a.txt'), rewritten({ 18: 'line 18!' }));
    await boot(page);
    const file = await openDiff(page, dir);
    await expect(file.locator('.bar')).toHaveCount(1);

    await diffFrame(page)
        .getByRole('button', { name: t('repositories.open_file'), exact: true })
        .click();
    const editor = page.locator('[data-source-editor="a.txt"]');
    await expect(editor).toBeVisible();
    await expect(editor.getByRole('textbox')).not.toHaveValue('');
    // No change was current, so the tab opens at the top rather than at the change's line.
    await expect(editor).not.toHaveAttribute('data-source-line', /.*/);
});

// revert: src/lib/views/sources/repositories/diff/Diff.svelte:246 => return 0;
test('opens the file at the current change by Open File', async ({ page }) => {
    const dir = repository({ 'a.txt': TWENTY });
    writeFileSync(join(dir, 'a.txt'), rewritten({ 18: 'line 18!' }));
    await boot(page);
    const file = await openDiff(page, dir);

    await diffFrame(page)
        .getByRole('button', { name: t('repositories.change_next'), exact: true })
        .click();
    await expect(file.locator('.bar.current')).toHaveAttribute('data-hunk', '0');
    await diffFrame(page)
        .getByRole('button', { name: t('repositories.open_file'), exact: true })
        .click();
    await expect(page.locator('[data-source-editor="a.txt"]')).toHaveAttribute(
        'data-source-line',
        '18'
    );
});

// revert: src/lib/views/sources/repositories/diff/Diff.svelte:276 => onclick={() => go(at - 1)}
test('goes to the last change by Previous Change and the first by Next while none is current', async ({
    page
}) => {
    const dir = repository({ 'a.txt': TWENTY });
    writeFileSync(join(dir, 'a.txt'), rewritten({ 2: 'line two', 10: 'line ten', 18: 'line 18!' }));
    await boot(page);
    const file = await openDiff(page, dir);
    await expect(file.locator('.bar')).toHaveCount(3);
    const current = file.locator('.bar.current');
    const button = (key: string): Locator =>
        diffFrame(page).getByRole('button', { name: t(key), exact: true });

    await button('repositories.change_prev').click();
    await expect(current).toHaveAttribute('data-hunk', '2');
    await button('repositories.change_next').click();
    await expect(current).toHaveAttribute('data-hunk', '0');
});

// revert: src/lib/views/sources/repositories/diff/Diff.svelte:128 => delete
test('drops the answer of an older read that lands after a newer one', async ({ page }) => {
    const dir = repository({ 'a.txt': TWENTY });
    writeFileSync(join(dir, 'a.txt'), rewritten({ 10: 'line ten' }));
    let reads = 0;
    let landed: () => void = () => undefined;
    const late = new Promise<void>((done) => (landed = done));
    await page.route(
        (url) => url.pathname === '/api/git' && url.searchParams.has('diff'),
        async (route) => {
            reads += 1;
            if (reads !== 1) {
                await route.continue();
                return;
            }
            // The first read's answer is taken now, and handed over only after the second's.
            const response = await route.fetch();
            await expect.poll(() => reads, { timeout: 15_000 }).toBeGreaterThan(1);
            await new Promise((wait) => setTimeout(wait, 1_000));
            await route.fulfill({ response });
            landed();
        }
    );
    await boot(page);
    const shown = await showAdded(page, dir);
    await shown
        .locator('[data-group="changes"] [data-entry="a.txt"]')
        .getByRole('treeitem')
        .click();
    // The file changes while the first read is held, and the channel's new state reads it again.
    // A second changed line moves the counts, which is what gives the channel a new state.
    await expect.poll(() => reads).toBe(1);
    writeFileSync(join(dir, 'a.txt'), rewritten({ 10: 'line TEN again', 11: 'line eleven' }));
    const pane = diffPane(page);
    await expect(pane).toContainText('line TEN again', { timeout: 15_000 });
    await late;
    await new Promise((wait) => setTimeout(wait, 500));
    await expect(pane).toContainText('line TEN again');
    // The older answer held the text the file no longer has, and the pane never drew it.
    await expect(pane).not.toContainText('line ten');
});

// revert: src/lib/views/sources/repositories/diff/Diff.svelte:141 => delete
test('drops the chosen lines when a read moves the lines, so no other line is staged', async ({
    page
}) => {
    const dir = repository({ 'a.txt': TWENTY });
    writeFileSync(join(dir, 'a.txt'), rewritten({ 5: 'line five', 6: 'line six' }));
    await boot(page);
    const file = await openDiff(page, dir);
    await file.locator('[data-choose="4"]').click();
    await file.locator('[data-choose="6"]').click();
    const hunk = file.locator('[data-hunk="0"]');
    await expect(
        hunk.getByRole('button', { name: t('repositories.lines_stage', 2), exact: true })
    ).toBeVisible();

    // Three lines in front of the file move every row the choice named.
    writeFileSync(
        join(dir, 'a.txt'),
        `new a\nnew b\nnew c\n${rewritten({ 5: 'line five', 6: 'line six' })}`
    );
    await expect(diffPane(page)).toContainText('new c', { timeout: 15_000 });
    const lines = file.getByRole('button', {
        name: t('repositories.lines_stage', 2),
        exact: true
    });
    // The choice named rows of the old text, and a Stage of them would take other lines.
    await expect(file.locator('[data-choose][aria-pressed="true"]')).toHaveCount(0);
    // With no line chosen, the block's button stages the block, not chosen lines.
    await expect(lines).toHaveCount(0);
    await file
        .locator('[data-hunk="0"]')
        .getByRole('button', { name: t('repositories.hunk_stage'), exact: true })
        .click();
    // The whole block is staged, which the reader asked for once the choice was gone.
    await expect
        .poll(() => gitOut(dir, 'show', ':a.txt'))
        .toBe(`new a\nnew b\nnew c\n${rewritten({ 5: 'line five', 6: 'line six' })}`);
});
