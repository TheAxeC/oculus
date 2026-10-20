// Layer 2, server. Unpack: 7z-wasm 1.2.0 (7-Zip in WebAssembly) run by Node in a process of its
// own, the archive's folder and a work folder mounted through NODEFS, then the archive's contents
// moved into the archive's folder: every path the archive holds, or, when the source names a
// `folder`, only the paths inside that folder, with `strip` leading folders dropped, counted below
// the folder. So an archive that holds a training and a validation set gives the dataset only the
// one its source names.
//
// The program is one CommonJS text (`UNPACK_PROGRAM`): this Mac runs it with `node -e`, and the
// cluster's check job runs it from `~/.oculus/recover/jobs/unpack.cjs` under the Node the job
// unpacked. It takes six arguments, each one argument of the vector: the 7z-wasm folder, the
// archive, the work folder, the target folder, the count of folders to strip and the folder inside
// the archive (empty when the source names none). A `.tar.gz`, `.tgz`, `.tar.bz2` or `.tar.xz` is
// opened in two passes, the compressed layer and then the tar, and the folder is taken from the
// tar. The program keeps 7-Zip from setting a mode of 0 on what a tar holds (the package's own
// command line does the same), moves with a copy when the work folder is on another disk, and
// removes the work folder, with the rest of the archive, when it ends.
//
// 7-Zip's status is the value `callMain` returns (7z-wasm also writes it to the process's exit
// code, which the program sets back to 0). A status of 2 or above fails that archive with a line
// naming the status, and nothing of it is placed; a status of 1, a warning, is said as 7-Zip's
// own lines, each after `7-Zip warned: `, then the line `7-Zip warned (code 1) on <archive>`, and
// the archive is placed. Each pass of a two-pass archive is read the same way, and every line names
// the archive, never the tar inside it.
//
// The folder is found one part at a time by its exact name among the entries of the folder above,
// so a disk that ignores letter case (this Mac's) and one that does not (the cluster's) give one
// answer, and each part must be a folder and no link, so the folder cannot lead out of the work
// folder; its real path is checked to be inside the work folder's as well. A folder argument that
// is absolute or holds a backslash or an empty, `.` or `..` part is refused before 7-Zip runs. A
// folder the archive does not hold, or holds empty, fails the unpack of that archive with a line
// naming it, and nothing is moved. Below the starting folder the walk reads each entry with
// `lstat`, so a link the archive holds is moved as a link, a copy across disks included, and never
// followed.

import { spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';

/**
 * The program a child runs: arguments are the 7z-wasm folder, archive, work, target, strip and the
 * folder inside the archive.
 */
export const UNPACK_PROGRAM = String.raw`'use strict';
const fs = require('fs');
const path = require('path');
const [pkg, archive, work, target, stripText, folder] = process.argv.slice(-6);
const strip = Number(stripText);
const say = (line) => process.stdout.write(line + '\n');
const TWO_PASS = /\.(tar\.gz|tgz|tar\.bz2|tar\.xz)$/i;
const MISSING = 'the archive holds no folder ' + folder;

function partsOf(text) {
    if (text === '') return [];
    const parts = text.split('/');
    if (text.includes('\\') || parts.some((part) => part === '' || part === '.' || part === '..')) {
        return null;
    }
    return parts;
}

function found(out, parts) {
    let at = out;
    for (const part of parts) {
        if (!fs.readdirSync(at).includes(part)) return null;
        at = path.join(at, part);
        if (!fs.lstatSync(at).isDirectory()) return null;
    }
    const root = fs.realpathSync(out);
    const real = fs.realpathSync(at);
    return real === root || real.startsWith(root + path.sep) ? at : null;
}

async function extract(file, out) {
    const SevenZip = require(path.join(pkg, '7zz.umd.js'));
    const printed = [];
    const keep = (line) => printed.push(line);
    const seven = await SevenZip({ print: keep, printErr: keep });
    const chmod = seven.FS.chmod;
    seven.FS.chmod = (where, mode, follow) => { if (mode) chmod(where, mode, follow); };
    seven.FS.mkdir('/a');
    seven.FS.mkdir('/o');
    seven.FS.mount(seven.NODEFS, { root: path.dirname(file) }, '/a');
    fs.mkdirSync(out, { recursive: true });
    seven.FS.mount(seven.NODEFS, { root: out }, '/o');
    let code;
    try {
        code = seven.callMain(['x', '/a/' + path.basename(file), '-o/o', '-y', '-bd']);
    } catch (error) {
        code = error && typeof error.status === 'number' ? error.status : 2;
    }
    process.exitCode = 0;
    const name = path.basename(archive);
    if (code === 1) {
        for (const line of printed) say('7-Zip warned: ' + line);
        say('7-Zip warned (code 1) on ' + name);
        return;
    }
    for (const line of printed) say(line);
    if (code !== 0) throw new Error('7-Zip ended with code ' + code + ' on ' + name);
}

function folderAt(where) {
    const held = fs.lstatSync(where, { throwIfNoEntry: false });
    return held !== undefined && held.isDirectory();
}

function move(from, to) {
    if (folderAt(to) && folderAt(from)) {
        for (const name of fs.readdirSync(from)) move(path.join(from, name), path.join(to, name));
        fs.rmdirSync(from);
        return;
    }
    fs.rmSync(to, { recursive: true, force: true });
    try {
        fs.renameSync(from, to);
    } catch (error) {
        if (error.code !== 'EXDEV') throw error;
        fs.cpSync(from, to, { recursive: true, verbatimSymlinks: true });
        fs.rmSync(from, { recursive: true, force: true });
    }
}

function place(from, depth) {
    for (const name of fs.readdirSync(from)) {
        const full = path.join(from, name);
        if (depth < strip) {
            if (folderAt(full)) place(full, depth + 1);
            else say('skipped ' + path.relative(path.join(work, 'out'), full));
        } else {
            move(full, path.join(target, name));
        }
    }
}

(async () => {
    fs.rmSync(work, { recursive: true, force: true });
    try {
        const parts = partsOf(folder);
        if (parts === null) throw new Error(MISSING);
        let file = archive;
        if (TWO_PASS.test(archive)) {
            await extract(archive, path.join(work, 'pass'));
            const inner = fs.readdirSync(path.join(work, 'pass'));
            if (inner.length !== 1) throw new Error('the compressed layer holds ' + inner.length + ' files');
            file = path.join(work, 'pass', inner[0]);
        }
        const out = path.join(work, 'out');
        await extract(file, out);
        const start = found(out, parts);
        if (start === null) throw new Error(MISSING);
        if (parts.length > 0 && fs.readdirSync(start).length === 0) {
            throw new Error('the folder ' + folder + ' in the archive is empty');
        }
        place(start, 0);
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

/**
 * What one unpack is given: the archive, its work folder, its target folder, the strip and the
 * folder inside the archive, empty when the source names none.
 */
export type UnpackInput = {
    archive: string;
    work: string;
    target: string;
    strip: number;
    folder: string;
};

/** The argument vector of one unpack on this Mac: the program and its six arguments. */
export function unpackVector(input: UnpackInput, sevenZip: string = sevenZipFolder()): string[] {
    return [
        '-e',
        UNPACK_PROGRAM,
        sevenZip,
        input.archive,
        input.work,
        input.target,
        String(input.strip),
        input.folder
    ];
}

/** Starts the unpack child: oculus's own Node, run as Node, with a vector and no shell. */
export type UnpackStart = (vector: string[]) => ChildProcess;

export const startUnpack: UnpackStart = (vector) =>
    spawn(process.execPath, vector, {
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
        stdio: ['ignore', 'pipe', 'pipe']
    });
