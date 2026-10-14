// Layer 2, route tests. What GET /api/fs, with no root, tells the Settings view of the machine's
// `local.yml`: the names of the keys the primary hub's file sets and the default of each key. The
// primary's file sets `port` and `claude_bin`. A workspace with no primary names no key as set.
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
        machine: { set: read.set, defaults, values: {}, hubs: {} },
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
