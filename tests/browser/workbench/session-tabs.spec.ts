// Layer 4, browser test. A terminal and a transcript per tab: the Terminal tab's `new terminal`
// control opens another Terminal tab showing the start form, and the session list's Transcript
// item opens the Transcript of that session in a tab of its own, so two sessions read are two tabs.
//
// Two sessions reach the page as transcripts this spec writes into the served run's own session
// store, under the home directory tests/browser/helpers/serve.ts makes; every path is asserted to
// be inside the temporary directory before it is written, and the transcripts go when the case
// ends. What this does NOT cover: a terminal started from the form, since the served run's tmux
// starts nothing; the node suite presses Start over a stubbed answer instead.

import { expect, test } from '@playwright/test';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { hubDir, servedHomeDir, writeTranscript } from '../helpers/hub.ts';
import { SHOWN_VIEW, boot, openView } from '../helpers/rail.ts';
import { t, tabNamed } from '../helpers/words.ts';

/** A path is written to only after this says it is inside the temporary directory. */
function inside(path: string): string {
    expect(resolve(path).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return path;
}

/** Where this spec's transcripts go, in the served run's session store. */
function store(): string {
    return inside(join(servedHomeDir(), '.claude', 'projects', 'oculus-session-tabs-spec'));
}

/**
 * A transcript of one ended session named `title`, working in `cwd`: the temporary directory unless
 * a case names a folder of the hub.
 */
function session(title: string, cwd = tmpdir()): void {
    writeTranscript(store(), title, cwd, { asked: `Read ${title}.`, answered: 'Read.' });
}

test.afterEach(() => {
    if (!existsSync(store())) return;
    for (const name of readdirSync(store())) {
        rmSync(inside(join(store(), name)), { recursive: true, force: true });
    }
});

// revert: src/lib/views/sessions/session-list/SessionList.svelte:102 => openView('transcript');
test('the Transcript item of two sessions opens two Transcript tabs, one per session', async ({
    page
}) => {
    const titles = ['Session tabs spec one', 'Session tabs spec two'];
    for (const title of titles) session(title);
    await boot(page);
    await openView(page, 'session-list', t('sessions.rail_title'));
    // The sessions are not running, so the list keeps them behind the ended head.
    const ended = page.locator('button.ended-h');
    await expect(ended).toHaveCount(1, { timeout: 15000 });
    if ((await ended.getAttribute('aria-expanded')) !== 'true') await ended.click();

    for (const title of titles) {
        await page.getByRole('tab', { name: tabNamed(t('sessions.rail_title')) }).click();
        const row = page.locator('.row').filter({ hasText: title }).first();
        await expect(row).toBeVisible({ timeout: 15000 });
        await row.getByRole('button', { name: t('ui.row_menu') }).click();
        await page.getByRole('menuitem', { name: t('sessions.transcript_open') }).click();
        await expect(page.getByRole('tab', { name: tabNamed(title) })).toBeVisible();
    }
    for (const title of titles) {
        await expect(page.getByRole('tab', { name: tabNamed(title) })).toHaveCount(1);
    }
});

// revert: src/lib/views/sessions/terminal/Terminal.svelte:234 => openView('terminal');
test('the new terminal control opens another Terminal tab showing the start form', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'terminal', t('sessions.view_terminal'));
    const terminals = page.getByRole('tab', { name: tabNamed(t('sessions.view_terminal')) });
    await expect(terminals).toHaveCount(1);

    await page.getByRole('button', { name: t('sessions.new_terminal'), exact: true }).click();
    await expect(terminals).toHaveCount(2);
    const shown = page.locator(SHOWN_VIEW);
    await expect(
        shown.getByRole('button', { name: t('sessions.start_terminal'), exact: true })
    ).toBeVisible();
    await expect(shown.getByText(t('sessions.no_terminal'))).toBeVisible();
});

// The served run's tmux starts nothing, so the start is answered here, as the endpoint answers a
// start that worked; the terminal named is one no pane holds, and what is checked is the tab.
// revert: src/lib/views/sessions/terminal/Terminal.svelte:224 => delete
test('a start from a new Terminal tab makes the terminal that tab its own, and leaves the other tab', async ({
    page
}) => {
    const started = 'a1b2c3-shell';
    await page.route('**/api/terminal', async (route) => {
        const body = JSON.parse(route.request().postData() ?? '{}') as { action?: string };
        if (body.action !== 'start') return route.continue();
        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, id: started })
        });
    });
    await boot(page);
    await openView(page, 'terminal', t('sessions.view_terminal'));
    await page.getByRole('button', { name: t('sessions.new_terminal'), exact: true }).click();
    const shown = page.locator(SHOWN_VIEW);
    await shown.getByRole('button', { name: t('sessions.start_terminal'), exact: true }).click();

    // the tab is named after the kind it started until the terminal's own name arrives
    await expect(page.getByRole('tab', { name: tabNamed(t('sessions.kind_shell')) })).toBeVisible();
    await expect(shown.locator(`[data-terminal="${started}"]`)).toHaveCount(1);
    await page.getByRole('tab', { name: tabNamed(t('sessions.view_terminal')) }).click();
    // the first tab started nothing of its own, and nothing it follows is selected
    await expect(shown.getByText(t('sessions.no_terminal'))).toBeVisible();
});

// revert: src/lib/views/sessions/session-detail/SessionDetail.svelte:182 => openView('transcript');
test("a session's detail tab opens that session's own Transcript tab", async ({ page }) => {
    const title = 'Session tabs spec detail';
    session(title);
    await boot(page);
    await openView(page, 'session-list', t('sessions.rail_title'));
    const ended = page.locator('button.ended-h');
    await expect(ended).toHaveCount(1, { timeout: 15000 });
    if ((await ended.getAttribute('aria-expanded')) !== 'true') await ended.click();
    const row = page.locator('.row').filter({ hasText: title }).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.getByRole('button', { name: t('ui.row_menu') }).click();
    await page.getByRole('menuitem', { name: t('sessions.open_pinned') }).click();
    const named = page.getByRole('tab', { name: tabNamed(title) });
    await expect(named).toHaveCount(1);

    await page.getByRole('button', { name: t('sessions.transcript_open'), exact: true }).click();
    // the detail tab and the Transcript tab both carry the session's own name
    await expect(named).toHaveCount(2);
});

// revert: src/lib/views/shared/card/CardSessions.svelte:59 => openBeside('session-detail');
test('a session pressed on a project card opens that session in a detail tab of its own', async ({
    page
}) => {
    const title = 'Session tabs spec card';
    session(title, join(hubDir(), 'projects', 'active', 'graph-bandits'));
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const pressed = page.locator('button.session').filter({ hasText: title }).first();
    await expect(pressed).toBeVisible({ timeout: 15000 });
    await pressed.click();
    await expect(page.getByRole('tab', { name: tabNamed(title) })).toBeVisible();
});
