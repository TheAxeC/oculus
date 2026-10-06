// Layer 2, server (the desktop host). `npm run app:package`: builds oculus.app with
// @electron/packager. The bundle is a stub: a package.json and a main.cjs that imports this
// checkout's src/desktop/main.ts by its absolute path, written when the app is packaged, so the
// app runs the checkout's code and is packaged again only when Electron's version changes. The
// icon is assets/app-icon.png made into an .icns with sips and iconutil, and the bundle is signed
// ad hoc so `codesign --verify --deep --strict` passes on Apple silicon.
//
// Usage: node src/desktop/package.ts [--out <dir>]
// The app goes to <dir>/oculus.app (replacing one there); the default is ~/Applications.

import { packager } from '@electron/packager';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const NAME = 'oculus';
const BUNDLE_ID = 'local.research.oculus';

/** The checkout this script lives in: the folder holding package.json, two levels above. */
const checkout = resolve(import.meta.dirname, '..', '..');

/** The folder the app is written to: the value of `--out`, else ~/Applications. */
function outOf(argv: readonly string[]): string {
    const at = argv.indexOf('--out');
    if (at < 0) return join(homedir(), 'Applications');
    const given = argv.at(at + 1);
    if (given === undefined || given.startsWith('--')) {
        throw new Error('--out names the folder the app goes to');
    }
    return resolve(given);
}

/** The version of the Electron package installed in the checkout. */
function electronVersion(): string {
    const text = readFileSync(join(checkout, 'node_modules', 'electron', 'package.json'), 'utf8');
    const { version } = JSON.parse(text) as { version: string };
    return version;
}

/** The stub the bundle holds: its package.json, and its main.cjs importing the checkout's main. */
function writeStub(dir: string): void {
    const manifest = { name: NAME, productName: NAME, version: '1.0.0', main: 'main.cjs' };
    writeFileSync(join(dir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    const entry = pathToFileURL(join(checkout, 'src', 'desktop', 'main.ts')).href;
    writeFileSync(join(dir, 'main.cjs'), `import(${JSON.stringify(entry)});\n`);
}

/** assets/app-icon.png as an .icns in `dir`, at the sizes macOS asks for. */
function writeIcon(dir: string): string {
    const set = join(dir, `${NAME}.iconset`);
    mkdirSync(set);
    const source = join(checkout, 'assets', 'app-icon.png');
    for (const size of [16, 32, 128, 256, 512]) {
        for (const scale of [1, 2]) {
            const pixels = String(size * scale);
            const file = scale === 1 ? `icon_${size}x${size}.png` : `icon_${size}x${size}@2x.png`;
            execFileSync('sips', ['-z', pixels, pixels, source, '--out', join(set, file)], {
                stdio: 'ignore'
            });
        }
    }
    const icns = join(dir, `${NAME}.icns`);
    execFileSync('iconutil', ['-c', 'icns', '-o', icns, set]);
    return icns;
}

async function main(): Promise<void> {
    const out = outOf(process.argv.slice(2));
    const work = mkdtempSync(join(tmpdir(), 'oculus-package-'));
    try {
        const stub = join(work, 'stub');
        mkdirSync(stub);
        writeStub(stub);
        const built = await packager({
            dir: stub,
            out: join(work, 'out'),
            name: NAME,
            appBundleId: BUNDLE_ID,
            icon: writeIcon(work),
            platform: 'darwin',
            arch: process.arch as 'arm64' | 'x64',
            electronVersion: electronVersion(),
            darwinDarkModeSupport: true,
            asar: false,
            overwrite: true,
            quiet: true
        });
        const made = built.at(0);
        if (made === undefined) throw new Error('the packager made no app');
        mkdirSync(out, { recursive: true });
        const target = join(out, `${NAME}.app`);
        rmSync(target, { recursive: true, force: true });
        execFileSync('ditto', [join(made, `${NAME}.app`), target]);
        execFileSync('codesign', ['--force', '--deep', '--sign', '-', target], { stdio: 'ignore' });
        execFileSync('codesign', ['--verify', '--deep', '--strict', target]);
        process.stdout.write(`${target}\n`);
    } finally {
        rmSync(work, { recursive: true, force: true });
    }
}

await main();
