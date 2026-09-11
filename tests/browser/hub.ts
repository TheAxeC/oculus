// What a spec reads the served hub from. `serve.ts` copies demo/ to a temporary directory and
// writes that path here; a spec that asserts on a file reads it back through readHubFile, so a
// write the DOM says happened is checked against the bytes on disk.

import { existsSync, readFileSync, rmSync } from 'node:fs';
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
 * Remove a folder a spec scaffolded, so the hub the next spec file serves is the demo again. The
 * path is resolved and asserted to be inside the temporary hub before anything is removed.
 */
export function removeHubDir(relative: string): void {
    const root = hubDir();
    const full = resolve(join(root, relative));
    if (!full.startsWith(resolve(root) + sep)) throw new Error(`${full} is not inside ${root}`);
    rmSync(full, { recursive: true, force: true });
}

/** One manifest's `short:`, which is what a board card and a ticker line are named by. */
export function shortOf(project: string): string {
    const manifest = readHubYaml(`${project}/project.yml`);
    const short = manifest.short;
    if (typeof short !== 'string' || short === '') throw new Error(`${project}: no short`);
    return short;
}
