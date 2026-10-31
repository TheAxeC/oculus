// Layer 2, server (the desktop host). The steps of `npm run app:release`: reading the script's
// arguments, checking the platform and the architecture, finding Electron's version, and the icon,
// signing and archive steps and running them. They sit in a file of their own because release.ts
// runs its build when it is loaded, so a test could not import them from it.
//
// On macOS the icon is assets/app-icon.png made into an .icns with sips and iconutil, the bundle is
// signed ad hoc so `codesign --verify --deep --strict` passes on Apple silicon, and ditto packs it
// with its metadata. On Linux none of those programs exists: the PNG is the icon and tar packs the
// folder. The steps of each platform are plain data (`iconSteps`, `signSteps`, `archiveStep`), so a
// test reads them for either platform on any machine and runs none.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

/** The app's name, which names its bundle, its folders and its archives. */
export const NAME = 'oculus';

/** The platforms the app is packaged for, as Electron names them. */
export type AppPlatform = 'darwin' | 'linux';

/** The architectures the app is packaged for, as Electron names them. */
export type AppArch = 'arm64' | 'x64';

/** One program the packaging runs, with its arguments, no shell between. */
type Step = { program: string; args: string[] };

/** The checkout this file lives in: the folder holding package.json, two levels above. */
export const checkout = resolve(import.meta.dirname, '..', '..');

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

/** Check that `platform` is one the app is packaged for, refusing one with no app. */
export function appPlatform(platform: string): AppPlatform {
    if (platform === 'darwin' || platform === 'linux') return platform;
    throw new Error(`there is no oculus app for the platform ${platform}`);
}

/** Check that `arch` is one the app is packaged for, refusing one with no app. */
export function appArch(arch: string): AppArch {
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

/**
 * The steps that sign a macOS bundle ad hoc and verify the signature, deep and strict, and no step
 * on Linux, which has no codesign.
 */
export function signSteps(platform: AppPlatform, bundle: string): Step[] {
    if (platform === 'linux') return [];
    return [
        { program: 'codesign', args: ['--force', '--deep', '--sign', '-', bundle] },
        { program: 'codesign', args: ['--verify', '--deep', '--strict', bundle] }
    ];
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
