// Layer 2, server test. What a host leaves running when it ends (lib/server/machine/apps/host/
// process.ts and the runner's tracking of the programs it started, host/runner/tools/children.mjs):
// a language server the app started as an executable ends with its host, whether the host stops, is
// killed or is told to stop, even when the server ignores the end of its input and SIGTERM, and the
// page is told the server is gone. These are the host-end rows of G75 and G36.
//
// The host is the real runner and the server a node program that ignores SIGTERM and the close of
// its input (world/language-app.ts). Every folder is synthetic, under the system temporary
// directory. What this does NOT cover: a program the host starts with a tool other than the
// language servers (a debug adapter executable goes through the same runner module, which the
// debug suite runs), and a host that ends on a machine without process groups.
// @module-tag slow: each case starts node processes.

import { execFileSync } from 'node:child_process';
import { createReadStream, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { it, scratchDir } from '../../../../../fixtures/scratch.ts';
import { languageApp, languageWorld, type Payload } from '../../world/language-app.ts';

const ready = (payload: Payload) => payload.oculus === 'state' && payload.state === 'ready';

/** Whether a process with this pid is running. */
function alive(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

/**
 * A named pipe the server holds open for writing: the read side ends when the server has ended,
 * which is the signal a process that is no child of the test gives.
 */
function lifeline(): { path: string; ended: Promise<void> } {
    const path = join(scratchDir('oculus-life-'), 'life');
    execFileSync('mkfifo', [path]);
    const reader = createReadStream(path);
    const ended = new Promise<void>((resolve) => reader.on('close', () => resolve()));
    reader.resume();
    return { path, ended };
}

/** A world with a stubborn server running for the app `one`; its pid and host row. */
async function running() {
    const log = join(scratchDir('oculus-end-'), 'one.jsonl');
    const life = lifeline();
    const l = languageWorld({
        one: languageApp(
            'one',
            { capabilities: { hoverProvider: true }, stubborn: true, lifeline: life.path },
            log
        )
    });
    await l.w.hosts.tab('app:one');
    l.open('lsp:notes', 'a.note');
    await l.until(ready);
    const pid = Number(readFileSync(`${log}.pid`, 'utf8'));
    const host = l.w.hosts.rows().find((one) => one.app === 'app:one');
    return { l, pid, host: host?.pid ?? 0, ended: life.ended };
}

describe('the programs a host started', () => {
    it('end when the host stops, though the program ignores SIGTERM and the close of its input', async () => {
        const { l, pid, ended } = await running();
        const before = alive(pid);
        await l.w.hosts.stop('app:one');
        await ended;
        const after = !alive(pid);
        await l.close();
        expect([before, after]).toEqual([true, true]);
    }, 30000);

    it('end when the host is killed, and the page is told the server is gone', async () => {
        const { l, pid, host, ended } = await running();
        process.kill(host, 'SIGKILL');
        await l.w.ended('app:one');
        await ended;
        const after = !alive(pid);
        const told = l.page.frames.some(
            (one) => one.payload.oculus === 'state' && one.payload.state !== 'ready'
        );
        await l.close();
        expect([host > 0, after, told]).toEqual([true, true, true]);
    }, 30000);
});
