// Layer 2, client state. The connector accounts of the Calendar and the Inbox as the reader manages
// them: Connect, Add and Remove on an account, and the account setup page that saves each
// provider's client half once.
//
// A label and a client half are checked here, by the rule the server checks them by
// (data/accounts/connect.ts), so a refusal is said in words before anything is sent. What the
// server still refuses comes back as a code and is said in the same words, and so does a request
// that got no answer or an answer that was not JSON, so no press ends in silence. An Add or a
// Connect for a provider with no client half on this machine opens the setup page instead; the Add
// waits there and is made when that provider's half is saved.
//
// The setup page's facts, whether each provider is set up and the addresses and scopes to register,
// are the server's answer to `GET /api/connect`; the page holds no copy of them. Nothing here keeps
// a client id or a secret past the request that carries it.

import { accountRefusal, connectKey, providerHalf } from '../../data/accounts/connect.ts';
import type {
    ConnectAccountConfig,
    ConnectKind,
    ConnectProvider,
    ConnectSetup
} from '../../data/model/index.ts';
import { t } from '../shared/words/text.ts';
import { postCommand } from '../shared/stores/post.ts';
import type { EntitiesStore, WritesStore } from '../shared/stores/shapes.ts';

/** The id the account setup view is registered under, which the Add and the menus open. */
export const ACCOUNT_SETUP_VIEW = 'account-setup';

/** An Add waiting on its provider's setup. */
export type WaitingAdd = { kind: ConnectKind; provider: ConnectProvider; label: string };

/** The fields of the setup page's form for one provider, as typed. */
export type HalfFields = { clientId: string; clientSecret: string; tenant: string };

export type AccountsStore = {
    /** What the setup page draws from, or null before the server has answered. */
    setup: () => ConnectSetup | null;
    /** The sentence saying the setup page's facts could not be read, or the empty string. */
    setupFailed: () => string;
    loadSetup: () => Promise<void>;
    /** Save one provider's half; the empty string when it was saved, the refusal otherwise. */
    saveHalf: (provider: ConnectProvider, typed: HalfFields) => Promise<string>;
    /** The Add waiting on its provider's setup, or null. */
    waiting: () => WaitingAdd | null;
    add: (kind: ConnectKind, provider: ConnectProvider, label: string) => Promise<string>;
    remove: (kind: ConnectKind, account: ConnectAccountConfig) => Promise<string>;
    connect: (kind: ConnectKind, account: ConnectAccountConfig) => Promise<string>;
    /** Whether a Connect press on this account has not been answered yet. */
    connecting: (kind: ConnectKind, account: ConnectAccountConfig) => boolean;
    /** Whether an Add or a Remove of this connector has not been answered yet. */
    busy: (kind: ConnectKind) => boolean;
    openSetup: () => void;
};

/** The endpoint each connector's account commands go to. */
const ENDPOINT: Record<ConnectKind, string> = { calendar: '/api/calendar', mail: '/api/mail' };

/**
 * The sentence one refusal code is said in. A code the page does not know is a sentence the
 * server already wrote, which is said as it came.
 */
function refusalWords(code: string, label: string, reason: string): string {
    switch (code) {
        case 'provider':
            return t('accounts.refused_provider');
        case 'label':
            return t('accounts.refused_label');
        case 'taken':
            return t('accounts.refused_taken', label);
        case 'google_id':
            return t('accounts.refused_google_id');
        case 'google_secret':
            return t('accounts.refused_google_secret');
        case 'microsoft_id':
            return t('accounts.refused_microsoft_id');
        case 'tenant':
            return t('accounts.refused_tenant');
        case 'file':
            return t('accounts.refused_file', reason);
        case 'unreachable':
            return t('accounts.unreachable');
        case 'unreadable':
            return t('accounts.unreadable');
        default:
            return t('accounts.refused', code);
    }
}

/** A server's answer: whether it took the command, and its refusal code and reason when not. */
type Answer = { ok: boolean; error: string; reason: string };

