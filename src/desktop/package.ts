// Layer 2, server (the desktop host). `npm run app:package`: builds the app with
// @electron/packager for the platform it runs on. The app is a stub: a package.json and a main.cjs
// that imports this checkout's src/desktop/main.ts by its absolute path, written when the app is
// packaged, so the app runs the checkout's code and is packaged again only when Electron's version
// changes. `npm run app:release` (src/desktop/release.ts) makes the app that runs on its own.
//
// On macOS the icon is assets/app-icon.png made into an .icns with sips and iconutil, the bundle
// is copied with ditto, which keeps its metadata, and it is signed ad hoc so `codesign --verify
// --deep --strict` passes on Apple silicon. On Linux none of those programs exists: the PNG is the
// icon, the folder is copied, and it is also packed as a .tar.gz with tar. The steps of each
// platform are plain data (`iconSteps`, `finishSteps`, `archiveStep`), so a test reads them for
// either platform on any machine and runs none.
//
// Usage: node src/desktop/package.ts [--out <dir>]
// The app goes to <dir>/oculus.app on macOS and <dir>/oculus-linux-<arch> with its .tar.gz on
// Linux, replacing one there; the default is ~/Applications on macOS and ~/.local/share/oculus on
// Linux.

import { packager } from '@electron/packager';
import { execFileSync } from 'node:child_process';
import {
    cpSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    realpathSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const NAME = 'oculus';
const BUNDLE_ID = 'local.research.oculus';

/** The platforms the app is packaged for, as Electron names them. */
export type AppPlatform = 'darwin' | 'linux';

/** The architectures the app is packaged for, as Electron names them. */
export type AppArch = 'arm64' | 'x64';

/** One program the packaging runs, with its arguments, no shell between. */
export type Step = { program: string; args: string[] };

/** The checkout this script lives in: the folder holding package.json, two levels above. */
const checkout = resolve(import.meta.dirname, '..', '..');

/**
 * The `--name <value>` arguments of a script, by name. An argument that is not one of `names`, a
 * name given twice and a name with no value are refused, so a misspelt name or two options a shell
 * passed as one word stop the script instead of leaving it on its defaults.
 */
export function scriptArgs(argv: readonly string[], names: readonly string[]): Map<string, string> {
    const read = new Map<string, string>();
    for (let at = 0; at < argv.length; at += 2) {
        const name = argv[at];
        if (!names.includes(name)) throw new Error(`unknown argument ${name}`);
        if (read.has(name)) throw new Error(`${name} is given twice`);
        const given = argv.at(at + 1);
        if (given === undefined || given.startsWith('--')) {
            throw new Error(`${name} needs a value`);
        }
        read.set(name, given);
    }
    return read;
}

/** The platform the app is packaged for on this machine, refusing one with no app. */
export function appPlatform(platform: string = process.platform): AppPlatform {
    if (platform === 'darwin' || platform === 'linux') return platform;
    throw new Error(`there is no oculus app for the platform ${platform}`);
}

/** The architecture the app is packaged for on this machine, refusing one with no app. */
export function appArch(arch: string = process.arch): AppArch {
    if (arch === 'arm64' || arch === 'x64') return arch;
    throw new Error(`there is no oculus app for the architecture ${arch}`);
}

/** The version of the Electron package installed in the checkout. */
export function electronVersion(): string {
    const text = readFileSync(join(checkout, 'node_modules', 'electron', 'package.json'), 'utf8');
    const { version } = JSON.parse(text) as { version: string };
    return version;
}

/**
 * The folder the app goes to when no `--out` is given: `~/Applications` on macOS, the folder of a
 * user's own apps, and `~/.local/share/oculus` on Linux, the user's data folder of the XDG layout.
 */
function defaultOut(platform: AppPlatform, home: string = homedir()): string {
    return platform === 'darwin' ? join(home, 'Applications') : join(home, '.local', 'share', NAME);
}

/** The stub the bundle holds: its package.json, and its main.cjs importing the checkout's main. */
function writeStub(dir: string): void {
    const manifest = { name: NAME, productName: NAME, version: '1.0.0', main: 'main.cjs' };
    writeFileSync(join(dir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    const entry = pathToFileURL(join(checkout, 'src', 'desktop', 'main.ts')).href;
    writeFileSync(join(dir, 'main.cjs'), `import(${JSON.stringify(entry)});\n`);
}

/**
 * The icon the packager is given and the steps that make it: on macOS an .icns in `work` made
 * from `png` with sips at the sizes macOS asks for and iconutil, on Linux the PNG itself and no
 * step.
 */
export function iconSteps(
    platform: AppPlatform,
    png: string,
    work: string
): { icon: string; folder: string | null; steps: Step[] } {
    if (platform === 'linux') return { icon: png, folder: null, steps: [] };
    const set = join(work, `${NAME}.iconset`);
    const steps: Step[] = [];
    for (const size of [16, 32, 128, 256, 512]) {
        for (const scale of [1, 2]) {
            const pixels = String(size * scale);
            const file = scale === 1 ? `icon_${size}x${size}.png` : `icon_${size}x${size}@2x.png`;
            steps.push({
                program: 'sips',
                args: ['-z', pixels, pixels, png, '--out', join(set, file)]
            });
        }
    }
    const icns = join(work, `${NAME}.icns`);
    steps.push({ program: 'iconutil', args: ['-c', 'icns', '-o', icns, set] });
    return { icon: icns, folder: set, steps };
}

/**
 * The step that packs a folder into an archive beside it: a .zip made with ditto on macOS, which
 * keeps the bundle's metadata and its top folder, and a .tar.gz made with tar on Linux, holding
 * the folder by its name.
 */
export function archiveStep(platform: AppPlatform, folder: string, archive: string): Step {
    return platform === 'darwin'
        ? { program: 'ditto', args: ['-c', '-k', '--keepParent', folder, archive] }
        : { program: 'tar', args: ['-czf', archive, '-C', dirname(folder), basename(folder)] };
}

/** The steps that sign a macOS bundle ad hoc and verify the signature, deep and strict. */
export function signSteps(bundle: string): Step[] {
    return [
        { program: 'codesign', args: ['--force', '--deep', '--sign', '-', bundle] },
        { program: 'codesign', args: ['--verify', '--deep', '--strict', bundle] }
    ];
}

/**
 * Where the packaged app goes in `out` and the steps that put it there once the packager made it
 * in `made`: on macOS ditto copies the bundle and codesign signs it ad hoc and verifies it; on
 * Linux the folder is copied by the script and tar packs it beside itself.
 */
export function finishSteps(
    platform: AppPlatform,
    arch: AppArch,
    made: string,
    out: string
): { source: string; target: string; steps: Step[] } {
    if (platform === 'darwin') {
        const source = join(made, `${NAME}.app`);
        const target = join(out, `${NAME}.app`);
        return {
            source,
            target,
            steps: [{ program: 'ditto', args: [source, target] }, ...signSteps(target)]
        };
    }
    const target = join(out, `${NAME}-linux-${arch}`);
    return { source: made, target, steps: [archiveStep(platform, target, `${target}.tar.gz`)] };
}

/**
 * Run each step in order with no shell, stopping at the first that fails; a step's own error
 * output is shown, its other output is not.
 */
export function runSteps(steps: readonly Step[]): void {
    for (const step of steps) {
        execFileSync(step.program, step.args, { stdio: ['ignore', 'ignore', 'inherit'] });
    }
}

async function main(argv: readonly string[]): Promise<void> {
    const platform = appPlatform();
    const arch = appArch();
    const out = resolve(scriptArgs(argv, ['--out']).get('--out') ?? defaultOut(platform));
    const work = mkdtempSync(join(tmpdir(), 'oculus-package-'));
    try {
        const stub = join(work, 'stub');
        mkdirSync(stub);
        writeStub(stub);
        const icon = iconSteps(platform, join(checkout, 'assets', 'app-icon.png'), work);
        if (icon.folder !== null) mkdirSync(icon.folder);
        runSteps(icon.steps);
        const built = await packager({
            dir: stub,
            out: join(work, 'out'),
            name: NAME,
            appBundleId: BUNDLE_ID,
            icon: icon.icon,
            platform,
            arch,
            electronVersion: electronVersion(),
            darwinDarkModeSupport: true,
            asar: false,
            overwrite: true,
            quiet: true
        });
        const made = built.at(0);
        if (made === undefined) throw new Error('the packager made no app');
        mkdirSync(out, { recursive: true });
        const finish = finishSteps(platform, arch, made, out);
        rmSync(finish.target, { recursive: true, force: true });
        if (platform === 'linux') {
            cpSync(finish.source, finish.target, { recursive: true, verbatimSymlinks: true });
        }
        runSteps(finish.steps);
        process.stdout.write(`${finish.target}\n`);
    } finally {
        rmSync(work, { recursive: true, force: true });
    }
}

/** Whether this file is the one Node was started on, as opposed to one that imports it. */
function startedAsProgram(): boolean {
    try {
        return realpathSync(process.argv[1] ?? '') === fileURLToPath(import.meta.url);
    } catch {
        return false;
    }
}

if (startedAsProgram()) await main(process.argv.slice(2));
