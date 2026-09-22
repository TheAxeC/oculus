// What a spec reads the served hub from. `serve.ts` copies demo/ to a temporary directory and
// writes that path here; a spec that asserts on a file reads it back through readHubFile, so a
// write the DOM says happened is checked against the bytes on disk.

import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { parse } from 'yaml';

const here = dirname(fileURLToPath(import.meta.url));

/** The temporary copy of demo/ the server of this run is reading, asserted to be a temporary one. */
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
 * The path is resolved and asserted to be inside the temporary hub before anything is written.
 */
export function writeHubFile(relative: string, body: string): void {
    const root = hubDir();
    const full = resolve(join(root, relative));
    if (!full.startsWith(resolve(root) + sep)) throw new Error(`${full} is not inside ${root}`);
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
 * The engine directory this run serves, beside the hub copy under the one temporary directory
 * `serve.ts` made: it holds the copy of `config/`, so a spec whose subject is a configured setting
 * edits that copy and never the checkout's. The config folder is asserted to be there.
 */
export function servedEngineDir(): string {
    const dir = join(dirname(hubDir()), 'engine');
    if (!existsSync(join(dir, 'config'))) throw new Error(`${dir} holds no config folder`);
    return dir;
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
