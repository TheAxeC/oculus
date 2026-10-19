// Layer 2, route tests. What GET /api/fs, with no root, tells the Settings view of the machine's
// `local.yml`: the names of the keys the primary hub's file sets and the default of each key. The
// primary's file sets `port` and `claude_bin`. A workspace with no primary names no key as set. A
// file holding a literature key and `downloads` rows of physionet, kaggle and kaggle-token gives an
// answer holding none of their secrets, each row's secret drawn as the word for set.
//
// What this does NOT cover: how the Settings view draws the lines (tests/state/system/settings/).

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    DEFAULT_PORT,
    engineDir,
    loadConfig,
    localDefaults,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { readMachine } from '../../../src/lib/data/sources/config/machine.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { handleFs, ignoredCache, type FsTarget } from '../../../src/lib/server/files/fs.ts';
import { machineDefaults } from '../../../src/lib/server/root/process/context/machine-defaults.ts';
import { machineValues } from '../../../src/lib/server/root/process/context/machine-values.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { plantHub, workspaceWith } from '../../fixtures/hubs/workspace.ts';

const PORT = '8811';
const CLAUDE = 'claude-binary-of-the-test-xyz';
const TEXT = textCatalog(loadConfig(engineDir()).config);

/** A hub whose `.oculus/local.yml` sets two keys, and the answer of the route over a workspace. */
async function answered(primary: boolean) {
    const hub = plantHub(scratchDir('oculus-machine-answer-'));
    writeFileSync(join(hub, '.oculus', 'local.yml'), `port: ${PORT}\nclaude_bin: ${CLAUDE}\n`);
    const workspace = workspaceWith([{ name: 'lab', dir: hub }], primary ? 'lab' : undefined);
    const open = workspace.open();
    const read = readMachine(open.hubs, open.primary);
    const defaults = machineDefaults(TEXT);
    const target: FsTarget = {
        engine: engineDir(),
        workspace,
        machine: { set: read.set, defaults, values: {}, hubs: {}, portRefused: null },
        bookmarks: null,
        writes: fsWrites(),
        ignored: ignoredCache()
    };
    const response = await handleFs(new Request('http://localhost/api/fs'), target);
    return { text: await response.text() };
}

describe('GET /api/fs with no root', () => {
    it('names the keys the primary sets and the default of each key', async () => {
        const { text } = await answered(true);
        const body = JSON.parse(text) as {
            machine: { set: string[]; defaults: Record<string, string> };
        };
        expect(body.machine.set).toEqual(['port', 'claude_bin']);
        expect(body.machine.defaults.port).toBe(String(DEFAULT_PORT));
        expect(body.machine.defaults.claude_bin).toBe(localDefaults().claudeBin);
        expect(body.machine.defaults.hpc_host).toBe(words(TEXT, 'server.machine_default.hpc_host'));
    });

    it('names no key as set when the workspace has no primary', async () => {
        const { text } = await answered(false);
        const body = JSON.parse(text) as { machine: { set: string[] } };
        expect(body.machine.set).toEqual([]);
        expect(text).not.toContain(CLAUDE);
    });
});

/** The secrets and the contact address of the file of the secrets row. */
const WOS = 'wos-key-of-the-test-xyz';
const PASSWORD = 'physionet-password-of-the-test-xyz';
const KAGGLE_KEY = 'kaggle-key-of-the-test-xyz';
const KAGGLE_TOKEN = 'kaggle-token-of-the-test-xyz';
const MAILTO = 'reader@example.org';

/** The route's answer over a primary hub whose file holds a literature key and downloads rows. */
async function answeredSecrets(): Promise<string> {
    const hub = plantHub(scratchDir('oculus-machine-secrets-'));
    writeFileSync(
        join(hub, '.oculus', 'local.yml'),
        [
            'literature:',
            `  wos_key: ${WOS}`,
            `  mailto: ${MAILTO}`,
            'downloads:',
            `  - { service: physionet, user: reader, secret: ${PASSWORD} }`,
            `  - { service: kaggle, user: kaggler, secret: ${KAGGLE_KEY} }`,
            `  - { service: kaggle-token, secret: ${KAGGLE_TOKEN} }`,
            ''
        ].join('\n')
    );
    const workspace = workspaceWith([{ name: 'lab', dir: hub }], 'lab');
    const open = workspace.open();
    const read = readMachine(open.hubs, open.primary);
    const defaults = machineDefaults(TEXT);
    const hidden = words(TEXT, 'server.machine_default.secret_set');
    const target: FsTarget = {
        engine: engineDir(),
        workspace,
        machine: {
            set: read.set,
            defaults,
            ...machineValues(read.config, DEFAULT_PORT, read.set, defaults, read.lists, hidden),
            portRefused: null
        },
        bookmarks: null,
        writes: fsWrites(),
        ignored: ignoredCache()
    };
    const response = await handleFs(new Request('http://localhost/api/fs'), target);
    return response.text();
}

describe('GET /api/fs with secrets in the primary hub file', () => {
    it('sends the word for set in place of each secret, and the contact address as written', async () => {
        const text = await answeredSecrets();
        const body = JSON.parse(text) as { machine: { values: Record<string, string> } };
        const hidden = words(TEXT, 'server.machine_default.secret_set');
        expect(text).not.toContain(WOS);
        for (const secret of [PASSWORD, KAGGLE_KEY, KAGGLE_TOKEN]) {
            expect(text).not.toContain(secret);
        }
        expect(body.machine.values['literature.wos_key']).toBe(hidden);
        expect(body.machine.values['literature.mailto']).toBe(MAILTO);
        expect(body.machine.values.downloads).toBe(
            [
                `{ service: physionet, user: reader, secret: ${hidden} }`,
                `{ service: kaggle, user: kaggler, secret: ${hidden} }`,
                `{ service: kaggle-token, secret: ${hidden} }`
            ].join('\n')
        );
    });
});
