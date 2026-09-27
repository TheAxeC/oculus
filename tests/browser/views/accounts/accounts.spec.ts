// Adding, connecting and removing connector accounts from the Calendar and the Inbox, and the
// account setup page that saves a provider's client half once for both.
//
// tests/browser/helpers/serve.ts runs the server with this run's own HOME, so a saved half lands in
// its `~/.oculus/connect`, and with `open_bin` naming this run's recorder, so a consent page is
// appended to a file of the run rather than opened. Each case starts by deleting the Google half,
// saves it through the page when it needs one, removes the accounts it added and deletes the half
// again, and each adds under a label of its own, so any one case runs alone or in any order.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { SHOWN_VIEW, boot, openView } from '../../helpers/rail.ts';
import {
    openedAddresses,
    readEngineFile,
    removeServedHomeFile,
    servedConnectorDir,
    servedHomeDir,
    writeConnectorFile
} from '../../helpers/hub.ts';
import { layerPort } from '../../helpers/layer.ts';
import { t } from '../../helpers/words.ts';

const GOOGLE_ID = '4242-browserlayer.apps.googleusercontent.com';
const GOOGLE_SECRET = 'GOCSPX-browser-layer-secret';

/** This run's Google client half, where the setup page's Save writes it. */
function googleHalf(): string {
    return join(servedHomeDir(), '.oculus', 'connect', 'google.json');
}

/** Open the account setup page and wait for the server's answer to be drawn. */
async function openSetup(page: Page): Promise<void> {
    await openView(page, 'account-setup', t('views.account_setup'));
    await expect(page.locator('section[data-provider="google"]')).toBeVisible({ timeout: 15000 });
}

/** Delete this run's Google half, so the case starts, and leaves, with the provider not set up. */
function clearGoogleHalf(): void {
    removeServedHomeFile(join('.oculus', 'connect', 'google.json'));
    expect(existsSync(googleHalf())).toBe(false);
}

/** Open the setup page and save this run's Google half on it. */
async function setUpGoogle(page: Page): Promise<void> {
    await openSetup(page);
    await saveGoogleHalf(page);
}

/** One account row of the view on screen, by the attribute its kind names it with. */
function accountRow(page: Page, kind: 'calendar' | 'mail', key: string) {
    return page.locator(SHOWN_VIEW).locator(`[data-${kind}-account="${key}"]`);
}

/** Type this run's Google half into the setup page and save it. */
async function saveGoogleHalf(page: Page): Promise<void> {
    const form = page.locator('[data-half="google"]');
    await form.getByRole('textbox', { name: t('accounts.google_client_id') }).fill(GOOGLE_ID);
    await form.getByLabel(t('accounts.google_client_secret')).fill(GOOGLE_SECRET);
    await form.getByRole('button', { name: t('accounts.save') }).click();
    await expect(form).toContainText(t('accounts.saved', t('accounts.provider_google')));
}

/** Add one Google account from the view on screen, through the head's Add account. */
async function addGoogle(page: Page, kind: 'calendar' | 'mail', label: string): Promise<void> {
    await page
        .getByRole('button', { name: t('accounts.add') })
        .first()
        .click();
    const form = page.locator(`[data-add-account="${kind}"]`);
    await form.getByRole('textbox', { name: t('accounts.add_label') }).fill(label);
    await form.getByRole('button', { name: t('accounts.add_go') }).click();
}

/**
 * Remove one account from the view on screen, through its row menu and the confirm, and return the
 * question the confirm asked.
 */
async function removeRow(page: Page, kind: 'calendar' | 'mail', key: string): Promise<string> {
    const row = accountRow(page, kind, key);
    await row.getByRole('button', { name: t('ui.row_menu') }).click();
    await page.getByRole('menuitem', { name: t('accounts.remove') }).click();
    const dialog = page.getByRole('alertdialog');
    const asked = (await dialog.textContent()) ?? '';
    await dialog.getByRole('button', { name: t('accounts.remove') }).click();
    // The row goes once the server has read the machine file it rewrote.
    await expect(row).toHaveCount(0, { timeout: 15000 });
    return asked;
}

