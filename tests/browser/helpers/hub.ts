// What a spec reads the served hub from. `serve.ts` copies demo/ to a temporary directory and
// writes that path here; a spec that asserts on a file reads it back through readHubFile, so a
// write the DOM says happened is checked against the bytes on disk.

import { randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { parse } from 'yaml';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * The temporary copy of demo/ the server of this run is reading, asserted to be a temporary one.
 */
export function hubDir(): string {
    const path = readFileSync(join(here, '.hub'), 'utf8').trim();
    if (!resolve(path).startsWith(resolve(tmpdir()) + sep)) {
        throw new Error(`${path} is not inside ${tmpdir()}`);
    }
    return path;
}

/** One file of that hub, by its path relative to the hub root. */
export function readHubFile(relative: string): string {
    return readFileSync(join(hubDir(), relative), 'utf8');
}

/** Whether that hub holds a file, for a spec that scaffolds one or deletes one. */
export function hubFileExists(relative: string): boolean {
    return existsSync(join(hubDir(), relative));
}

/** One of that hub's YAML files as a map, for the identifying values a spec locates a card by. */
export function readHubYaml(relative: string): Record<string, unknown> {
    const parsed: unknown = parse(readHubFile(relative));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error(`${relative}: expected a map`);
    }
    return parsed as Record<string, unknown>;
}

/**
 * Write a file into that hub, for a spec whose subject is a document no control of the page makes.
 * The path is resolved and asserted to be inside the temporary hub before anything is written,
 * and a folder it names that the hub does not hold yet is made.
 */
export function writeHubFile(relative: string, body: string): void {
    const root = hubDir();
    const full = resolve(join(root, relative));
    if (!full.startsWith(resolve(root) + sep)) throw new Error(`${full} is not inside ${root}`);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

/**
 * Copy a file the tree ships into that hub, for a spec whose subject is a folder the demo does not
 * carry. The destination is resolved and asserted to be inside the temporary hub, and the folders
 * above it are made, before anything is written.
 */
export function copyIntoHub(relative: string, from: string): void {
    const root = hubDir();
    const full = resolve(join(root, relative));
    if (!full.startsWith(resolve(root) + sep)) throw new Error(`${full} is not inside ${root}`);
    mkdirSync(dirname(full), { recursive: true });
    copyFileSync(from, full);
}

/**
 * Remove a file or a folder a spec scaffolded, so the hub the next spec file serves is the demo
 * again. The path is resolved and asserted to be inside the temporary hub before anything is
 * removed.
 */
export function removeFromHub(relative: string): void {
    const root = hubDir();
    const full = resolve(join(root, relative));
    if (!full.startsWith(resolve(root) + sep)) throw new Error(`${full} is not inside ${root}`);
    rmSync(full, { recursive: true, force: true });
}

/**
 * Where `serve.ts` puts each part of a run inside the one temporary directory it makes: the hub
 * copy, the engine directory, the home directory, the two connectors' credential folders, and the
 * file this run's `open_bin` appends each address it is handed to. It is named here once, so the
 * server that makes them and a spec that reads one agree on where it is.
 */
export function runLayout(temp: string): {
    hub: string;
    engine: string;
    home: string;
    calendar: string;
    mail: string;
    opened: string;
} {
    return {
        hub: join(temp, 'demo'),
        engine: join(temp, 'engine'),
        home: join(temp, 'home'),
        calendar: join(temp, 'calendar'),
        mail: join(temp, 'mail'),
        opened: join(temp, 'opened.txt')
    };
}

/** One of this run's connector folders, where each account's credential file is. */
export function servedConnectorDir(kind: 'calendar' | 'mail'): string {
    return runLayout(dirname(hubDir()))[kind];
}

/**
 * Write one file into one of this run's connector folders, for a spec whose subject is an account
 * file no control of the page writes. The path is resolved and asserted to be inside that folder,
 * and the folder inside the temporary directory, before anything is written.
 */
export function writeConnectorFile(kind: 'calendar' | 'mail', name: string, body: string): void {
    const root = servedConnectorDir(kind);
    const full = resolve(join(root, name));
    if (
        !resolve(root).startsWith(resolve(tmpdir()) + sep) ||
        !full.startsWith(resolve(root) + sep)
    ) {
        throw new Error(`${full} is not inside ${root}`);
    }
    writeFileSync(full, body);
}

/**
 * Every address the served server has handed to its opener, oldest first: a provider's consent
 * page, which this run records in place of opening a browser.
 */
export function openedAddresses(): string[] {
    const file = runLayout(dirname(hubDir())).opened;
    if (!existsSync(file)) return [];
    return readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => line !== '');
}

