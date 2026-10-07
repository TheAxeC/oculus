// Layer 2, server tests. The debug client's launch: how the adapter is started. The client is given
// a `spawn` that records its calls and returns a child of in-memory streams, so no process starts.
//
// What this does NOT cover: the protocol the client speaks with a running adapter, which a real
// `rite_dap` answers.

import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import { PassThrough } from 'node:stream';
import { join } from 'node:path';
import { afterEach, expect } from 'vitest';
import { it, plantScratch } from '../../../fixtures/scratch.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import { DebugClient } from '../../../../src/lib/server/machine/debug/session.ts';

/** A child whose streams are in memory. */
class FakeChild extends EventEmitter {
    pid = 4242;
    stdin = new PassThrough();
    stdout = new PassThrough();
    stderr = new PassThrough();
    kill(): boolean {
        return true;
    }
}

let client: DebugClient | null = null;

afterEach(() => {
    client?.close();
    client = null;
});

it('starts the adapter with the program as one argument and no shell', () => {
    const name = `a b;$(touch pwned)'"x.rite`;
    const folder = plantScratch('oculus-debug-', { [name]: '(print 1)\n' });
    const program = join(folder, name);
    const calls: { command: string; args: readonly string[]; options: object }[] = [];
    client = new DebugClient({
        hub: new Hub(),
        spawn: (command, args, options) => {
            calls.push({ command, args, options });
            return new FakeChild();
        },
        adapter: () => 'rite_dap',
        catalog: () => textCatalog(loadConfig(engineDir()).config)
    });

    const started = client.launch({
        repo: folder,
        name: 'run',
        program,
        cwd: folder,
        breakpoints: [],
        functions: [],
        watch: []
    });

    expect(started).toEqual({ ok: true });
    expect(calls).toEqual([{ command: 'rite_dap', args: [program], options: { cwd: folder } }]);
    expect(existsSync(join(folder, 'pwned'))).toBe(false);
});
