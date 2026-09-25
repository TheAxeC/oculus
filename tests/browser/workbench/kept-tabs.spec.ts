// Layer 4, browser test. A pane keeps the view of every tab it has shown mounted and hidden while
// another tab is shown (shell/panes/TabView.svelte): switching back finds the same view, built
// once, with nothing read again; closing a tab lets its view go; a hidden view takes no key,
// neither the search key the pane sends to the view it shows nor an Escape meant for another tab;
// and a confirm left open in a hidden tab takes the keyboard again when its tab shows.
//
// What this does NOT cover: the memory the kept views hold, which is measured by hand and stated in
// the step's report rather than held to a number here.

import { expect, test, type Page } from '@playwright/test';
import { keepServedFiles, nestedRoot, row } from '../helpers/files.ts';
import { SHOWN_VIEW, boot, openView } from '../helpers/rail.ts';
import { t, tabNamed } from '../helpers/words.ts';

keepServedFiles();

/** Open the hub's README.md from the file browser as a tab that stays. */
async function openReadme(page: Page): Promise<void> {
    await openView(page, 'files', t('views.files'));
    await row(page, 'hub').click();
    await row(page, 'hub', 'README.md').dblclick();
    await expect(page.locator('[data-source-editor="README.md"]')).toBeVisible();
}

// revert: src/lib/shell/panes/PaneView.svelte:127 => const kept = $derived(instances.filter((one) => one.id === active));
test('a tab switched away from and back keeps its view, built once, and reads its file once', async ({
    page
}) => {
    const reads: string[] = [];
    page.on('request', (request) => {
        if (request.url().includes('/api/file/hub/README.md')) reads.push(request.url());
    });
    await boot(page);
    await openReadme(page);
    const editor = page.locator('[data-source-editor="README.md"]');
    await expect.poll(() => reads.length).toBeGreaterThan(0);
    const before = reads.length;
    await editor.evaluate((element) => {
        (element as HTMLElement).dataset.keptMark = 'first';
    });

    await page.getByRole('tab', { name: tabNamed(t('views.files')) }).click();
    // the view is kept mounted while its tab is not shown, drawn nowhere on the screen
    await expect(editor).toBeHidden();
    await expect(editor).toHaveCount(1);
    await page.getByRole('tab', { name: tabNamed('README.md') }).click();

    await expect(editor).toBeVisible();
    await expect(editor).toHaveAttribute('data-kept-mark', 'first');
    expect(reads).toHaveLength(before);
});

// revert: src/lib/shell/panes/PaneView.svelte:127 => const kept = $derived(instances);
test('a tab never shown mounts no view, and a closed tab takes its view with it', async ({
    page
}) => {
    await boot(page);
    await openReadme(page);
    // After a reload the pane shows the README tab alone: its other tabs are open and never shown.
    await page.reload();
    const editor = page.locator('[data-source-editor="README.md"]');
    await expect(editor).toBeVisible();
    const pane = page.locator('[data-pane]').filter({ has: editor });
    expect(await pane.getByRole('tab').count()).toBeGreaterThan(1);
    await expect(pane.locator('[data-tab-view]')).toHaveCount(1);

    const id = await editor.evaluate(
        (element) => element.closest<HTMLElement>('[data-tab-view]')?.dataset.tabView ?? ''
    );
    expect(id).not.toBe('');
    const readme = page.getByRole('tab', { name: tabNamed('README.md') });
    await readme.focus();
    await page.keyboard.press('Delete');
    // Delete on a tab closes it, and the README tab held no unsaved text to ask about
    await expect(readme).toHaveCount(0);
    // its tab is closed, so the view it kept is gone from the page as well
    await expect(page.locator(`[data-tab-view="${id}"]`)).toHaveCount(0);
});

// revert: src/lib/shell/keys/key-dom.ts:20 => const search = pane?.querySelector<HTMLInputElement>('input[data-search]');
test('the search key reaches the search of the view the pane shows, not a hidden one', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    await openView(page, 'history', t('views.history'));
    const shown = page.locator(`${SHOWN_VIEW} input[data-search]`);
    await expect(shown).toHaveCount(1);
    await page.getByRole('tab', { name: tabNamed(t('views.history')) }).click();
    await page.keyboard.press('/');
    await expect(shown).toBeFocused();
});

