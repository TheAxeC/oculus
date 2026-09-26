// Layer 4, browser test. A terminal and a transcript per tab: the Terminal tab's `new terminal`
// control opens another Terminal tab showing the composer, and the session list's Transcript item
// opens the Transcript of that session in a tab of its own, so two sessions read are two tabs.
//
// Two sessions reach the page as transcripts this spec writes into the served run's own session
// store, under the home directory tests/browser/helpers/serve.ts makes; every path is asserted to
// be inside the temporary directory before it is written, and the transcripts go when the case
// ends. A session view with nothing picked names the Sessions view as where one is picked and
// offers the control that opens it, and a Terminal tab over a session that runs in no terminal of
// oculus's says so above its composer. A start from the composer is answered here; what a start
// runs is tests/browser/sessions/composer.spec.ts's.

import { expect, test, type Locator, type Page } from '@playwright/test';
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

// revert: src/lib/views/sessions/session-list/SessionList.svelte:209 => openView('transcript');
test('the Transcript item of two sessions opens two Transcript tabs, one per session', async ({
    page
}) => {
    const titles = ['Session tabs spec one', 'Session tabs spec two'];
    for (const title of titles) session(title);
    await boot(page);
    await openView(page, 'session-list', t('sessions.rail_title'));

    for (const title of titles) {
        await page.getByRole('tab', { name: tabNamed(t('sessions.rail_title')) }).click();
        const row = page.locator('[data-session-row]').filter({ hasText: title }).first();
        await expect(row).toBeVisible({ timeout: 15000 });
        await row.getByRole('button', { name: t('ui.row_menu') }).click();
        await page.getByRole('menuitem', { name: t('sessions.transcript_open') }).click();
        await expect(page.getByRole('tab', { name: tabNamed(title) })).toBeVisible();
    }
    for (const title of titles) {
        await expect(page.getByRole('tab', { name: tabNamed(title) })).toHaveCount(1);
    }
});

// revert: src/lib/views/sessions/terminal/Terminal.svelte:214 => delete
test('the new terminal control opens another Terminal tab showing the composer', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'terminal', t('sessions.view_terminal'));
    const terminals = page.getByRole('tab', { name: tabNamed(t('sessions.view_terminal')) });
    await expect(terminals).toHaveCount(1);

    await page.getByRole('button', { name: t('sessions.new_terminal'), exact: true }).click();
    await expect(terminals).toHaveCount(2);
    const shown = page.locator(SHOWN_VIEW);
    await expect(shown.locator('[data-composer]')).toBeVisible();
    await expect(
        shown.getByRole('button', { name: t('composer.start'), exact: true })
    ).toBeVisible();
});

