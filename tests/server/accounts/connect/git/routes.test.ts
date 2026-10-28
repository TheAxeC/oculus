// Layer 4, server test. The one POST of Account setup's git section (`handleGitSignIn`): every
// action refused without the page's token, before the section is read, a Sign in is started or
// cancelled, or a host's file is written; and a token saved for a key that no git host row of
// `sign_in` names with the file's address listed with its Sign out, which takes it out.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { GitHosts } from '../../../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig } from '../../../../../src/lib/data/sources/config.ts';
import { fsWrites } from '../../../../../src/lib/server/core/json.ts';
import {
    gitSectionOf,
    handleGitSignIn
} from '../../../../../src/lib/server/accounts/connect/git/routes.ts';
import { scratchDir } from '../../../../fixtures/scratch.ts';

/** A request of the route, with the page's token when `token` is given. */
function request(body: unknown, token?: string): Request {
    return new Request('http://127.0.0.1:8791/api/connect/git', {
        method: 'POST',
        headers: {
            origin: 'http://127.0.0.1:8791',
            host: '127.0.0.1:8791',
            ...(token === undefined ? {} : { 'x-oculus-token': token })
        },
        body: JSON.stringify(body)
    });
}

describe('the git sign-in route', () => {
    it.each([
        ['where the Sign ins stand', { action: 'status' }],
        ['the client id', { action: 'client_id', key: 'github', client_id: 'Iv1.abc' }],
        ['Sign in', { action: 'sign_in', key: 'github' }],
        ['Cancel', { action: 'cancel', key: 'github' }],
        ['Sign out', { action: 'sign_out', key: 'github' }]
    ])(
        'refuses %s without the token and with a wrong one, before it reads or writes anything (G1)',
        async (_name, body) => {
            const section = vi.fn(() => {
                throw new Error('read before the token');
            });
            const signIns = { start: vi.fn(), flow: vi.fn(), cancel: vi.fn(), close: vi.fn() };
            const writes = fsWrites();
            const chain = writes.chain;
            const target = { token: 'token', section, signIns, writes };
            for (const token of [undefined, 'wrong']) {
                const answer = await handleGitSignIn(request(body, token), target);
                expect(answer.status).toBe(403);
            }
            expect(section).not.toHaveBeenCalled();
            for (const called of Object.values(signIns)) expect(called).not.toHaveBeenCalled();
            expect(writes.chain).toBe(chain);
        }
    );
});

/** A providers' folder holding a signed-in `git-github.json` granted for `https://github.com`. */
function signedInFolder(): string {
    const dir = join(scratchDir('oculus-git-routes-'), 'connect');
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const held = {
        client_id: 'Iv1.abc',
        token: 'gho_the_token',
        login: 'reader',
        credential_address: 'https://github.com'
    };
    writeFileSync(join(dir, 'git-github.json'), JSON.stringify(held), { mode: 0o600 });
    return dir;
}

/** The route's target over the shipped config with `sign_in` set to `rows`. */
function targetOver(dir: string, rows: unknown[]) {
    const config = { ...loadConfig(engineDir()).config, sign_in: rows };
    const signIns = { start: vi.fn(), flow: vi.fn(() => null), cancel: vi.fn(), close: vi.fn() };
    return {
        token: 'token',
        section: () => gitSectionOf(config, dir, engineDir()),
        signIns,
        writes: fsWrites()
    };
}

describe('a saved token no git host row names', () => {
    it.each([
        ['with no row of its key', []],
        [
            'whose row names no credential address',
            [
                {
                    key: 'github',
                    name: 'GitHub',
                    token: 'https://github.com/login/oauth/access_token'
                }
            ]
        ]
    ])(
        'is listed %s with its login and Sign out, and Sign out deletes its file (G135)',
        async (_name, rows) => {
            const dir = signedInFolder();
            const target = targetOver(dir, rows);
            const status = (await (
                await handleGitSignIn(request({ action: 'status' }, 'token'), target)
            ).json()) as GitHosts;
            expect(status.hosts).toEqual([]);
            expect(status.unlisted).toHaveLength(1);
            expect(status.unlisted[0]).toMatchObject({ key: 'github', login: 'reader' });
            expect(status.unlisted[0].missing).toContain('github');
            expect(JSON.stringify(status)).not.toContain('gho_the_token');
            const out = await handleGitSignIn(
                request({ action: 'sign_out', key: 'github' }, 'token'),
                target
            );
            expect(await out.json()).toEqual({ ok: true });
            expect(existsSync(join(dir, 'git-github.json'))).toBe(false);
        }
    );

    it('is listed when its row names another address, and Sign out takes the token out (G135)', async () => {
        const dir = signedInFolder();
        const target = targetOver(dir, [
            { key: 'github', name: 'GitHub', credential_address: 'https://github.example.org' }
        ]);
        const status = (await (
            await handleGitSignIn(request({ action: 'status' }, 'token'), target)
        ).json()) as GitHosts;
        expect(status.hosts.map((host) => [host.key, host.login])).toEqual([['github', '']]);
        expect(status.unlisted.map((one) => one.key)).toEqual(['github']);
        await handleGitSignIn(request({ action: 'sign_out', key: 'github' }, 'token'), target);
        const left: unknown = JSON.parse(readFileSync(join(dir, 'git-github.json'), 'utf8'));
        expect(left).toEqual({ client_id: 'Iv1.abc' });
    });

    it('refuses Sign out of a key with no row and no file, and writes nothing (G135)', async () => {
        const dir = join(scratchDir('oculus-git-routes-'), 'connect');
        const target = targetOver(dir, []);
        const out = await handleGitSignIn(
            request({ action: 'sign_out', key: 'github' }, 'token'),
            target
        );
        expect(Object.keys((await out.json()) as Record<string, unknown>)).toEqual(['refused']);
        expect(existsSync(dir)).toBe(false);
    });
});
