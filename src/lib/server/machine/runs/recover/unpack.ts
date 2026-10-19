// Layer 2, server. Unpack: 7z-wasm 1.2.0 (7-Zip in WebAssembly) run by Node in a process of its
// own, the archive's folder and a work folder mounted through NODEFS, then every path the archive
// holds moved into the archive's folder with the source's `strip` leading folders dropped.
//
// The program is one CommonJS text (`UNPACK_PROGRAM`): this Mac runs it with `node -e`, and the
// cluster's check job runs it from `~/.oculus/recover/jobs/unpack.cjs` under the Node the job
// unpacked. It takes five arguments, each one argument of the vector: the 7z-wasm folder, the
// archive, the work folder, the target folder and the count of folders to strip. A `.tar.gz`,
// `.tgz`, `.tar.bz2` or `.tar.xz` is opened in two passes, the compressed layer and then the tar.
// The program keeps 7-Zip from setting a mode of 0 on what a tar holds (the package's own command
// line does the same), moves with a copy when the work folder is on another disk, and removes the
// work folder when it ends.

import { spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';

/** The program a child runs: arguments are the 7z-wasm folder, archive, work, target and strip. */
export const UNPACK_PROGRAM = String.raw`'use strict';
const fs = require('fs');
const path = require('path');
const [pkg, archive, work, target, stripText] = process.argv.slice(-5);
const strip = Number(stripText);
const say = (line) => process.stdout.write(line + '\n');
const TWO_PASS = /\.(tar\.gz|tgz|tar\.bz2|tar\.xz)$/i;

async function extract(file, out) {
    const SevenZip = require(path.join(pkg, '7zz.umd.js'));
    let code = 0;
    const seven = await SevenZip({ quit: (status) => { code = status; }, print: say, printErr: say });
    const chmod = seven.FS.chmod;
    seven.FS.chmod = (where, mode, follow) => { if (mode) chmod(where, mode, follow); };
    seven.FS.mkdir('/a');
    seven.FS.mkdir('/o');
    seven.FS.mount(seven.NODEFS, { root: path.dirname(file) }, '/a');
    fs.mkdirSync(out, { recursive: true });
    seven.FS.mount(seven.NODEFS, { root: out }, '/o');
    try {
        seven.callMain(['x', '/a/' + path.basename(file), '-o/o', '-y', '-bd']);
    } catch (error) {
        code = error && typeof error.status === 'number' ? error.status : 2;
    }
    if (code !== 0) throw new Error('7-Zip ended with code ' + code + ' on ' + path.basename(file));
}

function move(from, to) {
    if (fs.existsSync(to) && fs.statSync(to).isDirectory() && fs.statSync(from).isDirectory()) {
        for (const name of fs.readdirSync(from)) move(path.join(from, name), path.join(to, name));
        fs.rmdirSync(from);
        return;
    }
    fs.rmSync(to, { recursive: true, force: true });
    try {
        fs.renameSync(from, to);
    } catch (error) {
        if (error.code !== 'EXDEV') throw error;
        fs.cpSync(from, to, { recursive: true });
        fs.rmSync(from, { recursive: true, force: true });
    }
}

function place(from, depth) {
    for (const name of fs.readdirSync(from)) {
        const full = path.join(from, name);
        if (depth < strip) {
            if (fs.statSync(full).isDirectory()) place(full, depth + 1);
            else say('skipped ' + path.relative(path.join(work, 'out'), full));
        } else {
            move(full, path.join(target, name));
        }
    }
}

(async () => {
    fs.rmSync(work, { recursive: true, force: true });
    try {
        let file = archive;
        if (TWO_PASS.test(archive)) {
            await extract(archive, path.join(work, 'pass'));
            const inner = fs.readdirSync(path.join(work, 'pass'));
            if (inner.length !== 1) throw new Error('the compressed layer holds ' + inner.length + ' files');
            file = path.join(work, 'pass', inner[0]);
        }
        await extract(file, path.join(work, 'out'));
        place(path.join(work, 'out'), 0);
        say('unpacked ' + path.basename(archive));
    } finally {
        fs.rmSync(work, { recursive: true, force: true });
    }
})().catch((error) => {
    say('unpack failed: ' + error.message);
    process.exitCode = 1;
});
`;

/** The folder of this server's 7z-wasm package, which the program and the cluster copy read. */
export function sevenZipFolder(): string {
    return dirname(createRequire(import.meta.url).resolve('7z-wasm/package.json'));
}

/** The files of the 7z-wasm folder the program needs, copied to the cluster as they are. */
export const SEVEN_ZIP_FILES = [
    '7zz.umd.js',
    '7zz.wasm',
    'package.json',
    'License.txt',
    'unRarLicense.txt'
];

/** What one unpack is given: the archive, its work folder, its target folder and the strip. */
export type UnpackInput = { archive: string; work: string; target: string; strip: number };

/** The argument vector of one unpack on this Mac: the program and its five arguments. */
export function unpackVector(input: UnpackInput, sevenZip: string = sevenZipFolder()): string[] {
    return [
        '-e',
        UNPACK_PROGRAM,
        sevenZip,
        input.archive,
        input.work,
        input.target,
        String(input.strip)
    ];
}

/** Starts the unpack child: oculus's own Node, run as Node, with a vector and no shell. */
export type UnpackStart = (vector: string[]) => ChildProcess;

export const startUnpack: UnpackStart = (vector) =>
    spawn(process.execPath, vector, {
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
        stdio: ['ignore', 'pipe', 'pipe']
    });
