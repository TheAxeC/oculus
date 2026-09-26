// The Inbox view over a mail account that is configured and not yet connected.
// tests/browser/helpers/serve.ts writes this run's own `mail_dir` and one `mail` row whose
// credential file holds the client half and no refresh token, so the served server reads that file,
// marks the account not connected, calls no provider and publishes an empty plate. Nothing in src/
// knows a test is running.
//
// The plate's own drawing is the vitest case's (tests/views/feeds/inbox.test.ts), since no provider
// is reached here. What this asserts is the path from the rail to a view drawn from the real
// connector, and that the view offers no control over a feed file, since it is drawn from the mail
// channel.

import { expect, test } from '@playwright/test';
import { boot, openView } from '../../helpers/rail.ts';
import { t } from '../../helpers/words.ts';

test('the configured mail account is drawn not connected, with its Connect control and no threads', async ({
    page
}) => {
    // revert: src/lib/views/shared/accounts/AccountList.svelte:112 => {:else if false}
    await boot(page);
    await openView(page, 'inbox', t('views.inbox'));

    const account = page.locator('[data-mail-account="google-work"]');
    await expect(account).toHaveCount(1, { timeout: 15000 });
    await expect(account).toContainText(t('accounts.not_connected'));
    await expect(account).toContainText('work');
    await expect(account.getByRole('button', { name: t('accounts.connect') })).toBeVisible();

    // The plate holds nothing, since the account has no token and the poller called no provider.
    await expect(page.getByText(t('inbox.clear'))).toBeVisible();
    // the account has no token, so the poller called no provider and the plate holds nothing
    await expect(page.locator('[data-inbox]')).toHaveCount(0);
    // Drawn from the mail channel rather than a file of the hub, it offers no control over one.
    await expect(page.locator('[data-source-path]')).toHaveCount(0);
});
