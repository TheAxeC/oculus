// Layer 2, server. What a machine lacks before oculus starts, answered as a list of lacks, each
// with the sentence that says what is missing, what of oculus needs it and how to fix it. The
// module decides nothing about printing or dialogs: the built server (src/server.ts), the app
// (src/desktop/main.ts, app.ts) and the `predev`, `preapp` and `prepreview` hooks of package.json
// are its callers, and run as a program it is the hook.
//
// The answer comes in two parts because an ES module resolves every import before any line of it
// runs. The first part (`installLacks`) is asked before any package is loaded: the Node version and
// the installed packages. Its sentences are literals here, since the text catalog is read through
// the `yaml` package and cannot be read while the packages may be missing. For the same reason this
// file imports `node:` modules, server/core/program.ts and data/places/engine-dir.ts only (and the
// type of the catalog's reader, which is erased); the config reader is loaded with `import()` after
// the first part passes. The second part (`machineLacks`) is asked after the packages load, with
// the catalog's sentences: the programs oculus runs by name.
//
// A lack is required (the Node version, the packages: oculus cannot run without it) or optional
// (git, tmux, perl and the Claude CLI: oculus runs and the parts that need the program do not
// work). The packages are compared with `package-lock.json` through the hidden lockfile npm writes
// at `npm ci` and `npm install` (`node_modules/.package-lock.json`): every entry of the lockfile
// other than the root and those marked optional must be there at the same version. Another package
// manager writes no hidden lockfile and so reads as not installed, with `npm ci` as the fix.

import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { programPath } from '../../../core/program.ts';
import { engineDir } from '../../../../data/places/engine-dir.ts';
import type { Words } from '../words.ts';

/**
 * The Node versions oculus runs on: the 24 line from minor 15, and every major from 26. It is the
 * range every installed package accepts (write-file-atomic declares `^22.22.2 || ^24.15.0 ||
 * >=26.0.0`), and `engines` in package.json says the same, so `npm ci` with `engine-strict` refuses
 * the same versions this check does.
 */
const NODE_LINE = 24;
const NODE_LINE_MINOR = 15;
const NODE_NEXT_MAJOR = 26;

/** The git the Command Line Tools stub installs on every Mac, which runs only with the tools. */
const GIT_STUB = '/usr/bin/git';

export type Lack = {
    /** What is missing: `node`, `packages`, or the program's name for the four programs. */
    kind: 'node' | 'packages' | 'git' | 'tmux' | 'perl' | 'claude';
    /** Whether oculus cannot run without it. */
    required: boolean;
    /** What is missing, what of oculus needs it and its fix, in one text. */
    sentence: string;
};

/** Runs a program and answers its exit status; `xcode-select -p` is the one the checks run. */
type Run = (command: string, args: string[]) => number;

/** What the second part is asked about. */
type MachineFacts = {
    /** The `claude_bin` of the machine's values. */
    claudeBin: string;
    /** The operating system, as `process.platform` names it. */
    platform: NodeJS.Platform;
    /** The environment the programs are looked up in, which is the one the server runs with. */
    env: NodeJS.ProcessEnv;
    /** How `xcode-select -p` is run on macOS. */
    run?: Run;
};

/** One entry of a lockfile's `packages` map, of which only these two keys are read. */
type Entry = { version?: unknown; optional?: unknown };

/** The `packages` map of a lockfile, or null when the file is missing or is not one. */
function packagesOf(file: string): Record<string, Entry> | null {
    try {
        const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
        if (typeof parsed !== 'object' || parsed === null || !('packages' in parsed)) return null;
        const packages: unknown = parsed.packages;
        if (typeof packages !== 'object' || packages === null) return null;
        return packages as Record<string, Entry>;
    } catch {
        return null;
    }
}

/** The Node version as a lack, read by its major and minor so `26.0.0-nightly...` is Node 26. */
function nodeLacks(version: string): Lack[] {
    const [major, minor] = /^v?(\d+)\.(\d+)\./.exec(version)?.slice(1).map(Number) ?? [0, 0];
    if (major >= NODE_NEXT_MAJOR) return [];
    if (major === NODE_LINE && minor >= NODE_LINE_MINOR) return [];
    const range = `Node ${NODE_LINE}.${NODE_LINE_MINOR} or later on the ${NODE_LINE} line, or Node ${NODE_NEXT_MAJOR} or later`;
    return [
        {
            kind: 'node',
            required: true,
            sentence: `Node ${version} is not supported: oculus needs ${range}. Install it with: nvm install ${NODE_LINE}`
        }
    ];
}

/**
 * The installed packages as a lack. The checkout is the one the code runs from, so a copy of the
 * config folder named with `--engine` never decides it.
 */
export function packageLacks(checkout: string): Lack[] {
    const fix = `Run npm ci in ${checkout}.`;
    const wanted = packagesOf(join(checkout, 'package-lock.json'));
    if (wanted === null) {
        const sentence = `package-lock.json in ${checkout} cannot be read, so the installed packages cannot be checked. Restore it from the repository, then run npm ci there.`;
        return [{ kind: 'packages', required: true, sentence }];
    }
    const hidden = packagesOf(join(checkout, 'node_modules', '.package-lock.json'));
    if (hidden === null) {
        const sentence = `The packages are not installed in ${checkout}. ${fix}`;
        return [{ kind: 'packages', required: true, sentence }];
    }
    const installed = (path: string): Entry | undefined => hidden[path];
    const behind = Object.entries(wanted).filter(
        ([path, entry]) =>
            path !== '' && entry.optional !== true && installed(path)?.version !== entry.version
    ).length;
    if (behind === 0) return [];
    const sentence = `The installed packages do not match package-lock.json (missing or at another version: ${behind}). ${fix}`;
    return [{ kind: 'packages', required: true, sentence }];
}