test('the setup page lists both Microsoft redirect addresses on the served port', async ({
    page
}) => {
    // revert: src/lib/server/accounts/connect/setup.ts "mail: callbackUrl(target.port, 'mail')" => mail: callbackUrl(8787, 'mail')
    await boot(page);
    await openSetup(page);
    // The served local.yml names the port the server listens on, which is the one this run serves:
    // OCULUS_BROWSER_PORT when a run names one, as revert-check does for each case.
    const port = layerPort();
    const redirects = page.locator('[data-redirects] [data-copy-value]');
    await expect(redirects).toHaveCount(2);
    await expect(redirects.nth(0)).toHaveAttribute(
        'data-copy-value',
        `http://127.0.0.1:${port}/api/calendar/callback`
    );
    await expect(redirects.nth(1)).toHaveAttribute(
        'data-copy-value',
        `http://127.0.0.1:${port}/api/mail/callback`
    );
    await expect(page.locator('[data-permissions] [data-copy-value="Mail.Send"]')).toHaveCount(1);
});

test('the setup page saves a Google half at 0600, says it is set up and draws no secret', async ({
    page
}) => {
    // revert: src/lib/views/personal/account-setup/HalfForm.svelte "clientSecret = '';" => delete
    clearGoogleHalf();
    await boot(page);
    await openSetup(page);
    const google = page.locator('section[data-provider="google"]');
    await expect(google.locator('h3')).toContainText(t('accounts.not_ready'));
    await saveGoogleHalf(page);
    await expect(google.locator('h3')).toContainText(t('accounts.ready'));
    expect(JSON.parse(readFileSync(googleHalf(), 'utf8'))).toEqual({
        client_id: GOOGLE_ID,
        client_secret: GOOGLE_SECRET
    });
    expect(statSync(googleHalf()).mode & 0o777).toBe(0o600);
    // The saved half is never drawn back: the fields are emptied and the page says only that the
    // provider is set up.
    await expect(google.getByLabel(t('accounts.google_client_secret'))).toHaveValue('');
    await expect(google.getByRole('textbox', { name: t('accounts.google_client_id') })).toHaveValue(
        ''
    );
    // Nor is it in the markup, where a value written back into an attribute would be.
    expect(await page.content()).not.toContain(GOOGLE_SECRET);
    clearGoogleHalf();
});

test('an Add with no Google half opens the setup page, and its Save adds the account', async ({
    page
}) => {
    // revert: src/lib/state/life/accounts.svelte.ts "return add(held.kind, held.provider, held.label);" => return '';
    clearGoogleHalf();
    await boot(page);
    await openView(page, 'calendar', t('views.calendar'));
    const before = openedAddresses().length;
    await addGoogle(page, 'calendar', 'first');

    await expect(page.getByRole('tab', { name: t('views.account_setup') })).toBeVisible({
        timeout: 15000
    });
    await expect(page.locator(SHOWN_VIEW)).toContainText(
        t('accounts.waiting', 'first', t('accounts.provider_google'))
    );
    await saveGoogleHalf(page);

    await expect.poll(() => openedAddresses().length, { timeout: 15000 }).toBe(before + 1);
    const consent = new URL(openedAddresses()[before]);
    expect(consent.searchParams.get('client_id')).toBe(GOOGLE_ID);
    expect(consent.searchParams.get('scope')).toContain('calendar.readonly');
    await openView(page, 'calendar', t('views.calendar'));
    await expect(accountRow(page, 'calendar', 'google-first')).toHaveCount(1, { timeout: 15000 });
    await removeRow(page, 'calendar', 'google-first');
    clearGoogleHalf();
});

test('a calendar account added from the Calendar starts its consent with the saved client id', async ({
    page
}) => {
    // revert: src/lib/server/accounts/connect/actions.ts "return startConsent(kind, target, written);" => return json(200, { ok: true });
    clearGoogleHalf();
    await boot(page);
    await setUpGoogle(page);
    await openView(page, 'calendar', t('views.calendar'));
    const before = openedAddresses().length;
    await addGoogle(page, 'calendar', 'home');

    const row = accountRow(page, 'calendar', 'google-home');
    await expect(row).toHaveCount(1, { timeout: 15000 });
    await expect(row).toContainText(t('accounts.not_connected'));
    await expect.poll(() => openedAddresses().length, { timeout: 15000 }).toBe(before + 1);
    const consent = new URL(openedAddresses()[before]);
    expect(consent.searchParams.get('client_id')).toBe(GOOGLE_ID);
    expect(consent.searchParams.get('scope')).toContain('calendar.readonly');
    expect(readEngineFile('config/local.yml')).toContain('label: home');
    expect(existsSync(join(servedConnectorDir('calendar'), 'google-home.json'))).toBe(true);
    await removeRow(page, 'calendar', 'google-home');
    clearGoogleHalf();
});

