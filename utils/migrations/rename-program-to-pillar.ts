// Layer 2, server. The one-off hub migration behind the manifest key `program:` becoming `pillar:`.
//
// It is kept rather than thrown away because it is idempotent and reports what it did: run over a
// hub that has already been migrated it writes nothing, so a folder of manifests restored from an
// older copy is brought forward by the same command.
//
// The edit is server/edit/yaml/yaml-edit.ts's renameKey, which replaces the bytes of the key token
// and nothing else, so the comments, the ordering and the quoting a hand-written manifest carries
// come through untouched. A manifest the rename is refused over is reported and left alone.
//
// Usage: node utils/migrations/rename-program-to-pillar.ts <hub-root> [<hub-root> ...]

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import type { Dirent } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { RENAMED_FIELDS } from '../../src/lib/data/snapshot/validate.ts';
import { renameKey } from '../../src/lib/server/edit/yaml/yaml-edit.ts';

/** The manifest filename every project folder holds. */
const MANIFEST = 'project.yml';

/** The folder under a hub root that holds the project tiers. */
const PROJECTS = 'projects';

/** Folders no scan descends into, whatever depth they sit at. */
const SKIPPED = ['node_modules', '.git'];

/** What one run did: the manifests written, the ones already migrated, and the refusals. */
export type Migration = {
    written: string[];
    unchanged: string[];
    refused: { file: string; reason: string }[];
};

/** Every project.yml under one folder, in a stable order. */
export function manifestsUnder(dir: string): string[] {
    const found: string[] = [];
    let entries: Dirent[];
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return found;
    }
    for (const entry of [...entries].sort((a, b) => (a.name < b.name ? -1 : 1))) {
        if (entry.isDirectory()) {
            if (SKIPPED.includes(entry.name)) continue;
            found.push(...manifestsUnder(join(dir, entry.name)));
            continue;
        }
        if (entry.name === MANIFEST) found.push(join(dir, entry.name));
    }
    return found;
}

/**
 * Write the new key over the old one in every manifest under `<root>/projects`. A manifest that
 * does not hold the old key is counted unchanged and not written, which is what makes a second run
 * a no-op.
 */
export function migrateHub(root: string, from: string, to: string): Migration {
    const out: Migration = { written: [], unchanged: [], refused: [] };
    for (const file of manifestsUnder(join(root, PROJECTS))) {
        const source = readFileSync(file, 'utf8');
        const result = renameKey(source, from, to);
        if (result.refused.length > 0) {
            out.refused.push({ file, reason: result.refused[0].reason });
            continue;
        }
        if (result.changed.length === 0) {
            out.unchanged.push(file);
            continue;
        }
        writeFileSync(file, result.text);
        out.written.push(file);
    }
    return out;
}

/** The one rename this script carries, read from the reader's own map of renamed manifest keys. */
export function theRename(): { from: string; to: string } {
    const [from, to] = Object.entries(RENAMED_FIELDS)[0];
    return { from, to };
}

/**
 * The hub roots a command line names, or null for a line naming none or carrying a flag, since this
 * takes no flag and a word starting with `--` is a mistyped command rather than a folder.
 */
export function rootsOf(argv: string[]): string[] | null {
    try {
        const { positionals } = parseArgs({ args: argv, options: {}, allowPositionals: true });
        return positionals.length === 0 ? null : positionals;
    } catch {
        return null;
    }
}

function main(argv: string[]): number {
    const roots = rootsOf(argv);
    if (roots === null) {
        process.stderr.write(
            'usage: node utils/migrations/rename-program-to-pillar.ts <hub-root> ...\n'
        );
        return 2;
    }
    const { from, to } = theRename();
    let refused = 0;
    for (const root of roots) {
        const done = migrateHub(root, from, to);
        refused += done.refused.length;
        process.stdout.write(
            `${root}: ${String(done.written.length)} written, ${String(done.unchanged.length)} already ${to}\n`
        );
        for (const one of done.refused)
            process.stdout.write(`  refused ${one.file}: ${one.reason}\n`);
    }
    return refused === 0 ? 0 : 1;
}

if (process.argv[1]?.endsWith('rename-program-to-pillar.ts') === true) {
    process.exitCode = main(process.argv.slice(2));
}
