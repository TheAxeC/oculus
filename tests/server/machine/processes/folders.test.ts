// The working folder of each listed process, from one lsof call over exactly those pids. lsof exits
// 1 when one pid has gone but prints the others, so its answer is read whatever its exit; a failure
// to run or a timeout gives no folder at all. The call is injected for the cases over what is asked
// and answered; the cases over the real child run small shell scripts of their own under a
// temporary folder in place of lsof, and never lsof on a real pid.

import { execFileSync } from 'node:child_process';
import { chmodSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { lsofFolders } from '../../../../src/lib/server/machine/processes/folders.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

/** How `lsofFolders` runs its program, as its options name it. */
type Exec = NonNullable<NonNullable<Parameters<typeof lsofFolders>[1]>['exec']>;

const ANSWER = 'p100\nfcwd\nn/work/one\np200\nfcwd\nn/work/two words\n';

/** The folders lsof's text names, read through a call that answers it. */
async function read(text: string, pids: number[] = [5]): Promise<[number, string][]> {
    const exec = vi.fn<Exec>(() => Promise.resolve({ stdout: text, code: 0 }));
    return [...(await lsofFolders(pids, { exec }))];
}

describe('the answer of lsof', () => {
    it('reads each pid with the folder of its cwd, a folder with a space whole', async () => {
        expect(await read(ANSWER)).toEqual([
            [100, '/work/one'],
            [200, '/work/two words']
        ]);
    });

    it('gives a pid that lsof printed no name for no folder', async () => {
        expect(await read('p101\nfcwd\np200\nfcwd\nn/work/two\n')).toEqual([[200, '/work/two']]);
    });

    it('keeps the first name of a pid and ignores a name before any pid', async () => {
        expect(await read('n/orphan\np5\nn/first\nn/second\n')).toEqual([[5, '/first']]);
    });

    it('reads nothing from an empty answer', async () => {
        expect(await read('')).toEqual([]);
    });
});

describe('lsofFolders', () => {
    it('asks for the cwd of exactly the given pids, as an argument list, with a five-second limit', async () => {
        const exec = vi.fn<Exec>(() => Promise.resolve({ stdout: '', code: 0 }));
        await lsofFolders([100, 200], { exec });
        expect(exec).toHaveBeenCalledExactlyOnceWith(
            'lsof',
            ['-a', '-d', 'cwd', '-Fn', '-p', '100,200'],
            { timeout: 5000 }
        );
    });

    it('reads the answer of an lsof that exited 1 because one pid had gone', async () => {
        const exec = vi.fn<Exec>(() => Promise.resolve({ stdout: ANSWER, code: 1 }));
        const folders = await lsofFolders([100, 101, 200], { exec });
        expect([...folders]).toEqual([
            [100, '/work/one'],
            [200, '/work/two words']
        ]);
        expect(folders.get(101)).toBeUndefined();
    });

    it('asks about whole positive pids only, once each', async () => {
        const exec = vi.fn<Exec>(() => Promise.resolve({ stdout: '', code: 1 }));
        await lsofFolders([5, 5, 0, -1, 1.5, Number.NaN, 7], { exec });
        expect(exec.mock.calls[0][1]).toEqual(['-a', '-d', 'cwd', '-Fn', '-p', '5,7']);
    });

    it('runs nothing when there is no pid to ask about', async () => {
        const exec = vi.fn<Exec>(() => Promise.resolve({ stdout: ANSWER, code: 0 }));
        expect((await lsofFolders([], { exec })).size).toBe(0);
        expect((await lsofFolders([0, -3], { exec })).size).toBe(0);
        expect(exec).not.toHaveBeenCalled();
    });

    it('gives every folder empty when lsof cannot run or times out', async () => {
        const failing = vi.fn<Exec>(() => Promise.reject(new Error('spawn lsof ENOENT')));
        expect((await lsofFolders([100, 200], { exec: failing })).size).toBe(0);
        const timedOut = vi.fn<Exec>(() => Promise.reject(new Error('timed out')));
        expect((await lsofFolders([100, 200], { exec: timedOut })).size).toBe(0);
    });

    it('passes the signal on to the call it makes', async () => {
        const controller = new AbortController();
        const exec = vi.fn<Exec>(() => Promise.resolve({ stdout: '', code: 0 }));
        await lsofFolders([5], { exec, signal: controller.signal });
        expect(exec.mock.calls[0][2]).toEqual({ timeout: 5000, signal: controller.signal });
    });

    it('gives the program the time limit it is asked for', async () => {
        const exec = vi.fn<Exec>(() => Promise.resolve({ stdout: '', code: 0 }));
        await lsofFolders([5], { exec, timeoutMs: 300 });
        expect(exec.mock.calls[0][2]).toEqual({ timeout: 300 });
    });
});

/** A shell script of its own, executable, in a folder of its own. */
function script(name: string, body: string): string {
    const file = join(scratchDir('oculus-lsof-'), name);
    writeFileSync(file, `#!/bin/sh\n${body}\n`);
    chmodSync(file, 0o755);
    return file;
}

describe('the child lsofFolders runs', () => {
    it('reads the folders of a child that printed them and exited 1', async () => {
        const file = script('one', `printf 'p100\\nfcwd\\nn/a\\n'; exit 1`);
        expect([...(await lsofFolders([100], { program: file }))]).toEqual([[100, '/a']]);
    });

    it('reads the folders of a child that exited 0', async () => {
        const file = script('zero', `printf 'p5\\nn/b\\n'`);
        expect([...(await lsofFolders([5], { program: file }))]).toEqual([[5, '/b']]);
    });

    it('hands the arguments to the child as separate words, never to a shell', async () => {
        const file = script('args', `printf 'p5\\nn'; printf '%s|' "$@"; printf '\\n'`);
        const folders = await lsofFolders([5], { program: file });
        expect(folders.get(5)).toBe('-a|-d|cwd|-Fn|-p|5|');
    });

    it('gives no folder when the program does not exist', async () => {
        const missing = join(scratchDir('oculus-lsof-'), 'absent');
        expect((await lsofFolders([5], { program: missing })).size).toBe(0);
    });

    it('gives no folder for a child that runs past its time limit, which is killed', async () => {
        const file = script('slow', 'exec sleep 30');
        expect((await lsofFolders([5], { program: file, timeoutMs: 300 })).size).toBe(0);
    });

    it('kills the child when the signal is aborted, so no process of it is left', async () => {
        // The child holds the write end of a pipe the case reads: the read ends only when every
        // process holding that end is gone, so the end of the read is the child's end.
        const dir = scratchDir('oculus-lsof-');
        const ready = join(dir, 'ready');
        const held = join(dir, 'held');
        execFileSync('mkfifo', [ready, held]);
        const file = script('slow', `exec 3> '${held}'; echo up > '${ready}'; exec sleep 30`);
        const controller = new AbortController();
        const pending = lsofFolders([5], { program: file, signal: controller.signal });
        const gone = readFile(held);
        await readFile(ready);
        controller.abort();
        expect((await pending).size).toBe(0);
        await gone;
    });
});