// The start is answered here, as the endpoint answers a start that worked; the terminal named is
// one no pane holds, and what is checked is the tab.
// revert: src/lib/views/sessions/terminal/Terminal.svelte:209 => delete
test('a start from a new Terminal tab makes the terminal that tab its own, and leaves the other tab', async ({
    page
}) => {
    const started = 'a1b2c3-shell';
    await page.route('**/api/terminal', async (route) => {
        const body = JSON.parse(route.request().postData() ?? '{}') as { action?: string };
        if (body.action !== 'compose') return route.continue();
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
    await shown.getByRole('button', { name: t('composer.start'), exact: true }).click();

    // the tab is named after the agent it started until the terminal's own name arrives
    await expect(
        page.getByRole('tab', { name: tabNamed(t('sessions.kind_claude')) })
    ).toBeVisible();
    await expect(shown.locator(`[data-terminal="${started}"]`)).toHaveCount(1);
    await page.getByRole('tab', { name: tabNamed(t('sessions.view_terminal')) }).click();
    // the first tab started nothing of its own, and nothing it follows is selected
    await expect(shown.locator('[data-composer]')).toBeVisible();
});

/** The Sessions view's tab, which the rail no longer lists and the pick control opens. */
function sessionsTab(page: Page): Locator {
    return page.getByRole('tab', { name: tabNamed(t('sessions.rail_title')) });
}

test('a session view with no session picked names the Sessions view and opens it', async ({
    page
}) => {
    // revert: src/lib/views/shared/sessions/PickSession.svelte:31 => onclick={() => undefined}
    // revert: config/text/views/sessions/session-list.yml:13 => detail_empty: Pick a session in the rail.
    await boot(page);
    await openView(page, 'agents', t('sessions.view_agents'));
    const shown = page.locator(SHOWN_VIEW);
    const words = shown.getByText(t('sessions.detail_empty'));
    await expect(words).toBeVisible();
    expect(await words.textContent()).toContain(t('sessions.rail_title'));
    // boot() starts on a page holding the Status tab alone, so only the press opens the list.
    await expect(sessionsTab(page)).toHaveCount(0);
    await shown.getByRole('button', { name: t('sessions.open_sessions'), exact: true }).click();
    await expect(sessionsTab(page)).toHaveCount(1);
});

/** Open a session view with no session picked, and press the control its sentence offers. */
async function pickFrom(page: Page, view: string, label: string): Promise<void> {
    await boot(page);
    await openView(page, view, label);
    const shown = page.locator(SHOWN_VIEW);
    const words = shown.getByText(t('sessions.detail_empty'));
    await expect(words).toBeVisible();
    expect(await words.textContent()).toContain(t('sessions.rail_title'));
    await shown.getByRole('button', { name: t('sessions.open_sessions'), exact: true }).click();
    await expect(sessionsTab(page)).toHaveCount(1);
}

test('the Transcript view with no session picked offers the Sessions view', async ({ page }) => {
    // revert: src/lib/views/sessions/transcript/Transcript.svelte:154 => <Empty
    await pickFrom(page, 'transcript', t('sessions.view_transcript'));
});

test('the Changes view with no session picked offers the Sessions view', async ({ page }) => {
    // revert: src/lib/views/sessions/changes/Changes.svelte:181 => <p>{t('sessions.detail_empty')}</p>
    await pickFrom(page, 'changes', t('sessions.view_changes'));
});

test('the Timeline view with no session picked offers the Sessions view', async ({ page }) => {
    // revert: src/lib/views/sessions/timeline/Timeline.svelte:127 => <Empty message={t('sessions.detail_empty')} glyph={t('sessions.empty_glyph')} />
    await pickFrom(page, 'timeline', t('sessions.view_timeline'));
});

test('the Session view with no session picked offers the Sessions view', async ({ page }) => {
    // revert: src/lib/views/sessions/session-detail/SessionDetail.svelte:258 => <p>{t('sessions.detail_empty')}</p>
    await pickFrom(page, 'session-detail', t('sessions.detail_title'));
});

test('a Terminal tab over a session that runs in no terminal of oculus draws its steer box disabled, and New brings the composer', async ({
    page
}) => {
    // revert: src/lib/views/sessions/terminal/Terminal.svelte:364 => {#if false}
    const title = 'Session tabs spec elsewhere';
    session(title);
    await boot(page);
    await openView(page, 'session-list', t('sessions.rail_title'));
    const row = page.locator('[data-session-row]').filter({ hasText: title }).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.locator('button.row-button').click();
    await openView(page, 'terminal', t('sessions.view_terminal'));
    const shown = page.locator(SHOWN_VIEW);
    await expect(shown.locator('[data-runs-elsewhere]')).toHaveText(
        t('composer.selected_elsewhere', title)
    );
    const steer = shown.locator('[data-steer]');
    await expect(steer.locator('textarea')).toHaveAttribute('readonly', '');
    await expect(steer.locator('[data-steer-elsewhere]')).toHaveText(t('composer.elsewhere'));
    // the selected session is read here, so no composer is drawn until New asks for one
    await expect(shown.locator('[data-composer]')).toHaveCount(0);
    await page.getByRole('button', { name: t('sessions.new_terminal'), exact: true }).click();
    await expect(shown.locator('[data-composer]')).toBeVisible();
});

// revert: src/lib/views/sessions/session-detail/SessionDetail.svelte:183 => openView('transcript');
test("a session's detail tab opens that session's own Transcript tab", async ({ page }) => {
    const title = 'Session tabs spec detail';
    session(title);
    await boot(page);
    await openView(page, 'session-list', t('sessions.rail_title'));
    const row = page.locator('[data-session-row]').filter({ hasText: title }).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.getByRole('button', { name: t('ui.row_menu') }).click();
    await page.getByRole('menuitem', { name: t('sessions.open_pinned') }).click();
    const named = page.getByRole('tab', { name: tabNamed(title) });
    await expect(named).toHaveCount(1);

    await page.getByRole('button', { name: t('sessions.transcript_open'), exact: true }).click();
    // the detail tab and the Transcript tab both carry the session's own name
    await expect(named).toHaveCount(2);
});

// revert: src/lib/views/shared/card/CardSessions.svelte:60 => openBeside('session-detail');
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
