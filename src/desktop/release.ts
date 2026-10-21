// Layer 2, server (the desktop host). `npm run app:release`: builds the app that runs on its own,
// for a platform and an architecture, and packs it as the archive a Release holds. Where
// `npm run app:package` makes a stub that runs the checkout's code, this app holds everything it
// runs and reads nothing of the checkout: the server built by `vite build --mode app`, the sources
// Electron and the server run unbuilt (src/, with config/, docs/, assets/ and the one document),
// and the production packages installed for the target into a staging folder by `npm ci` with
// npm's `--os` and `--cpu` (and `--libc glibc` for Linux, so the packages built per C library get
// the GNU one). The install runs no package's install script, since a script would build for this
// machine and not the target. Electron itself is the packager's, at the version the checkout has.
//
// The staging folder's package-lock.json is cut to the entries the production install holds (the
// lock less the entries marked `dev`) and put into the app after the packager, which leaves every
// lockfile out, so the app's own start check (server/root/process/start/first-run.ts,
// `packageLacks`) compares the packages it holds with the lock that lists them.
//
// The archive is release/oculus-<version>-<platform>-<arch>, a .zip made by ditto for macOS, after
// the bundle is signed ad hoc, and a .tar.gz made by tar for Linux, holding the app's folder by its
// name. A macOS app is made on a Mac only, since its icon is made with sips and iconutil; the Linux
// ones are made on either.
//
// Usage: node src/desktop/release.ts [--platform darwin|linux] [--arch arm64|x64]
// The default of each is this machine's.

import { packager } from '@electron/packager';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { SHIPPED_SOURCES } from '../lib/data/places/shipped.ts';
import { APP_FOLDERS } from '../lib/server/root/process/build-folders.ts';
import {
    appArch,
    appPlatform,
    archiveStep,
    electronVersion,
    iconSteps,
    runSteps,
    scriptArgs,
    signSteps,
    type AppArch,
    type AppPlatform
} from './package.ts';
import { buildServer } from './server/build.ts';

const NAME = 'oculus';
const BUNDLE_ID = 'local.research.oculus';

/** The checkout this script lives in: the folder holding package.json, two levels above. */
const checkout = resolve(import.meta.dirname, '..', '..');

/** What the app holds of the checkout, besides the packages the staging folder installs. */
const SHIPPED = [...SHIPPED_SOURCES, APP_FOLDERS.adapter];

/** The npm arguments that install the production packages of `platform` and `arch`. */
function installArgs(platform: AppPlatform, arch: AppArch): string[] {
    const target = [`--os=${platform}`, `--cpu=${arch}`];
    if (platform === 'linux') target.push('--libc=glibc');
    return ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', ...target];
}

/** The lock with the entries only the development packages need taken out. */
function productionLock(text: string): string {
    const lock = JSON.parse(text) as { packages: Record<string, { dev?: boolean }> };
    const kept = Object.entries(lock.packages).filter(([, entry]) => entry.dev !== true);
    lock.packages = Object.fromEntries(kept);
    return `${JSON.stringify(lock, null, 4)}\n`;
}

/** Build the app's server in the checkout, printing its output, or throw with the reason. */
async function buildApp(): Promise<void> {
    const build = buildServer(checkout, (line, error) =>
        (error ? process.stderr : process.stdout).write(`[build] ${line}\n`)
    );
    const built = await build.done;
    if (!built.ok) throw new Error(`the build failed: ${built.reason}`);
}

async function main(argv: readonly string[]): Promise<void> {
    const args = scriptArgs(argv, ['--platform', '--arch']);
    const platform = appPlatform(args.get('--platform') ?? process.platform);
    const arch = appArch(args.get('--arch') ?? process.arch);
    if (platform === 'darwin' && process.platform !== 'darwin') {
        throw new Error('the macOS app is made on a Mac, which has sips, iconutil and codesign');
    }
    const { version } = JSON.parse(readFileSync(join(checkout, 'package.json'), 'utf8')) as {
        version: string;
    };
    await buildApp();
    const work = mkdtempSync(join(tmpdir(), 'oculus-release-'));
    try {
        const staging = join(work, 'app');
        for (const path of SHIPPED) {
            cpSync(join(checkout, path), join(staging, path), { recursive: true });
        }
        execFileSync('npm', installArgs(platform, arch), {
            cwd: staging,
            stdio: ['ignore', 'inherit', 'inherit']
        });
        const lockFile = join(staging, 'package-lock.json');
        writeFileSync(lockFile, productionLock(readFileSync(lockFile, 'utf8')));
        const icon = iconSteps(platform, join(checkout, 'assets', 'app-icon.png'), work);
        if (icon.folder !== null) mkdirSync(icon.folder);
        runSteps(icon.steps);
        const built = await packager({
            dir: staging,
            out: join(work, 'out'),
            name: NAME,
            appBundleId: BUNDLE_ID,
            appVersion: version,
            icon: icon.icon,
            platform,
            arch,
            electronVersion: electronVersion(),
            darwinDarkModeSupport: true,
            asar: false,
            prune: false,
            overwrite: true,
            quiet: true
        });
        const made = built.at(0);
        if (made === undefined) throw new Error('the packager made no app');
        const folder = platform === 'darwin' ? join(made, `${NAME}.app`) : made;
        // The packager leaves every package-lock.json out of an app; the start check reads it.
        const shipped =
            platform === 'darwin'
                ? join(folder, 'Contents', 'Resources', 'app')
                : join(folder, 'resources', 'app');
        cpSync(lockFile, join(shipped, 'package-lock.json'));
        if (platform === 'darwin') runSteps(signSteps(folder));
        const releases = join(checkout, 'release');
        mkdirSync(releases, { recursive: true });
        const kind = platform === 'darwin' ? 'zip' : 'tar.gz';
        const archive = join(releases, `${NAME}-${version}-${platform}-${arch}.${kind}`);
        rmSync(archive, { force: true });
        const pack = archiveStep(platform, folder, archive);
        // The tar of macOS writes each file's extended attributes as headers a Linux tar warns
        // about at every file, so a Linux archive made on a Mac leaves them out.
        if (platform === 'linux' && process.platform === 'darwin') {
            pack.args.unshift('--no-mac-metadata', '--no-xattrs');
        }
        runSteps([pack]);
        process.stdout.write(`${archive}\n`);
    } finally {
        rmSync(work, { recursive: true, force: true });
    }
}

await main(process.argv.slice(2));
