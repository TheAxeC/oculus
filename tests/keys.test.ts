// Every t() call in the source names a key config/text.yml holds.
//
// The gate is the reason no component carries a literal string: a typo in a key would otherwise
// render blank, and it renders blank in the one theme, tab or state that reaches that line. The test
// reads the source as text rather than running it, so a key on a page nobody opened is still checked.
//
// A t() call whose first argument is not a string literal fails too. The test can only check the keys
// it can see, so a computed key would be a hole in the gate rather than a clever call site.

import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../src/lib/data/sources/config.ts';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src');

/** A call to t(), with whatever follows the opening bracket. `flattenText(` and the like are not it. */
const CALL = /(?<![\w$.])t\(/g;

/** The first argument when it is a plain string literal, and nothing when it is not. */
const LITERAL = /^\s*(?:'([^'\\]*)'|"([^"\\]*)")\s*[,)]/;

/**
 * Comments go before the scan, so prose that mentions t() is not read as a call. A `//` that follows
 * a colon is left alone, since that is a URL inside a string rather than the start of a comment.
 */
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

type Call = { file: string; key: string | null; text: string };

/** Every t() call under `root`, with its key when the first argument is a literal. */
export function calls(root: string): Call[] {
    const found: Call[] = [];
    for (const file of sources(root)) {
        const text = stripComments(readFileSync(file, 'utf8'));
        for (const match of text.matchAll(CALL)) {
            const at = match.index + match[0].length;
            // The declaration of t() itself, not a call to it.
            if (/function\s+$/.test(text.slice(0, match.index))) continue;
            const literal = LITERAL.exec(text.slice(at, at + 200));
            const rest = text.slice(match.index, at + 40).split('\n')[0];
            found.push({
                file: file.slice(root.length + 1),
                key: literal ? (literal[1] ?? literal[2]) : null,
                text: rest
            });
        }
    }
    return found;
}

const catalog = textCatalog(loadConfig(engineDir()).config);
const found = calls(SRC);

describe('text keys', () => {
    it('finds the calls in the source at all', () => {
        expect(found.length).toBeGreaterThan(0);
    });

    it('passes a string literal as the key of every call', () => {
        const computed = found.filter((call) => call.key === null);
        expect(computed.map((call) => `${call.file}: ${call.text}`)).toEqual([]);
    });

    it('names a key config/text.yml holds in every call', () => {
        const missing = found
            .filter((call) => call.key !== null && !(call.key in catalog))
            .map((call) => `${call.file}: ${call.key}`);
        expect(missing).toEqual([]);
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
            '<script>\nconst a = t(\'app.title\');\nconst b = t("cards.eli5");\n</script>'
        );
        write('Computed.ts', 'const key = "app.title";\nconst c = t(key);\n');
        write('Prose.ts', '// a comment about t(whatever) is not a call\nconst d = 1;\n');
        write('Define.ts', 'export function t(key: string): string {\n    return key;\n}\n');

        expect(calls(dir)).toEqual([
            { file: 'Computed.ts', key: null, text: 't(key);' },
            { file: 'Good.svelte', key: 'app.title', text: "t('app.title');" },
            { file: 'Good.svelte', key: 'cards.eli5', text: 't("cards.eli5");' }
        ]);
    });
});
