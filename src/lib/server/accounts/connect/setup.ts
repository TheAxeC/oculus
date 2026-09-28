// Layer 2, server. The account setup page's two requests: what it shows, and the Save that writes
// one provider's client half.
//
// What it shows is read from oauth.ts's own constants, the redirect addresses on the port this
// server listens on and the scopes each connector asks for, so what the reader registers at a
// provider's console is what the connect flow sends there and the two cannot disagree. Whether a
// provider is set up is the one fact about the files it answers; the client id, the secret and the
// tenant are never in an answer, a log or an error.
//
// The Save carries the token gate every write carries and runs behind the process's write chain.
// The half is checked by the rule the page checks it by (data/accounts/connect.ts), so a refusal is
// a code the page words, and the half written is one the connect flow reads back. Both connectors
// are then read again, so an account that was waiting on the provider says it can connect.

import { json } from '@sveltejs/kit';
import { providerHalf, isProvider } from '../../../data/accounts/connect.ts';
import type { ConnectProvider, ConnectSetup } from '../../../data/model/index.ts';
import { gatedBody } from '../../core/auth.ts';
import { chained, type FsWrites } from '../../core/json.ts';
import { SCOPE, callbackUrl } from './oauth.ts';
import { providerReady, writeProviderHalf } from './store.ts';

export type SetupTarget = {
    token: string;
    /** The folder the providers' client halves live in, already resolved. */
    providerDir: string;
    /** The port this server listens on, which the redirect addresses carry. */
    port: number;
    writes: FsWrites;
    /** Read every account of both connectors again, after a half was written. */
    refresh: () => Promise<void>;
};

/** Whether a provider's half is on this machine; a file that cannot be read is no half. */
function ready(providerDir: string, provider: ConnectProvider): boolean {
    try {
        return providerReady(providerDir, provider);
    } catch {
        return false;
    }
}

/** What the setup page draws from, for the request that asked. */
export function handleSetupRead(request: Request, target: SetupTarget): Response {
    const answer: ConnectSetup = {
        ready: {
            google: ready(target.providerDir, 'google'),
            microsoft: ready(target.providerDir, 'microsoft')
        },
        redirects: {
            calendar: callbackUrl(target.port, 'calendar'),
            mail: callbackUrl(target.port, 'mail')
        },
        scopes: SCOPE
    };
    return json(answer);
}

/** Save one provider's client half, refused as a code when its shape is wrong. */
export async function handleSetupWrite(request: Request, target: SetupTarget): Promise<Response> {
    const body = await gatedBody(request, target.token);
    if (body instanceof Response) return body;
    if (body.action !== 'save') return json({ error: 'bad action' }, { status: 400 });
    if (!isProvider(body.provider)) return json({ error: 'provider' }, { status: 400 });
    const checked = providerHalf(body.provider, {
        clientId: body.client_id,
        clientSecret: body.client_secret,
        tenant: body.tenant
    });
    if ('refused' in checked) return json({ error: checked.refused }, { status: 400 });
    try {
        await chained(target.writes, () => writeProviderHalf(target.providerDir, checked.half));
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return json({ error: 'file', reason }, { status: 500 });
    }
    await target.refresh();
    return json({ ok: true });
}
