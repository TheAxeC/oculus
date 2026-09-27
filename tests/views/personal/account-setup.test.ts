// The account setup view rendered to HTML over one setup answer: a section per provider with its
// state, the scopes and the Microsoft redirect addresses the connect flow uses, the fields a half
// is saved from, and nothing of a saved half.
//
// No server runs: the setup answer is built from the connect flow's own constants and handed to
// the store through a stub fetch, exactly as `GET /api/connect` answers it.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import AccountSetup, {
    registration
} from '../../../src/lib/views/personal/account-setup/AccountSetup.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs, t } from '../../../src/lib/state/shared/words/text.ts';
import type { ConnectSetup } from '../../../src/lib/data/model/index.ts';
import type { ViewRegistration } from '../../../src/lib/state/workbench/navigation/registry.ts';
import { SCOPE } from '../../../src/lib/server/accounts/connect/oauth.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

const instance = { id: 'account-setup-one', view: 'account-setup', title: 'Setup', state: {} };

const REDIRECTS = {
    calendar: 'http://127.0.0.1:8792/api/calendar/callback',
    mail: 'http://127.0.0.1:8792/api/mail/callback'
};

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

afterEach(() => vi.unstubAllGlobals());

/** The page drawn after the store has read this setup answer. */
async function draw(ready: { google: boolean; microsoft: boolean }): Promise<string> {
    const answer: ConnectSetup = { ready, redirects: REDIRECTS, scopes: SCOPE };
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify(answer))));
    await client.accounts.loadSetup();
    return render(AccountSetup, { context: clientContext(client), props: { instance } }).body;
}

/** The text of the one list a data attribute marks, with the markup taken off. */
function listOf(body: string, attribute: string): string {
    const at = body.indexOf(attribute);
    expect(at).toBeGreaterThan(-1);
    return body.slice(at, body.indexOf('</ul>', at));
}

describe('the account setup view', () => {
    it('audits that the view sits in the Personal group, after Memories and Calendar', () => {
        // revert: src/lib/views/personal/account-setup/AccountSetup.svelte "order: 2" => order: 0,
        const registered = registration as ViewRegistration;
        expect(registered.group).toBe('personal');
        expect(registered.order).toBe(2);
    });

    it('says it is reading until the setup answer has come', () => {
        // revert: src/lib/views/personal/account-setup/AccountSetup.svelte "{:else if held === null}" => {:else if false}
        const body = render(AccountSetup, {
            context: clientContext(client),
            props: { instance }
        }).body;
        expect(body).toContain(t('accounts.reading'));
        // No section is drawn from a setup the page has not read, so none says a provider's state.
        expect(body).not.toContain('data-provider="google"');
    });

    it('says the setup could not be read when the server gave no answer', async () => {
        // revert: src/lib/views/personal/account-setup/AccountSetup.svelte "{#if held === null && setupFailed() !== ''}" => {#if false}
        vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));
        await client.accounts.loadSetup();
        const body = render(AccountSetup, {
            context: clientContext(client),
            props: { instance }
        }).body;
        expect(body).toContain(t('accounts.unreachable'));
        // A page that could not read the setup does not also say it is still reading it.
        expect(body).not.toContain(t('accounts.reading'));
    });

    it('draws a section per provider, each saying whether it is set up', async () => {
        // revert: src/lib/views/personal/account-setup/AccountSetup.svelte "label={held.ready[provider] ? t('accounts.ready') : t('accounts.not_ready')}" => label={t('accounts.ready')}
        const body = await draw({ google: true, microsoft: false });
        const google = body.slice(body.indexOf('data-provider="google"'));
        const microsoft = body.slice(body.indexOf('data-provider="microsoft"'));
        expect(google.slice(0, google.indexOf('</h3>'))).toContain(t('accounts.ready'));
        expect(microsoft.slice(0, microsoft.indexOf('</h3>'))).toContain(t('accounts.not_ready'));
    });

    it('lists both Microsoft redirect addresses on the served port, each with a copy control', async () => {
        // revert: src/lib/views/personal/account-setup/AccountSetup.svelte "redirects={[held.redirects.calendar, held.redirects.mail]}" => redirects={[held.redirects.calendar]}
        const redirects = listOf(await draw({ google: false, microsoft: false }), 'data-redirects');
        for (const address of [REDIRECTS.calendar, REDIRECTS.mail]) {
            expect(redirects).toContain(`data-copy-value="${address}"`);
        }
        expect(redirects).toContain(t('accounts.copy'));
    });

    it('lists every scope the connect flow asks each provider for, from its own constants', async () => {
        // revert: src/lib/views/personal/account-setup/AccountSetup.svelte "permissions={scopesOf(held, 'microsoft')}" => permissions={[]}
        const body = await draw({ google: false, microsoft: false });
        const permissions = listOf(body, 'data-permissions');
        const microsoft = `${SCOPE.calendar.microsoft} ${SCOPE.mail.microsoft}`.split(' ');
        for (const scope of microsoft) {
            expect(permissions).toContain(`data-copy-value="${scope}"`);
        }
        const google = body.slice(body.indexOf('data-provider="google"'));
        for (const scope of `${SCOPE.calendar.google} ${SCOPE.mail.google}`.split(' ')) {
            expect(google.slice(0, google.indexOf('data-half'))).toContain(
                `data-copy-value="${scope}"`
            );
        }
    });

    it('says a directory may need its administrator, and that the consent screen then says so', async () => {
        // revert: src/lib/views/personal/account-setup/MicrosoftSteps.svelte "<p class=\"note\">{t('accounts.microsoft_admin')}</p>" => delete
        const body = await draw({ google: false, microsoft: false });
        const microsoft = body.slice(body.indexOf('data-provider="microsoft"'));
        expect(microsoft).toContain(t('accounts.microsoft_admin'));
        expect(t('accounts.microsoft_admin')).toContain('the consent screen then says so');
    });

    it('draws the fields a half is saved from, the Google secret masked', async () => {
        // revert: src/lib/views/personal/account-setup/HalfForm.svelte "secret" => delete
        const body = await draw({ google: false, microsoft: false });
        const google = body.slice(body.indexOf('data-half="google"'));
        const form = google.slice(0, google.indexOf(t('accounts.save')));
        expect(form).toContain(t('accounts.google_client_id'));
        expect(form).toContain(t('accounts.google_client_secret'));
        expect(form).toContain('type="password"');
        const microsoft = body.slice(body.indexOf('data-half="microsoft"'));
        expect(microsoft).toContain(t('accounts.microsoft_client_id'));
        expect(microsoft).toContain(t('accounts.microsoft_tenant'));
    });
});
