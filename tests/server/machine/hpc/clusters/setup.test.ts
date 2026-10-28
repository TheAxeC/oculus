// Layer 4, server test. The one POST of Account setup's cluster section and of Settings' clusters
// rows (`handleClusterSetup`): every action refused without the page's token, before any source is
// read, any program is started or any row is written; and a password holding a line break refused
// before the password helper or an ssh starts, the password in no answer; and the read answering,
// for a cluster whose row's key file has a `.pub` beside it, that public key, with no password, no
// ssh login and no line of the private key.

import { describe, expect, vi } from 'vitest';
import { HUB_FILE } from '../../../../../src/lib/data/helpers/hub-names.ts';
import { engineDir, loadConfig } from '../../../../../src/lib/data/sources/config.ts';
import { Hub } from '../../../../../src/lib/server/core/channels.ts';
import { fsWrites } from '../../../../../src/lib/server/core/json.ts';
import { handleClusterSetup } from '../../../../../src/lib/server/machine/hpc/clusters/setup.ts';
import { it, plantScratch } from '../../../../fixtures/scratch.ts';

/** A request of the route, with the page's token when `token` is given. */
function request(body: unknown, token?: string): Request {
    return new Request('http://127.0.0.1:8791/api/clusters', {
        method: 'POST',
        headers: {
            origin: 'http://127.0.0.1:8791',
            host: '127.0.0.1:8791',
            ...(token === undefined ? {} : { 'x-oculus-token': token })
        },
        body: JSON.stringify(body)
    });
}

describe('the cluster setup route', () => {
    it.each([
        ['the resolution', { action: 'read' }],
        ['Make key', { action: 'make_key', resource: 'a', keyFile: '~/.ssh/k' }],
        ["the host's key", { action: 'host_key', resource: 'a' }],
        ["trusting the host's key", { action: 'trust_host', resource: 'a', fingerprints: ['x'] }],
        [
            'Put the key',
            { action: 'put_key', resource: 'a', user: 'me', keyFile: '~/.ssh/k', password: 'pw' }
        ],
        ['Save', { action: 'save', resource: 'a', user: 'me', keyFile: '' }],
        ['Remove', { action: 'remove', resource: 'a' }]
    ])(
        'refuses %s without the token and with a wrong one, before it reads or runs anything (G1)',
        async (_name, body) => {
            const read = vi.fn(() => {
                throw new Error('read before the token');
            });
            const run = vi.fn();
            const resolve = vi.fn();
            const putRun = vi.fn();
            const askpass = vi.fn();
            const writeRow = vi.fn();
            const target = {
                token: 'token',
                writeRow,
                sources: { hub: {} as Hub, primary: 'hub', config: read, accounts: read },
                hubDir: read,
                writes: fsWrites(),
                home: '/nowhere',
                run,
                resolve,
                put: { run: putRun, askpass }
            };
            for (const token of [undefined, 'wrong']) {
                const answer = await handleClusterSetup(request(body, token), target);
                expect(answer.status).toBe(403);
            }
            for (const called of [read, run, resolve, putRun, askpass, writeRow]) {
                expect(called).not.toHaveBeenCalled();
            }
        }
    );
});

/** A hub whose `slurm.resource` names `utwente`, and the registry entry of that cluster. */
function utwenteHub(files: Record<string, string> = {}): { hub: Hub; dir: string } {
    const hub = new Hub();
    hub.publish('portfolio', {
        entities: {
            resources: {
                'lab:utwente': {
                    id: 'lab:utwente',
                    root: 'lab',
                    name: 'UT',
                    kind: 'cluster',
                    host: 'cluster.example.org',
                    links: [],
                    order: 0
                }
            }
        }
    });
    const dir = plantScratch('oculus-cluster-setup-', {
        [HUB_FILE]: 'slurm:\n  resource: [utwente]\n',
        ...files
    });
    return { hub, dir };
}

describe('the public key of a cluster', () => {
    const PUBLIC = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOfthecase oculus-utwente';
    const PRIVATE = '-----BEGIN OPENSSH PRIVATE KEY-----\nthe private half\n';

    it.each([
        ['with its .pub beside it', true, PUBLIC],
        ['with no .pub beside it', false, '']
    ])(
        'is read for the key file of the row %s, with no password and no ssh login (G135)',
        async (_name, withPublic, expected) => {
            const { hub, dir } = utwenteHub({
                'keys/oculus-utwente': PRIVATE,
                ...(withPublic ? { 'keys/oculus-utwente.pub': `${PUBLIC}\n` } : {})
            });
            const keyFile = `${dir}/keys/oculus-utwente`;
            const config = loadConfig(engineDir(), { hub: dir }).config;
            const run = vi.fn();
            const resolve = vi.fn(() => Promise.resolve({ ok: false, stdout: '', stderr: 'none' }));
            const putRun = vi.fn();
            const askpass = vi.fn();
            const target = {
                token: 'token',
                writeRow: vi.fn(),
                sources: {
                    hub,
                    primary: 'lab',
                    config: () => config,
                    accounts: () => [{ resource: 'utwente', user: 'me', keyFile }]
                },
                hubDir: () => dir,
                writes: fsWrites(),
                home: dir,
                run,
                resolve,
                put: { run: putRun, askpass }
            };
            const answer = await handleClusterSetup(request({ action: 'read' }, 'token'), target);
            const said = await answer.text();
            const read = JSON.parse(said) as { clusters: { keyFile: string; publicKey: string }[] };
            console.info(`the read of utwente: ${JSON.stringify(read.clusters[0])}`);
            expect(read.clusters[0].keyFile).toBe(keyFile);
            expect(read.clusters[0].publicKey).toBe(expected);
            expect(said).not.toContain('PRIVATE KEY');
            for (const called of [run, putRun, askpass]) expect(called).not.toHaveBeenCalled();
        }
    );
});

describe('the password of Put the key', () => {
    it('is refused when it holds a line break, before the helper or an ssh starts, and is in no answer (G135)', async () => {
        const { hub, dir } = utwenteHub();
        const config = loadConfig(engineDir(), { hub: dir }).config;
        const run = vi.fn();
        const resolve = vi.fn();
        const putRun = vi.fn();
        const askpass = vi.fn();
        const target = {
            token: 'token',
            writeRow: vi.fn(),
            sources: { hub, primary: 'lab', config: () => config, accounts: () => [] },
            hubDir: () => dir,
            writes: fsWrites(),
            home: dir,
            run,
            resolve,
            put: { run: putRun, askpass }
        };
        for (const password of ['secret\nmore', 'secret\r']) {
            const body = {
                action: 'put_key',
                resource: 'utwente',
                user: 'me',
                keyFile: '~/.ssh/k',
                password
            };
            const answer = await handleClusterSetup(request(body, 'token'), target);
            const said = await answer.text();
            expect(JSON.parse(said)).toEqual({
                refused: 'A password holding a line break is not sent.'
            });
            expect(said).not.toContain('secret');
        }
        for (const called of [run, resolve, putRun, askpass]) expect(called).not.toHaveBeenCalled();
    });
});
