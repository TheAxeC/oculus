// Layer 4, test helper. The scripts of the installed monaco-editor, which the colour map and the
// removed chords are checked against, so a release that renames a key or an action turns them red.

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The oculus project folder, which holds node_modules. */
export const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..', '..');

/** Every file under a folder, depth first. */
function filesUnder(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)]
    );
}

/** The text of every script of the installed monaco-editor's esm tree, one entry per file. */
export function monacoSources(): string[] {
    const esm = join(ROOT, 'node_modules', 'monaco-editor', 'esm', 'vs');
    return filesUnder(esm)
        .filter((path) => path.endsWith('.js'))
        .map((path) => readFileSync(path, 'utf8'));
}