/** The first part: the Node version, then the packages, of the checkout the code runs from. */
export function installLacks(checkout: string, nodeVersion: string): Lack[] {
    return [...nodeLacks(nodeVersion), ...packageLacks(checkout)];
}

const runProgram: Run = (command, args) =>
    spawnSync(command, args, { stdio: 'ignore' }).status ?? 1;

/**
 * The second part: the four programs. A workspace with no folder, or with no hub among them, is no
 * lack. A program is looked up with `programPath` in the environment given, which is the one the
 * server runs with, so a packaged app is asked in its login shell's environment. On macOS a git
 * found at the stub's path counts only when `xcode-select -p` succeeds.
 */
export function machineLacks(facts: MachineFacts, t: Words): Lack[] {
    const { claudeBin, platform, env } = facts;
    const mac = platform === 'darwin';
    const lacks: Lack[] = [];
    const missing = (name: string, needs: string, fix: string): string =>
        t('server.start.lack_program', name, needs, fix);
    const git = programPath('git', env);
    if (git === null) {
        const fix = mac ? t('server.start.fix_xcode') : t('server.start.fix_install', 'git');
        const sentence = missing('git', t('server.start.needs_git'), fix);
        lacks.push({ kind: 'git', required: false, sentence });
    } else if (mac && git === GIT_STUB && (facts.run ?? runProgram)('xcode-select', ['-p']) !== 0) {
        const sentence = t(
            'server.start.lack_stub',
            t('server.start.needs_git'),
            t('server.start.fix_xcode')
        );
        lacks.push({ kind: 'git', required: false, sentence });
    }
    if (programPath('tmux', env) === null) {
        const fix = mac
            ? t('server.start.fix_brew', 'tmux')
            : t('server.start.fix_install', 'tmux');
        const sentence = missing('tmux', t('server.start.needs_tmux'), fix);
        lacks.push({ kind: 'tmux', required: false, sentence });
    }
    if (programPath('perl', env) === null) {
        const fix = mac ? t('server.start.fix_perl_xcode') : t('server.start.fix_install', 'perl');
        const sentence = missing('perl', t('server.start.needs_perl'), fix);
        lacks.push({ kind: 'perl', required: false, sentence });
    }
    if (programPath(claudeBin, env) === null) {
        const sentence = missing(
            claudeBin,
            t('server.start.needs_claude'),
            t('server.start.fix_claude')
        );
        lacks.push({ kind: 'claude', required: false, sentence });
    }
    return lacks;
}

/**
 * What the second part is asked about, read from the machine's values of the workspace the state
 * folder names, as the server reads them. The config reader is loaded here, after the first part
 * has passed.
 */
export async function machineFacts(
    defaultPort: number | undefined,
    env: NodeJS.ProcessEnv,
    stateFolder?: string
): Promise<MachineFacts> {
    const { readMachineWithDefault } = await import('./port.ts');
    const { openWorkspace } = await import('../../../files/workspace/open.ts');
    const { defaultStateFolder } = await import('../../../files/workspace/state.ts');
    const open = openWorkspace(stateFolder ?? defaultStateFolder());
    const { claudeBin } = readMachineWithDefault(defaultPort)(open.hubs, open.primary).config;
    return { claudeBin, platform: process.platform, env };
}

/** Hand every lack to `write` as a line, and answer whether one of them is required. */
export function reportLacks(lacks: Lack[], write: (line: string) => void): boolean {
    for (const lack of lacks) write(`oculus: ${lack.sentence}`);
    return lacks.some((lack) => lack.required);
}

/**
 * The program: the checks over the checkout this file lives in. A required lack of the first part
 * ends it before anything is loaded; the second part is asked after the config reader loads. With
 * `--install` only the first part is asked, which never depends on the engine: it is what the
 * `preapp` hook runs, since npm hands a script's arguments (`--engine`) to the script and not to
 * its hook, and the app checks the programs itself. It prints each lack to standard error and
 * answers the exit status: 1 when a lack is required.
 */
async function main(args: string[]): Promise<number> {
    const checkout = engineDir();
    const write = (line: string): void => {
        console.error(line);
    };
    if (reportLacks(installLacks(checkout, process.versions.node), write)) return 1;
    if (args.includes('--install')) return 0;
    const { wordsOf } = await import('../words.ts');
    const facts = await machineFacts(undefined, process.env);
    return reportLacks(machineLacks(facts, wordsOf(checkout)), write) ? 1 : 0;
}

/** Whether this file is the one Node was started on, as opposed to one that imports it. */
function startedAsProgram(): boolean {
    try {
        return realpathSync(process.argv[1] ?? '') === fileURLToPath(import.meta.url);
    } catch {
        return false;
    }
}

if (startedAsProgram()) process.exitCode = await main(process.argv.slice(2));
