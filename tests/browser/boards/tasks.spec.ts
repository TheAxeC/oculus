// The update tray in Chrome: what a press of a task control reaches with `tasks.skip_permissions`
// off, which is what the checked-in config/behavior.yml holds, and what it asks first with it on.
//
// What this file does NOT run is `claude`. The browser layer's tmux is the machine's on a socket of
// the run's own, and the `claude` on its PATH is a stand-in that writes the arguments it was given
// and waits (tests/browser/helpers/serve.ts), so a press here starts a terminal running the
// stand-in, which is the whole path from the control through /api/terminal to the command. What
// the tray draws while the setting is on is asserted in tests/shell/keys/palette.test.ts.
//
// The last case is the one that turns the setting on. It writes the served copy's behavior.yml, the
// engine directory this run made, and puts the file back in a `finally`; the checkout's own file is
// never touched. The layer runs one worker with `fullyParallel: false` (playwright.config.ts), so
// no other spec is reading that copy while the case holds it.

import { expect, test, type Page, type Locator } from '@playwright/test';
import {
    endServedTerminals,
    readEngineFile,
    startedWith,
    writeEngineFile
} from '../helpers/hub.ts';
import { boot } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';

/** The engine file the setting lives in, relative to the engine directory this run serves. */
const BEHAVIOR = 'config/behavior.yml';

test.afterEach(endServedTerminals);

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

    // The task runs in a terminal of its own, which the page opens as the tray closes.
    // revert: src/lib/server/machine/pty/routes.ts "argv.push(`/research-cockpit ${kind}`);" => argv.push(`/research-cockpit`);
    await expect
        .poll(() => startedWith('claude'), { timeout: 15000 })
        .toEqual([['/research-cockpit litwatch']]);
    // a task that started closes the tray it was pressed in
    await expect(tray).toHaveCount(0);
    await expect(page.getByRole('tab', { name: t('sessions.view_terminal') })).toBeVisible();
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

        // The setting puts the flag back in front of the task's own words.
        // revert: src/lib/server/machine/pty/routes.ts "if (skip) argv.push('--dangerously-skip-permissions');" => delete
        await expect
            .poll(() => startedWith('claude'), { timeout: 15000 })
            .toEqual([['--dangerously-skip-permissions', '/research-cockpit litwatch']]);
        expect(calls.map((body) => JSON.parse(body) as unknown)).toMatchObject([
            { action: 'task', kind: 'litwatch' }
        ]);
    } finally {
        writeEngineFile(BEHAVIOR, held);
    }
});
