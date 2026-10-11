// Layer 2, server test. The secrets of the apps (lib/server/machine/apps/secrets/secrets.ts): who
// may use them, where an entry is kept, which keys and values are taken, what a keyring that cannot
// be read does, and that a value reaches nothing but the keyring.
//
// The keyring is a map in memory (hosts-fixture.ts); the machine's own is never loaded. What this
// does NOT cover: the real binding of @napi-rs/keyring, which is loaded when a first call needs it,
// and the routes that call this (tests/routes/apps/app-secrets.test.ts).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { appById, type HeldApp } from '../../../../src/lib/server/machine/apps/read/held.ts';
import { it } from '../../../fixtures/scratch.ts';
import { memoryKeyring, secretsOf } from './hosts-fixture.ts';
import { world } from './hosts-world.ts';

const VALUE = 'S3CR3T-VALUE-4f7a';

/** The held app `notes`, with or without `secrets: true`. */
function held(declared: boolean): HeldApp {
    const w = world({ notes: { keys: declared ? 'secrets: true\n' : '' } });
    const app = appById(w.held(), 'app:notes');
    if (app === undefined) throw new Error('the app is not held');
    return app;
}

describe('answers a secret only to an app that declared secrets, from its own entries', () => {
    it('refuses every call of an app that did not declare secrets with not_declared and reads no keyring', async () => {
        const ring = memoryKeyring();
        const secrets = secretsOf(ring);
        const app = held(false);
        expect([
            await secrets.get(app, 'token'),
            await secrets.store(app, 'token', 'x'),
            await secrets.delete(app, 'token'),
            ring.entries.size
        ]).toEqual([
            { ok: false, word: 'not_declared' },
            { ok: false, word: 'not_declared' },
            { ok: false, word: 'not_declared' },
            0
        ]);
    });

    it('keeps an entry under the service oculus-app:<view id> and the account of its key', async () => {
        const ring = memoryKeyring();
        const secrets = secretsOf(ring);
        const app = held(true);
        await secrets.store(app, 'token', 'x');
        const got = await secrets.get(app, 'token');
        const accounts = await ring.accounts('oculus-app:app:notes');
        expect([got, accounts, [...ring.entries.keys()].map((key) => key.split('\u0000'))]).toEqual(
            [{ ok: true, value: 'x' }, ['token'], [['oculus-app:app:notes', 'token']]]
        );
    });

    it("lists and clears one app's entries without reaching another app's service", async () => {
        const ring = memoryKeyring();
        const secrets = secretsOf(ring);
        const app = held(true);
        await secrets.store(app, 'one', '1');
        await secrets.store(app, 'two', '2');
        await ring.set('oculus-app:app:other', 'one', new Uint8Array([9]));
        const counted = await secrets.count(app);
        const cleared = await secrets.clear(app);
        expect([
            counted,
            cleared,
            await ring.accounts('oculus-app:app:notes'),
            await ring.accounts('oculus-app:app:other')
        ]).toEqual([2, true, [], ['one']]);
    });
});

describe('takes a key of 1 to 64 letters, digits, dots, underscores and hyphens and a value of 2048 bytes at most', () => {
    const ROWS: [string, unknown, unknown, string][] = [
        ['a key holding a space', 'a b', 'x', 'refused:key'],
        ['a key of 65 characters', 'k'.repeat(65), 'x', 'refused:key'],
        ['an empty key', '', 'x', 'refused:key'],
        ['a key that is not text', 5, 'x', 'refused:key'],
        ['a value that is not text', 'k', 5, 'refused:value'],
        ['a value of 2049 bytes', 'k', 'x'.repeat(2049), 'too_large'],
        ['a value of 1025 two-byte letters', 'k', '\u00e9'.repeat(1025), 'too_large']
    ];

    it.each(ROWS)('refuses %s with %s', async (_row, key, value, word) => {
        const ring = memoryKeyring();
        const answer = await secretsOf(ring).store(held(true), key, value);
        expect([answer, ring.entries.size]).toEqual([{ ok: false, word }, 0]);
    });

    it.each([
        ['a key of 64 characters', 'k'.repeat(64), 'x'],
        ['2048 bytes of ASCII', 'k', 'x'.repeat(2048)],
        ['1024 two-byte letters, which are 2048 bytes', 'k', '\u00e9'.repeat(1024)]
    ])('stores %s and reads it back whole', async (_row, key, value) => {
        const secrets = secretsOf(memoryKeyring());
        const app = held(true);
        await secrets.store(app, key, value);
        expect(await secrets.get(app, key)).toEqual({ ok: true, value });
    });
});

describe('says the keyring is not available without the value, and writes the value nowhere else', () => {
    it('rejects a store with the one line of the catalog when the keyring cannot be used', async () => {
        const secrets = secretsOf({
            ...memoryKeyring(),
            set: () => Promise.reject(new Error(`the keyring failed for ${VALUE}`))
        });
        const answer = await secrets.store(held(true), 'token', VALUE);
        expect(answer).toEqual({ ok: false, word: 'refused:the keyring is not available' });
        expect(JSON.stringify(answer)).not.toContain(VALUE);
    });

    it('leaves the value out of every channel, every record and every file a host and a store touch', async () => {
        const w = world({ notes: { keys: 'secrets: true\n' } });
        await w.hosts.tab('app:notes');
        const host = w.spawned[0].connection;
        await host.sendRequest('oculus/secrets/store', { key: 'token', value: VALUE });
        const back = await host.sendRequest('oculus/secrets/get', { key: 'token' });
        await host.sendRequest('oculus/store/update', { key: 'seen', value: 'a note' });
        await w.hosts.stop('app:notes');
        const carried = JSON.stringify([...w.carried('app-hosts'), ...w.carried('app-messages')]);
        const files: string[] = [];
        const walk = (folder: string): void => {
            for (const name of readdirSync(folder)) {
                const path = join(folder, name);
                if (statSync(path).isDirectory()) walk(path);
                else files.push(readFileSync(path, 'utf8'));
            }
        };
        walk(w.fixture.base);
        expect([
            back,
            carried.includes(VALUE),
            files.some((text) => text.includes(VALUE)),
            JSON.stringify(w.stores).includes(VALUE),
            [...w.keyring.entries.values()].map((bytes) => Buffer.from(bytes).toString('utf8'))
        ]).toEqual([VALUE, false, false, false, [VALUE]]);
    });
});