export function createAccounts(
    entities: EntitiesStore,
    writes: WritesStore,
    open: (view: string) => void
): AccountsStore {
    let setup: ConnectSetup | null = $state(null);
    /** Why the setup page's facts could not be read, or the empty string. */
    let setupFailed = $state('');
    let waiting: WaitingAdd | null = $state(null);
    /** The accounts whose Connect press is still open, by kind and key. */
    const connectingKeys = $state(new Set<string>());
    /** The connectors with an Add or a Remove still open. */
    const busyKinds = $state(new Set<ConnectKind>());

    /** Post one command and read its answer. */
    async function post(url: string, body: Record<string, unknown>): Promise<Answer> {
        const answer = await postCommand(url, body, writes.writeToken());
        const { error, reason } = answer.body;
        return {
            ok: answer.ok,
            error: typeof error === 'string' ? error : answer.failed,
            reason: typeof reason === 'string' ? reason : ''
        };
    }

    /** The rows a connector's payload lists now. */
    function rows(kind: ConnectKind): ConnectAccountConfig[] {
        const held = kind === 'calendar' ? entities.calendar() : entities.inbox();
        return held?.accounts ?? [];
    }

    function openSetup(): void {
        open(ACCOUNT_SETUP_VIEW);
    }

    async function loadSetup(): Promise<void> {
        let response: Response;
        try {
            response = await fetch('/api/connect');
        } catch {
            setupFailed = t('accounts.unreachable');
            return;
        }
        try {
            if (!response.ok) throw new Error('refused');
            setup = (await response.json()) as ConnectSetup;
            setupFailed = '';
        } catch {
            setupFailed = t('accounts.unreadable');
        }
    }

    /** Hold an Add until its provider is set up, and open the page that sets it up. */
    function waitForSetup(add: WaitingAdd): string {
        waiting = add;
        openSetup();
        return '';
    }

    async function add(
        kind: ConnectKind,
        provider: ConnectProvider,
        label: string
    ): Promise<string> {
        const typed = label.trim();
        const refused = accountRefusal(rows(kind), provider, typed);
        if (refused !== null) return refusalWords(refused, typed, '');
        if (setup !== null && !setup.ready[provider]) {
            return waitForSetup({ kind, provider, label: typed });
        }
        busyKinds.add(kind);
        try {
            const answer = await post(ENDPOINT[kind], { action: 'add', provider, label: typed });
            if (answer.error === 'setup') return waitForSetup({ kind, provider, label: typed });
            return answer.ok ? '' : refusalWords(answer.error, typed, answer.reason);
        } finally {
            busyKinds.delete(kind);
        }
    }

    return {
        setup: () => setup,
        setupFailed: () => setupFailed,
        loadSetup,
        saveHalf: async (provider, typed) => {
            const checked = providerHalf(provider, typed);
            if ('refused' in checked) return refusalWords(checked.refused, '', '');
            const answer = await post('/api/connect', {
                action: 'save',
                provider,
                client_id: typed.clientId,
                client_secret: typed.clientSecret,
                tenant: typed.tenant
            });
            if (!answer.ok) return refusalWords(answer.error, '', answer.reason);
            await loadSetup();
            const held = waiting;
            if (held?.provider !== provider) return '';
            waiting = null;
            return add(held.kind, held.provider, held.label);
        },
        waiting: () => waiting,
        add,
        remove: async (kind, account) => {
            busyKinds.add(kind);
            try {
                const answer = await post(ENDPOINT[kind], {
                    action: 'remove',
                    account: connectKey(account)
                });
                return answer.ok ? '' : refusalWords(answer.error, account.label, answer.reason);
            } finally {
                busyKinds.delete(kind);
            }
        },
        connect: async (kind, account) => {
            const key = `${kind}:${connectKey(account)}`;
            connectingKeys.add(key);
            try {
                const answer = await post(ENDPOINT[kind], {
                    action: 'connect',
                    account: connectKey(account)
                });
                if (answer.error === 'setup') {
                    openSetup();
                    return '';
                }
                return answer.ok ? '' : refusalWords(answer.error, account.label, answer.reason);
            } finally {
                connectingKeys.delete(key);
            }
        },
        connecting: (kind, account) => connectingKeys.has(`${kind}:${connectKey(account)}`),
        busy: (kind) => busyKinds.has(kind),
        openSetup
    };
}