test('a mail account added from the Inbox needs no second setup of the provider', async ({
    page
}) => {
    // revert: src/lib/server/accounts/connect/store.ts "half = record === null ? undefined : halfIn(shared, record, account.provider);" => half = undefined;
    clearGoogleHalf();
    await boot(page);
    await setUpGoogle(page);
    const tabs = await page.getByRole('tab', { name: t('views.account_setup') }).count();
    await openView(page, 'inbox', t('views.inbox'));
    const before = openedAddresses().length;
    await addGoogle(page, 'mail', 'house');

    await expect(accountRow(page, 'mail', 'google-house')).toHaveCount(1, { timeout: 15000 });
    await expect.poll(() => openedAddresses().length, { timeout: 15000 }).toBe(before + 1);
    const consent = new URL(openedAddresses()[before]);
    expect(consent.searchParams.get('client_id')).toBe(GOOGLE_ID);
    expect(consent.searchParams.get('scope')).toContain('gmail.modify');
    // The half saved once serves the mail account too, so the Add opened no second setup page.
    await expect(page.getByRole('tab', { name: t('views.account_setup') })).toHaveCount(tabs);
    await removeRow(page, 'mail', 'google-house');
    clearGoogleHalf();
});

test('an account removed from its row menu loses its row and its file, and the half stays', async ({
    page
}) => {
    // revert: src/lib/views/shared/accounts/AccountList.svelte "onconfirm={() => void removeAsked()}" => onconfirm={() => (asking = null)}
    clearGoogleHalf();
    await boot(page);
    await setUpGoogle(page);
    for (const [kind, view, label] of [
        ['calendar', 'calendar', t('views.calendar')],
        ['mail', 'inbox', t('views.inbox')]
    ] as const) {
        await openView(page, view, label);
        await expect(accountRow(page, kind, 'google-work')).toHaveCount(1, { timeout: 15000 });
        await addGoogle(page, kind, 'spare');
        await expect(accountRow(page, kind, 'google-spare')).toHaveCount(1, { timeout: 15000 });
        const asked = await removeRow(page, kind, 'google-spare');
        // The account's file held a token alone, so the confirm says the provider stays set up.
        expect(asked).toContain(t('accounts.remove_confirm', 'spare'));
        // Remove deletes the account's own credential file.
        expect(existsSync(join(servedConnectorDir(kind), 'google-spare.json'))).toBe(false);
        // The account that was there before stays.
        await expect(accountRow(page, kind, 'google-work')).toHaveCount(1);
    }
    // The provider's half serves every other account of it, so Remove leaves it.
    expect(existsSync(googleHalf())).toBe(true);
    // Both rows named spare are gone from the machine file.
    expect(readEngineFile('config/local.yml')).not.toContain('label: spare');
    clearGoogleHalf();
});

test("an account whose own file carries its client id says so in Remove's confirm, and loses it", async ({
    page
}) => {
    // revert: src/lib/server/accounts/calendar/poll.ts "...(hasOwnHalf(dir, account) ? { ownHalf: true } : {})," => delete
    clearGoogleHalf();
    await boot(page);
    await setUpGoogle(page);
    await openView(page, 'calendar', t('views.calendar'));
    await addGoogle(page, 'calendar', 'own');
    await expect(accountRow(page, 'calendar', 'google-own')).toHaveCount(1, { timeout: 15000 });
    // The account's file is given a client half of its own, which the next round reads.
    writeConnectorFile(
        'calendar',
        'google-own.json',
        JSON.stringify({ client_id: 'own-id.apps.googleusercontent.com', client_secret: 'own' })
    );
    await page
        .locator(SHOWN_VIEW)
        .getByRole('button', { name: t('calendar.refresh_now') })
        .click();

    await expect
        .poll(
            async () => {
                const row = accountRow(page, 'calendar', 'google-own');
                await row.getByRole('button', { name: t('ui.row_menu') }).click();
                await page.getByRole('menuitem', { name: t('accounts.remove') }).click();
                const dialog = page.getByRole('alertdialog');
                const asked = (await dialog.textContent()) ?? '';
                await dialog.getByRole('button', { name: t('accounts.cancel') }).click();
                return asked;
            },
            { timeout: 15000 }
        )
        .toContain(t('accounts.remove_confirm_own', 'own'));
    await removeRow(page, 'calendar', 'google-own');
    // The file that carried the account's own client id is gone with the account.
    expect(existsSync(join(servedConnectorDir('calendar'), 'google-own.json'))).toBe(false);
    clearGoogleHalf();
});
