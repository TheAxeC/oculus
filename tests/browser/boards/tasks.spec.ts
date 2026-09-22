// The update tray in Chrome: what a press of a task control reaches with `tasks.skip_permissions`
// off, which is what the checked-in config/behavior.yml holds, and what it asks first with it on.
//
// What this file does NOT run is `claude`. The browser layer puts its own `tmux` on PATH ahead of
// the machine's and that one fails on purpose (tests/browser/helpers/serve.ts), so no spec starts a
// process on the machine; a press here therefore ends at the tray's own refusal line, which is
// still the whole path from the control through /api/terminal and back. The argv the task is given
// and the flag the setting puts back are asserted in tests/routes/sessions/terminal.test.ts, and
// what the tray draws while the setting is on in tests/shell/keys/palette.test.ts.
//
// The last case is the one that turns the setting on. It writes the served copy's behavior.yml, the
// engine directory this run made, and puts the file back in a `finally`; the checkout's own file is
// never touched. The layer runs one worker with `fullyParallel: false` (playwright.config.ts), so no
// other spec is reading that copy while the case holds it.

import { expect, test, type Page, type Locator } from '@playwright/test';
import { readEngineFile, writeEngineFile } from '../helpers/hub.ts';
import { boot } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';

/** The engine file the setting lives in, relative to the engine directory this run serves. */
const BEHAVIOR = 'config/behavior.yml';

/** Open the tray from the rail's own control and hand back the dialog. */
async function openTray(page: Page): Promise<Locator> {
    await boot(page);
    await page.locator('[data-action="update"]').getByRole('button').click();
    const tray = page.getByRole('dialog', { name: t('app.tasks.update_tasks') });
    await expect(tray).toBeVisible();
    return tray;
}

test('the tray draws the four tasks and marks none of them as confirming', async ({ page }) => {
    const tray = await openTray(page);

    for (const kind of ['litwatch', 'scout', 'linkedin', 'inbox']) {
        await expect(tray.locator(`[data-task="${kind}"]`)).toHaveCount(1);
    }
    // no task has been pressed, and the mark is drawn on the one waiting for an answer
    await expect(tray.locator('[data-confirms]')).toHaveCount(0);
});

test('a task control reaches the endpoint with no confirmation in front of it', async ({
    page
}) => {
    const tray = await openTray(page);
    const call = page.waitForResponse(
        (response) =>
            new URL(response.url()).pathname === '/api/terminal' &&
            response.request().method() === 'POST'
    );
    await tray.getByRole('button', { name: t('app.tasks.lit_label'), exact: true }).click();

    // The press goes straight to the endpoint: no dialog stands between the control and the call.
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    expect(JSON.parse((await call).request().postData() ?? '{}')).toMatchObject({
        action: 'task',
        kind: 'litwatch'
    });

    // This layer has no tmux, so what comes back is the refusal rather than a running terminal.
    console.log('tasks.spec: this layer starts no process, so the task itself is not run here');
    await expect(tray).toContainText(t('editor.failed', '').trim());
    // this layer starts no process, so no terminal tab is opened by the refusal
    await expect(page.getByRole('tab', { name: t('sessions.view_terminal') })).toHaveCount(0);
});

test('with the setting on a press asks first, and the confirmation starts the task', async ({
    page
}) => {
    const held = readEngineFile(BEHAVIOR);
    const turned = held.replace('skip_permissions: false', 'skip_permissions: true');
    expect(turned).not.toBe(held);
    try {
        writeEngineFile(BEHAVIOR, turned);
        const calls: string[] = [];
        page.on('request', (request) => {
            if (
                new URL(request.url()).pathname === '/api/terminal' &&
                request.method() === 'POST'
            ) {
                calls.push(request.postData() ?? '');
            }
        });

        const tray = await openTray(page);
        // The configuration is watched, so the page is told; the wait is for the push to land.
        await expect(tray.locator('[data-confirms]')).toHaveCount(4);

        const control = tray.getByRole('button', { name: t('app.tasks.lit_label'), exact: true });
        await control.click();
        const asked = page.getByRole('alertdialog');
        await expect(asked).toBeVisible();
        await expect(asked).toContainText(t('app.tasks.skip_confirm', t('app.tasks.lit_label')));
        expect(calls).toEqual([]);

        // Escape is the dialog's, not the tray's: the question goes and the tray stays.
        await page.keyboard.press('Escape');
        // Escape closes the question
        await expect(asked).toHaveCount(0);
        await expect(tray).toBeVisible();
        expect(calls).toEqual([]);

        // The next Escape is the tray's again.
        await page.keyboard.press('Escape');
        // the next Escape closes the tray
        await expect(tray).toHaveCount(0);

        const reopened = await openTray(page);
        await reopened.getByRole('button', { name: t('app.tasks.lit_label'), exact: true }).click();
        await page
            .getByRole('button', { name: t('app.tasks.skip_confirm_ok'), exact: true })
            .click();
        // the yes closes the question
        await expect(page.getByRole('alertdialog')).toHaveCount(0);

        // This layer has no tmux, so the task ends at the refusal line, as the case above does.
        await expect(reopened).toContainText(t('editor.failed', '').trim());
        expect(calls.map((body) => JSON.parse(body) as unknown)).toMatchObject([
            { action: 'task', kind: 'litwatch' }
        ]);
    } finally {
        writeEngineFile(BEHAVIOR, held);
    }
});
