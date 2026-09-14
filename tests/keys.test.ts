// The catalog key gate in both directions. Every literal reader names a catalog key, and every
// catalog key is reached by a literal, registration metadata, or one documented computed lookup.

import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
    collectionKeys,
    engineDir,
    loadConfig,
    textCatalog
} from '../src/lib/data/sources/config.ts';
import { views } from '../src/lib/views/registry.ts';
import { registerCollections } from '../src/routes/views.ts';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src');

/** Client readers whose first argument is a catalog key. */
const CALL = /(?<![\w$.])(t|lookup|catalogText)\(/g;

/** Server interpolation takes the catalog before its key. */
const WORDS = /(?<![\w$.])words\(\s*catalog\s*,/g;

/** Direct server indexing of the flat catalog. */
const INDEX = /textCatalog\([^)]*\)\s*\[\s*(['"])([^'"\\]+)\1\s*\]/g;

/** The first argument when it is a plain string literal, and nothing when it is not. */
const LITERAL = /^\s*(?:'([^'\\]*)'|"([^"\\]*)")\s*[,)]/;

/** The two computed prefixes, with the file that computes each and the registered ids it covers. */
const COMPUTED_PREFIXES = [
    {
        file: 'lib/views/Collection.svelte',
        start: 'lookup(`views.${instance.view}`',
        ids: () => collectionKeys(loadConfig(engineDir()).config)
    },
    {
        file: 'lib/views/Projects.svelte',
        start: 'lookup(`views.${preset.id}`',
        ids: () => ['projects', 'coauthor', 'archive']
    }
] as const;

/** Registration metadata is a configured catalog-key value rather than a computed prefix. */
const REGISTRATION_LOOKUPS = [
    { file: 'lib/views/registry.ts', start: 'lookup(registration.label)' },
    { file: 'lib/views/registry.ts', start: 'lookup(registration.glyph)' }
] as const;

/** Remove comments so prose about a reader is not mistaken for a call. */
function stripComments(source: string): string {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function sources(dir: string): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) found.push(...sources(path));
        else if (/\.(ts|svelte)$/.test(entry.name)) found.push(path);
    }
    return found;
}

type Call = { file: string; reader: string; key: string | null; text: string };

/** Every catalog read under `root`, with its key when the argument is a literal. */
export function calls(root: string): Call[] {
    const found: Call[] = [];
    for (const file of sources(root)) {
        const source = stripComments(readFileSync(file, 'utf8'));
        for (const match of source.matchAll(CALL)) {
            const at = match.index + match[0].length;
            if (/function\s+$/.test(source.slice(0, match.index))) continue;
            const literal = LITERAL.exec(source.slice(at, at + 200));
            found.push({
                file: file.slice(root.length + 1),
                reader: match[1],
                key: literal ? (literal[1] ?? literal[2]) : null,
                text: source.slice(match.index, at + 80).split('\n')[0]
            });
        }
        for (const match of source.matchAll(WORDS)) {
            const at = match.index + match[0].length;
            const literal = LITERAL.exec(source.slice(at, at + 200));
            found.push({
                file: file.slice(root.length + 1),
                reader: 'words',
                key: literal ? (literal[1] ?? literal[2]) : null,
                text: source.slice(match.index, at + 80).split('\n')[0]
            });
        }
        for (const match of source.matchAll(INDEX)) {
            found.push({
                file: file.slice(root.length + 1),
                reader: 'index',
                key: match[2],
                text: match[0]
            });
        }
    }
    return found;
}

const config = loadConfig(engineDir()).config;
const catalog = textCatalog(config);
registerCollections(collectionKeys(config));
const found = calls(SRC);

function documented(call: Call): boolean {
    return COMPUTED_PREFIXES.some(
        (entry) => entry.file === call.file && call.text.startsWith(entry.start)
    );
}

function registrationLookup(call: Call): boolean {
    return REGISTRATION_LOOKUPS.some(
        (entry) => entry.file === call.file && call.text.startsWith(entry.start)
    );
}

/** Dynamic readers not covered by the two computed prefixes or registration metadata. */
function unapproved(readers: Call[]): Call[] {
    return readers.filter(
        (call) => call.key === null && !documented(call) && !registrationLookup(call)
    );
}

describe('text keys', () => {
    it('finds catalog reads in the source', () => {
        expect(found.length).toBeGreaterThan(0);
    });

    it('uses literals except at the documented computed prefixes', () => {
        const computed = unapproved(found);
        expect(computed.map((call) => `${call.file}: ${call.text}`)).toEqual([]);
    });

    it('names a catalog key in every literal read', () => {
        const missing = found
            .filter((call) => call.key !== null && !(call.key in catalog))
            .map((call) => `${call.file}: ${call.key}`);
        expect(missing).toEqual([]);
    });

    it('has a reader for every catalog key', () => {
        const allowed = new Set(found.flatMap((call) => (call.key === null ? [] : [call.key])));
        for (const registration of views()) {
            allowed.add(registration.label);
            allowed.add(registration.glyph);
        }
        for (const entry of COMPUTED_PREFIXES) {
            for (const id of entry.ids()) allowed.add(`views.${id}`);
        }
        const orphaned = Object.keys(catalog).filter((key) => !allowed.has(key));
        expect(orphaned).toEqual([]);
    });

    it('catches a computed key and a literal key, and reads past neither', () => {
        const dir = mkdtempSync(join(tmpdir(), 'oculus-keys-'));
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        const write = (name: string, body: string) => {
            const full = join(dir, name);
            expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
            writeFileSync(full, body);
        };
        write(
            'Good.svelte',
            '<script>\nconst a = t(\'app.title\');\nconst b = lookup("views.status");\n</script>'
        );
        write(
            'Computed.ts',
            'const key = "app.title";\nconst c = t(key);\nconst d = lookup(key);\n'
        );
        write('Prose.ts', '// a comment about t(whatever) is not a call\nconst d = 1;\n');
        write('Define.ts', 'export function t(key: string): string {\n    return key;\n}\n');
        expect(calls(dir)).toEqual([
            { file: 'Computed.ts', reader: 't', key: null, text: 't(key);' },
            { file: 'Computed.ts', reader: 'lookup', key: null, text: 'lookup(key);' },
            { file: 'Good.svelte', reader: 't', key: 'app.title', text: "t('app.title');" },
            {
                file: 'Good.svelte',
                reader: 'lookup',
                key: 'views.status',
                text: 'lookup("views.status");'
            }
        ]);
        expect(unapproved(calls(dir)).map((call) => call.text)).toEqual([
            't(key);',
            'lookup(key);'
        ]);
    });
});