/**
 * The engine directory this run serves: it holds the copy of `config/`, so a spec whose subject is
 * a configured setting edits that copy and never the checkout's. The config folder is asserted to
 * be there.
 */
export function servedEngineDir(): string {
    const dir = runLayout(dirname(hubDir())).engine;
    if (!existsSync(join(dir, 'config'))) throw new Error(`${dir} holds no config folder`);
    return dir;
}

/**
 * The home directory this run's server runs under: its session stores and its `~/.oculus` files
 * (bookmarks, workspaces, notes) are there and never in the owner's. It is asserted to be there.
 */
export function servedHomeDir(): string {
    const dir = runLayout(dirname(hubDir())).home;
    if (!existsSync(dir)) throw new Error(`${dir} is not there`);
    return dir;
}

/**
 * Delete one file of that home directory if it is there, for a spec that starts from a state no
 * control of the page makes. The path is resolved and asserted to be inside it, and the home
 * inside the temporary directory, before anything is deleted.
 */
export function removeServedHomeFile(relative: string): void {
    const root = servedHomeDir();
    const full = resolve(join(root, relative));
    if (
        !resolve(root).startsWith(resolve(tmpdir()) + sep) ||
        !full.startsWith(resolve(root) + sep)
    ) {
        throw new Error(`${full} is not inside ${root}`);
    }
    rmSync(full, { force: true });
}

/**
 * One ended session as a transcript in a folder of the served run's session store: named `title`,
 * working in `cwd`, one question and one answer, stamped with this moment so the scan reads it. The
 * folder is asserted to be inside the temporary directory before anything is written.
 */
export function writeTranscript(
    dir: string,
    title: string,
    cwd: string,
    said: { asked: string; answered: string }
): void {
    if (!resolve(dir).startsWith(resolve(tmpdir()) + sep)) {
        throw new Error(`${dir} is not inside the temporary directory`);
    }
    const line = { timestamp: new Date().toISOString(), cwd, gitBranch: '', version: '2.0.0' };
    const rows = [
        { type: 'ai-title', aiTitle: title },
        {
            type: 'user',
            ...line,
            origin: { kind: 'human' },
            message: { role: 'user', content: said.asked }
        },
        {
            type: 'assistant',
            ...line,
            message: {
                role: 'assistant',
                model: 'claude-opus-5',
                content: [{ type: 'text', text: said.answered }],
                usage: { input_tokens: 1, output_tokens: 1 }
            }
        }
    ];
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${randomUUID()}.jsonl`);
    writeFileSync(file, rows.map((row) => JSON.stringify(row)).join('\n') + '\n');
}

/** One file of that engine directory, by its path relative to the engine root. */
export function readEngineFile(relative: string): string {
    return readFileSync(join(servedEngineDir(), relative), 'utf8');
}

/**
 * Write a file into that engine directory, for a spec whose subject is a setting no control of the
 * page writes. The path is resolved and asserted to be inside it before anything is written.
 */
export function writeEngineFile(relative: string, body: string): void {
    const root = servedEngineDir();
    const full = resolve(join(root, relative));
    if (!full.startsWith(resolve(root) + sep)) throw new Error(`${full} is not inside ${root}`);
    writeFileSync(full, body);
}

/** One manifest's `short:`, which is what a board card and a ticker line are named by. */
export function shortOf(project: string): string {
    const manifest = readHubYaml(`${project}/project.yml`);
    const short = manifest.short;
    if (typeof short !== 'string' || short === '') throw new Error(`${project}: no short`);
    return short;
}
