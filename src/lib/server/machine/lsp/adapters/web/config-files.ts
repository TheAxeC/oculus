// Layer 2, server. The Svelte and Vite configuration files a repository holds, which the Svelte
// server runs when it is trusted: every `svelte.config.*` and `vite.config.*` under the root, and
// the first one at or above the root, which its own search finds when none is nearer. The server
// crawls its workspace for them excluding `node_modules`; this crawl skips `node_modules` and the
// `.git` folder and nothing else, so a configuration in a folder whose name starts with a dot is
// named too. A symbolic link is not followed into a folder, and one to a file is a file, as the
// server would import it.
//
// The approval is of the files' text (approvals.ts `configText`): their paths, relative to the
// root with `/` for a file under it and absolute for one above it, each with the SHA-256 of its
// bytes.

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';

/** One configuration file: its path as the approval names it, and the hash of its bytes. */
export type ConfigFile = { path: string; hash: string };

/** The extensions a Svelte configuration and a Vite configuration are written in. */
const SVELTE_CONFIG = /^svelte\.config\.(js|ts|cjs|mjs|mts)$/;
const VITE_CONFIG = /^vite\.config\.(js|mjs|ts|cjs|mts|cts)$/;

/** Folders no configuration is looked for in. */
const SKIPPED = ['node_modules', '.git'];

function isConfig(name: string): boolean {
    return SVELTE_CONFIG.test(name) || VITE_CONFIG.test(name);
}

/** Every file under a folder whose name is a configuration's, as full paths. */
async function crawl(folder: string): Promise<string[]> {
    const found: string[] = [];
    const pending = [folder];
    while (pending.length > 0) {
        const here = pending.pop() ?? folder;
        let entries;
        try {
            entries = await readdir(here, { withFileTypes: true });
        } catch {
            continue;
        }
        for (const entry of entries) {
            const full = join(here, entry.name);
            if (entry.isDirectory()) {
                if (!SKIPPED.includes(entry.name)) pending.push(full);
            } else if (isConfig(entry.name) && (entry.isFile() || entry.isSymbolicLink())) {
                found.push(full);
            }
        }
    }
    return found;
}

/**
 * The first configuration at or above a folder: the Vite one of a folder before its Svelte one,
 * as the server's own search takes them, then the folder above.
 */
function upward(folder: string): string | null {
    for (let here = folder; ; here = dirname(here)) {
        const names = [...VITE_NAMES, ...SVELTE_NAMES].map((name) => join(here, name));
        const named = names.find((one) => existsSync(one));
        if (named !== undefined) return named;
        if (dirname(here) === here) return null;
    }
}

const VITE_NAMES = ['js', 'mjs', 'ts', 'cjs', 'mts', 'cts'].map((one) => `vite.config.${one}`);
const SVELTE_NAMES = ['js', 'cjs', 'mjs', 'ts', 'mts'].map((one) => `svelte.config.${one}`);

/** The path an approval names a file by. */
function nameOf(root: string, file: string): string {
    const inside = relative(root, file);
    return inside.startsWith('..') ? file : inside.split(sep).join('/');
}

/** Whether a `svelte` package is installed at the root or in a folder above it. */
export function hasSvelte(root: string): boolean {
    for (let here = root; ; here = dirname(here)) {
        if (existsSync(join(here, 'node_modules', 'svelte', 'package.json'))) return true;
        if (dirname(here) === here) return false;
    }
}

/** The configuration files of a root in path order, each with the SHA-256 of its bytes. */
export async function configFilesOf(root: string): Promise<ConfigFile[]> {
    const wanted = new Set(await crawl(root));
    const above = upward(root);
    if (above !== null) wanted.add(above);
    const files: ConfigFile[] = [];
    for (const full of wanted) {
        try {
            if (!(await stat(full)).isFile()) continue;
            const hash = createHash('sha256')
                .update(await readFile(full))
                .digest('hex');
            files.push({ path: nameOf(root, full), hash });
        } catch {
            // A file that cannot be read is not one the server can import either.
        }
    }
    return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}