// revert: src/lib/views/boards/focus/QuickAdd.svelte:56 => if (event.key === 'Escape' && field !== null) close();
test('Escape pressed while another tab is shown leaves a hidden Quick add form open', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'focus', t('views.focus'));
    await page.getByRole('button', { name: t('focus.add_followup'), exact: true }).click();
    const form = page.locator('.qa .form');
    await expect(form).toBeVisible();

    // The Status tab of the same pane is pressed, so the switch is one press on a tab and nothing
    // else reaches the form while it is still on screen.
    await page.getByRole('tab', { name: tabNamed(t('views.status')) }).click();
    await expect(form).toBeHidden();
    await expect(form).toHaveCount(1);
    await page.keyboard.press('Escape');
    await page.getByRole('tab', { name: tabNamed(t('views.focus')) }).click();
    await expect(form).toBeVisible();
    await page.keyboard.press('Escape');
    // on screen, Escape closes the form as it always did
    await expect(form).toHaveCount(0);
});

// revert: src/lib/views/shared/forms/NewIdeaForm.svelte:36 => if (event.key === 'Escape') onclose();
test('Escape pressed while another tab is shown leaves a hidden new-idea form open', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    await page.getByRole('button', { name: t('board.new_idea') }).click();
    const field = page.getByRole('textbox', { name: t('board.new_idea_id') });
    await expect(field).toBeVisible();

    await page.getByRole('tab', { name: tabNamed(t('views.status')) }).click();
    await expect(field).toBeHidden();
    await expect(
        page.getByRole('textbox', { name: t('board.new_idea_id'), includeHidden: true })
    ).toHaveCount(1);
    await page.keyboard.press('Escape');
    await page.getByRole('tab', { name: tabNamed(t('views.projects')) }).click();
    await expect(field).toBeVisible();
});

// revert: src/lib/shell/keys/workbench-keys.svelte.ts:244 => (one) => one !== null
test('a confirm left open in a hidden tab holds no key: Ctrl and a bracket still cycle the tabs', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    const line = page.locator(`[data-fs-row="${key}:"]`);
    const remove = line.getByRole('button', { name: t('files.remove_root'), exact: true });
    await line.hover();
    await remove.click();
    const confirm = page.getByRole('alertdialog', { name: t('files.remove_root_confirm', key) });
    await expect(confirm).toBeVisible();

    // Ctrl and a digit switch tabs ahead of any confirm, so the Files tab and its confirm are
    // hidden
    await page.keyboard.press('Control+1');
    const status = page.getByRole('tab', { name: tabNamed(t('views.status')) });
    await expect(status).toHaveAttribute('aria-selected', 'true');
    await expect(confirm).toBeHidden();

    await page.keyboard.press('Control+]');
    await expect(status).toHaveAttribute('aria-selected', 'false');
});

// revert: src/lib/ui/controls/Confirm.svelte:48 => delete
test('a confirm left open in a hidden tab takes the keyboard again when its tab shows', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'files', t('views.files'));
    const { key } = await nestedRoot(page);
    const line = page.locator(`[data-fs-row="${key}:"]`);
    await line.hover();
    await line.getByRole('button', { name: t('files.remove_root'), exact: true }).click();
    const confirm = page.getByRole('alertdialog', { name: t('files.remove_root_confirm', key) });
    await expect(confirm).toBeVisible();

    await page.keyboard.press('Control+1');
    await expect(confirm).toBeHidden();
    await page.getByRole('tab', { name: tabNamed(t('views.files')) }).click();
    await expect(confirm).toBeVisible();
    await expect(confirm.locator('button.yes')).toBeFocused();

    await page.keyboard.press('Escape');
    // Escape cancels the dialog, and the dialog is drawn only while it has something to ask.
    await expect(confirm).toHaveCount(0);
});
