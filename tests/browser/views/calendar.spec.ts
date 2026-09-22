// The Calendar view over an account that is configured and not yet connected.
// tests/browser/helpers/serve.ts writes this run's own `calendar_dir` and one `calendars` row whose
// credential file holds the client half and no refresh token, so the served server reads that file,
// marks the account not connected, calls no provider and publishes an empty agenda. Nothing in src/
// knows a test is running.
//
// The agenda's own drawing is the vitest case's (tests/views/personal/calendar.test.ts), since no
// provider is reached here. What this asserts is the path from the rail to a view drawn from the
// real connector.

import { expect, test } from '@playwright/test';
import { boot, openView } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';

test('the configured account is drawn not connected, with its Connect control and no events', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'calendar', t('views.calendar'));

    const account = page.locator('[data-account="google-work"]');
    await expect(account).toHaveCount(1, { timeout: 15000 });
    await expect(account).toContainText(t('calendar.not_connected'));
    await expect(account).toContainText('work');
    await expect(account.getByRole('button', { name: t('calendar.connect') })).toBeVisible();

    // The window holds nothing, since the account has no token and the poller called no provider.
    await expect(page.getByText(t('calendar.agenda_empty'))).toBeVisible();
    // the account has no token, so the poller called no provider and the window holds nothing
    await expect(page.locator('[data-event]')).toHaveCount(0);
});
