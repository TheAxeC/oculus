// Layer 4, browser test. The sessions list on the Sessions page: its filter menu and its search
// narrow the rows and are kept with the tab across a reload, and a row's menu renames it, pins it
// to the top of its workspace's group and archives it, each written through the session's own
// overrides and drawn at once.
//
// The sessions reach the page as transcripts this spec writes into the served run's session store,
// under the home directory tests/browser/helpers/serve.ts makes; every path is asserted to be
// inside the temporary directory before it is written, and the transcripts go when the case ends.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { hubDir, servedHomeDir, writeTranscript } from '../helpers/hub.ts';
import { boot, showRailPage } from '../helpers/rail.ts';
import { t, tabNamed } from '../helpers/words.ts';

/** A path is written to only after this says it is inside the temporary directory. */
function inside(path: string): string {
    expect(resolve(path).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return path;
}

/** Where this spec's transcripts go, in the served run's session store. */
function store(): string {
    return inside(join(servedHomeDir(), '.claude', 'projects', 'oculus-session-list-spec'));
}

test.afterEach(() => {
    if (!existsSync(store())) return;
    for (const name of readdirSync(store())) {
        rmSync(inside(join(store(), name)), { recursive: true, force: true });
    }
});

/** The row of the list drawing a session by its title. */
function row(page: Page, title: string): Locator {
    return page.locator('[data-session-row]').filter({ hasText: title });
}

/** The Sessions page with the list drawing both of this spec's sessions. */
async function listed(page: Page, titles: string[]): Promise<void> {
    await boot(page);
    await showRailPage(page, 'sessions');
    await expect(page.getByRole('tab', { name: tabNamed(t('sessions.rail_title')) })).toBeVisible();
    for (const title of titles) await expect(row(page, title)).toHaveCount(1, { timeout: 15000 });
}

/** Press one entry of a row's menu. */
async function rowMenu(page: Page, title: string, entry: string): Promise<void> {
    await row(page, title)
        .getByRole('button', { name: t('ui.row_menu') })
        .click();
    await page.getByRole('menuitem', { name: entry, exact: true }).click();
}

// revert: src/lib/state/sessions/folds.ts "const haystack = [row.title, row.lastPrompt, ...prompts, row.workspace, row.branch ?? ''];" => const haystack = [row.lastPrompt];
test('the search and the filter narrow the rows, and stay with the tab across a reload', async ({
    page
}) => {
    const hub = hubDir();
    writeTranscript(store(), 'List spec alpha', hub, { asked: 'Read alpha.', answered: 'Read.' });
    writeTranscript(store(), 'List spec beta', hub, { asked: 'Read beta.', answered: 'Read.' });
    await listed(page, ['List spec alpha', 'List spec beta']);

    const search = page.getByRole('searchbox', { name: t('sessions.search') });
    await search.fill('spec alpha');
    await expect(row(page, 'List spec alpha')).toHaveCount(1);
    // The other session holds the searched words nowhere, so the search leaves it out.
    await expect(row(page, 'List spec beta')).toHaveCount(0);
    await search.fill('');
    await expect(row(page, 'List spec beta')).toHaveCount(1);

    // The Codex agent alone keeps none of these Claude sessions.
    await page.getByRole('button', { name: t('sessions.filter'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('sessions.kind_codex'), exact: true }).click();
    // Both sessions are Claude's, and the Codex agent alone keeps neither.
    await expect(row(page, 'List spec alpha')).toHaveCount(0);
    await expect(page.getByText(t('sessions.filter_empty'))).toBeVisible();

    await page.reload();
    await expect(page.getByText(t('sessions.filter_empty'))).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: t('sessions.filter'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('sessions.kind_codex'), exact: true }).click();
    await expect(row(page, 'List spec alpha')).toHaveCount(1, { timeout: 15000 });
});

// revert: src/lib/views/sessions/session-list/SessionList.svelte "if (id === 'top') void mark(row, 'top', !top(row));" => if (id === 'top') void mark(row, 'hidden', !top(row));
test('a row is renamed, pinned to the top of its group and archived from its menu', async ({
    page
}) => {
    const hub = hubDir();
    writeTranscript(store(), 'List spec older', hub, { asked: 'Older.', answered: 'Read.' });
    writeTranscript(store(), 'List spec newer', hub, { asked: 'Newer.', answered: 'Read.' });
    await listed(page, ['List spec older', 'List spec newer']);

    await rowMenu(page, 'List spec older', t('sessions.rename'));
    const field = page.getByRole('textbox', { name: t('sessions.rename_field') });
    await expect(field).toBeFocused();
    await field.fill('List spec renamed');
    await field.press('Enter');
    await expect(row(page, 'List spec renamed')).toHaveCount(1, { timeout: 15000 });

    await rowMenu(page, 'List spec renamed', t('sessions.pin_top'));
    const pinned = row(page, 'List spec renamed');
    await expect(pinned.getByTitle(t('sessions.top_mark'))).toHaveCount(1);
    const group = page.locator('[data-session-group]').filter({ has: pinned });
    await expect(group.locator('[data-session-row]').first()).toContainText('List spec renamed');

    await rowMenu(page, 'List spec renamed', t('sessions.archive'));
    // Archived rows leave the list until the filter asks for them.
    await expect(row(page, 'List spec renamed')).toHaveCount(0, { timeout: 15000 });
    await page.getByRole('button', { name: t('sessions.filter'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('sessions.state_archived'), exact: true }).click();
    await expect(row(page, 'List spec renamed')).toHaveAttribute('data-state', 'archived');
    // The archived state alone keeps only what was archived.
    await expect(row(page, 'List spec newer')).toHaveCount(0);
});

// revert: src/lib/views/sessions/session-list/SessionList.svelte "failure = field === 'hidden' ? t('sessions.archive_failed') : t('sessions.top_failed');" => failure = field === 'hidden' ? t('sessions.top_failed') : t('sessions.top_failed');
test('an archive the server does not save puts the row back and says the archive failed', async ({
    page
}) => {
    writeTranscript(store(), 'List spec kept', hubDir(), { asked: 'Keep.', answered: 'Read.' });
    await listed(page, ['List spec kept']);
    // The write answers a refusal, so what the page does with a failed archive is what is seen.
    await page.route('**/api/write', async (route) => {
        const body = route.request().postDataJSON() as { kind?: string; hidden?: boolean };
        if (body.kind === 'session' && body.hidden === true) {
            await route.fulfill({ status: 500, json: { error: 'refused by the spec' } });
        } else await route.continue();
    });
    await rowMenu(page, 'List spec kept', t('sessions.archive'));
    await expect(page.getByText(t('sessions.archive_failed'), { exact: true })).toBeVisible();
    await expect(row(page, 'List spec kept')).toHaveCount(1);
    // the mark drawn at once is put back when the write fails
    await expect(row(page, 'List spec kept')).not.toHaveAttribute('data-state', 'archived');
});

// revert: src/lib/views/sessions/session-list/SessionList.svelte "const now = $derived(minuteNow());" => const now = Date.now();
test('a row ages while the page stays open, on the minute clock', async ({ page }) => {
    await page.clock.install({ time: new Date() });
    writeTranscript(store(), 'List spec aging', hubDir(), { asked: 'Age.', answered: 'Read.' });
    await listed(page, ['List spec aging']);
    await expect(row(page, 'List spec aging')).toContainText(t('sessions.ago_now'));
    await page.clock.fastForward('03:30');
    await expect(row(page, 'List spec aging')).toContainText(t('sessions.ago_m', 3));
});
