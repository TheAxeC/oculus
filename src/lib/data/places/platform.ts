// Layer 1, data. The programs that differ between the platforms oculus runs on: the opener that
// hands a file, a folder or an address to the desktop (macOS `open`, `xdg-open` on Linux,
// `wslview` on Linux under WSL2, where /proc/version names Microsoft's kernel), the shell a plain
// terminal starts when the environment names none, and the words of the reveal, which name Finder
// on macOS only. Server side only: it reads /proc/version.
//
// The platform is a parameter of each function, with the running one as its default, so a test
// holds each branch on any machine. This module imports `node:` modules only, since the start
// checks (server/root/process/start/first-run.ts) read it before the packages are known to be
// installed.

import { readFileSync } from 'node:fs';

/** The platforms with an opener: macOS, Linux, and Linux under WSL2. */
export type OpenPlatform = 'darwin' | 'linux' | 'wsl';

/**
 * The opener program of each platform. macOS's is named by its absolute path so no PATH entry
 * stands in for it; `xdg-open` and `wslview` live wherever the distribution puts them, so the PATH
 * finds them.
 */
const OPENERS: Record<OpenPlatform, string> = {
    darwin: '/usr/bin/open',
    linux: 'xdg-open',
    wsl: 'wslview'
};

/** The file that names the running kernel on Linux, which holds `microsoft` under WSL2. */
const PROC_VERSION = '/proc/version';

/** The text of /proc/version, or empty when it cannot be read. */
function procVersion(): string {
    try {
        return readFileSync(PROC_VERSION, 'utf8');
    } catch {
        return '';
    }
}

/**
 * The opener platform of a Node platform: `wsl` for Linux whose kernel text names Microsoft, and
 * null for a platform with no opener (Windows itself among them).
 */
export function openPlatform(
    platform: NodeJS.Platform = process.platform,
    version: () => string = procVersion
): OpenPlatform | null {
    if (platform === 'darwin') return 'darwin';
    if (platform !== 'linux') return null;
    return version().toLowerCase().includes('microsoft') ? 'wsl' : 'linux';
}

/** The opener program of a platform, or null for a platform with none. */
export function openProgram(platform: OpenPlatform | null = openPlatform()): string | null {
    return platform === null ? null : OPENERS[platform];
}

/**
 * The catalog keys whose words name Finder, each with the key of its words on Linux and WSL2, where
 * the reveal opens the folder holding the item, as VS Code's "Open Containing Folder" does.
 */
const FINDER_WORDS: Readonly<Record<string, string>> = {
    'files.menu_reveal': 'files.menu_reveal_linux',
    'files.reveal_failed': 'files.reveal_failed_linux',
    'repositories.menu_reveal_finder': 'repositories.menu_reveal_linux',
    'repositories.reveal_failed': 'repositories.reveal_failed_linux',
    'project.helper.folder_tip': 'project.helper.folder_tip_linux',
    'project.card.folder_failed': 'project.card.folder_failed_linux'
};

/**
 * The text catalog a page is sent, worded for the opener of the server's machine, since the reveal
 * runs there: as it is on macOS, and on any other platform with each key that names Finder given
 * the words of its other key.
 */
export function platformText(
    text: Record<string, string>,
    platform: OpenPlatform | null = openPlatform()
): Record<string, string> {
    if (platform === 'darwin') return text;
    const worded = { ...text };
    for (const [key, other] of Object.entries(FINDER_WORDS)) {
        if (other in text) worded[key] = text[other];
    }
    return worded;
}

/**
 * The shell a plain terminal starts: the environment's `SHELL` when it names one, else the shell
 * the platform ships as its login shell, zsh on macOS and bash elsewhere. An empty `SHELL` names
 * none.
 */
export function fallbackShell(
    platform: NodeJS.Platform = process.platform,
    env: NodeJS.ProcessEnv = process.env
): string {
    const shell = env.SHELL;
    if (shell !== undefined && shell !== '') return shell;
    return platform === 'darwin' ? '/bin/zsh' : '/bin/bash';
}
