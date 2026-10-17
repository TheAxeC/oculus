// Layer 2, route tests. The command line the platform's opener runs and the floor under it, read
// as a rule: no case runs `open`, `xdg-open` or `wslview`, and the opener cases run a stand-in for
// node's execFile that records the program and its arguments.

import { chmodSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { openPlatform } from '../../../src/lib/data/places/platform.ts';
import {
    machineOpener,
    openable,
    openArgs,
    pathOpener,
    type ExecFile
} from '../../../src/lib/server/files/open.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** A scratch folder by its real path, the form the opener's floor takes a path in. */
const realScratch = (prefix: string): string => realpathSync(scratchDir(prefix));

/** An execFile that records each call and answers as the program would, never running one. */
function recording(missing = false) {
    const calls: string[][] = [];
    const exec: ExecFile = (binary, args, done) => {
        calls.push([binary, ...args]);
        if (missing)
            done(Object.assign(new Error(`spawn ${binary} ENOENT`), { code: 'ENOENT' }), '', '');
        else done(null, '', '');
    };
    return { calls, exec };
}

/** A FinderInfo reader that records each path it is asked for, and finds no attribute. */
function finderReads() {
    const asked: string[] = [];
    return { asked, reader: (path: string) => (asked.push(path), Promise.resolve(null)) };
}

describe('what macOS open is run with and the floor under it', () => {
    // The rule and the argument list are read here, never the opener itself: a call that passed
    // would launch an application.
    it('names the application for a file and reveals a folder, the path last', () => {
        expect(
            openArgs({ kind: 'file', path: '/hub/report.docx', app: 'com.microsoft.Word' })
        ).toEqual(['/usr/bin/open', '-b', 'com.microsoft.Word', '/hub/report.docx']);
        expect(openArgs({ kind: 'folder', path: '/hub/projects' })).toEqual([
            '/usr/bin/open',
            '-R',
            '/hub/projects'
        ]);
    });
});

describe('what the opener of Linux and of WSL2 is run with', () => {
    it('opens a file and a folder with xdg-open and a reveal at its holding folder, the path one argument', () => {
        const file = { kind: 'file' as const, path: '/hub/my report.docx', app: 'com.x' };
        expect(openArgs(file, 'linux')).toEqual(['xdg-open', '/hub/my report.docx']);
        expect(openArgs({ kind: 'folder', path: '/hub/projects' }, 'linux')).toEqual([
            'xdg-open',
            '/hub/projects'
        ]);
        expect(openArgs({ kind: 'reveal', path: '/hub/projects/a.md' }, 'linux')).toEqual([
            'xdg-open',
            '/hub/projects'
        ]);
        expect(openArgs(file, 'wsl')).toEqual(['wslview', '/hub/my report.docx']);
    });

    it('tells WSL2 from /proc/version naming Microsoft, and has no opener on Windows itself', () => {
        const wsl = () => 'Linux version 5.15.153.1-microsoft-standard-WSL2 (root@1) (gcc)';
        const plain = () => 'Linux version 6.8.0-45-generic (buildd@lcy02-amd64-075)';
        expect(openPlatform('linux', wsl)).toBe('wsl');
        expect(openPlatform('linux', plain)).toBe('linux');
        expect(openPlatform('darwin', wsl)).toBe('darwin');
        expect(openPlatform('win32', plain)).toBeNull();
    });

    it('refuses a launcher and a file with an execute bit, and reads no Finder attribute on Linux', async () => {
        const dir = realScratch('oculus-open-linux-');
        const paper = join(dir, 'paper.pdf');
        const launcher = join(dir, 'tool.desktop');
        const script = join(dir, 'run.pdf');
        for (const path of [paper, launcher, script]) writeFileSync(path, 'x');
        chmodSync(script, 0o755);
        const { asked, reader } = finderReads();
        const file = (path: string) => ({ kind: 'file' as const, path, app: 'com.apple.Preview' });
        expect(await openable(file(paper), reader, 'linux')).toBe(true);
        expect(await openable(file(launcher), reader, 'linux')).toBe(false);
        expect(await openable(file(script), reader, 'linux')).toBe(false);
        expect(asked).toEqual([]);
    });

    it('runs xdg-open with the path, and refuses naming the program when it is not installed', async () => {
        const dir = realScratch('oculus-open-run-');
        const paper = join(dir, 'paper.pdf');
        writeFileSync(paper, 'x');
        const ran = recording();
        await pathOpener('linux', ran.exec)({ kind: 'file', path: paper, app: 'com.x' });
        expect(ran.calls).toEqual([['xdg-open', paper]]);
        const gone = recording(true);
        await expect(pathOpener('linux', gone.exec)({ kind: 'folder', path: dir })).rejects.toThrow(
            'the program xdg-open is not installed on this machine'
        );
        await expect(pathOpener(null, gone.exec)({ kind: 'folder', path: dir })).rejects.toThrow(
            'this platform has no program that opens files'
        );
    });

    it('hands an https address to xdg-open and to wslview as one argument, and nothing else', async () => {
        const ran = recording();
        await machineOpener({ openBin: 'xdg-open' }, ran.exec)('https://example.org/a b');
        await machineOpener({ openBin: 'wslview' }, ran.exec)('https://example.org/c');
        const xdg = machineOpener({ openBin: 'xdg-open' }, ran.exec);
        await expect(xdg('file:///etc/passwd')).rejects.toThrow('open refused');
        expect(ran.calls).toEqual([
            ['xdg-open', 'https://example.org/a b'],
            ['wslview', 'https://example.org/c']
        ]);
    });
});
