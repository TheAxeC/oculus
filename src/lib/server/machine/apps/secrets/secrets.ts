// Layer 2, server. The secrets of the apps, kept in the operating system's keyring: Keychain on
// macOS, Credential Manager on Windows and Secret Service on Linux, through `@napi-rs/keyring`, one
// code path on every platform and in the browser mode. The service of an app's entries is
// `oculus-app:<view id>` and the account is the key, so one app's entries cannot be reached under
// another's service, and the caller names the app from the request, never from a body.
//
// A key is 1 to 64 of `A-Za-z0-9._-` and a value is text of at most 2048 bytes as UTF-8. An app
// that did not declare `secrets: true` is refused `not_declared` by every method. A refusal is a
// word: `not_declared`, `refused:key`, `too_large`, or `refused:<line>` where the line says the
// keyring is not available. A value goes from the keyring to its caller and nowhere else: this
// module logs nothing, writes no file and publishes no channel, and a failure's line is worded
// from the error's kind and never from its text, so a message that held a value cannot reach a
// log or a page.
//
// The keyring is handed in, so a test passes a store that keeps its entries in memory. The real one
// is loaded when the first call needs it, so a machine whose binding does not load is a refusal of
// the secrets and never a server that does not start.

import { SECRET_KEY, SECRET_MAX_BYTES } from '../../../../data/helpers/files/apps.ts';
import type { HeldApp } from '../read/held.ts';

/** The calls the module makes on a keyring, each on one service and account. */
export type Keyring = {
    /** The bytes stored, or undefined when there is none. */
    get(service: string, account: string): Promise<Uint8Array | undefined>;
    set(service: string, account: string, value: Uint8Array): Promise<void>;
    /** Whether an entry was deleted. */
    remove(service: string, account: string): Promise<boolean>;
    /** The accounts stored under a service. */
    accounts(service: string): Promise<string[]>;
};

/** What a secrets call answers: the value, or the word it is refused with. */
type SecretAnswer<T> = { ok: true; value: T } | { ok: false; word: string };

/** The secrets module over one keyring. */
export type AppSecrets = {
    get(app: HeldApp, key: unknown): Promise<SecretAnswer<string | undefined>>;
    store(app: HeldApp, key: unknown, value: unknown): Promise<SecretAnswer<null>>;
    delete(app: HeldApp, key: unknown): Promise<SecretAnswer<null>>;
    /** How many secrets the app holds, or null when the keyring cannot be read. */
    count(app: HeldApp): Promise<number | null>;
    /** Delete every secret the app holds; false when the keyring could not be read or cleared. */
    clear(app: HeldApp): Promise<boolean>;
};

/** What the module is made with. */
export type SecretsOptions = {
    /** The keyring, or a function that loads it when the first call needs it. */
    keyring: Keyring | (() => Promise<Keyring>);
    /** The line that says the keyring is not available, worded from the catalog. */
    unavailable: () => string;
};

/** The service the entries of an app are stored under. */
function serviceOf(app: HeldApp): string {
    return `oculus-app:${app.id}`;
}

const NOT_DECLARED = 'not_declared';
const TOO_LARGE = 'too_large';
const BAD_KEY = 'refused:key';
const BAD_VALUE = 'refused:value';

/** Whether a key a caller sent is text of the key pattern. */
function validKey(key: unknown): key is string {
    return typeof key === 'string' && SECRET_KEY.test(key);
}

/** The keyring of this machine, loaded on first use, with Linux pinned to the Secret Service. */
export function nodeKeyring(): () => Promise<Keyring> {
    let loaded: Promise<Keyring> | null = null;
    return () => {
        loaded ??= import('@napi-rs/keyring').then((binding) => {
            const options = { linux: { store: 'secret-service' as const } };
            const entry = (
                service: string,
                account: string
            ): InstanceType<typeof binding.AsyncEntry> =>
                new binding.AsyncEntry(service, account, options);
            return {
                get: (service, account) => entry(service, account).getSecret(),
                set: (service, account, value) => entry(service, account).setSecret(value),
                remove: (service, account) => entry(service, account).deleteCredential(),
                accounts: async (service) =>
                    (await binding.findCredentialsAsync(service)).map((one) => one.account)
            };
        });
        return loaded;
    };
}

/** Make the secrets module over a keyring. */
export function createSecrets(options: SecretsOptions): AppSecrets {
    const held = options.keyring;
    const keyring = async (): Promise<Keyring> => (typeof held === 'function' ? held() : held);
    const refusedUnavailable = <T>(): SecretAnswer<T> => ({
        ok: false,
        word: `refused:${options.unavailable()}`
    });

    /** Run a keyring call; any failure of the keyring is the one `unavailable` line. */
    async function through<T>(
        app: HeldApp,
        key: unknown,
        call: (ring: Keyring, service: string, account: string) => Promise<T>
    ): Promise<SecretAnswer<T>> {
        if (!app.row.secrets) return { ok: false, word: NOT_DECLARED };
        if (!validKey(key)) return { ok: false, word: BAD_KEY };
        try {
            return { ok: true, value: await call(await keyring(), serviceOf(app), key) };
        } catch {
            return refusedUnavailable();
        }
    }

    return {
        async get(app, key) {
            const answer = await through(app, key, (ring, service, account) =>
                ring.get(service, account)
            );
            if (!answer.ok) return answer;
            const bytes = answer.value;
            return {
                ok: true,
                value: bytes === undefined ? undefined : Buffer.from(bytes).toString('utf8')
            };
        },
        async store(app, key, value) {
            if (!app.row.secrets) return { ok: false, word: NOT_DECLARED };
            if (!validKey(key)) return { ok: false, word: BAD_KEY };
            if (typeof value !== 'string') return { ok: false, word: BAD_VALUE };
            const bytes = Buffer.from(value, 'utf8');
            if (bytes.length > SECRET_MAX_BYTES) return { ok: false, word: TOO_LARGE };
            const answer = await through(app, key, (ring, service, account) =>
                ring.set(service, account, bytes)
            );
            return answer.ok ? { ok: true, value: null } : answer;
        },
        async delete(app, key) {
            const answer = await through(app, key, (ring, service, account) =>
                ring.remove(service, account)
            );
            return answer.ok ? { ok: true, value: null } : answer;
        },
        async count(app) {
            try {
                return (await (await keyring()).accounts(serviceOf(app))).length;
            } catch {
                return null;
            }
        },
        async clear(app) {
            try {
                const ring = await keyring();
                const service = serviceOf(app);
                for (const account of await ring.accounts(service))
                    await ring.remove(service, account);
                return true;
            } catch {
                return false;
            }
        }
    };
}
