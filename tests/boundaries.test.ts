// The import graph respects the layers of DESIGN.md, section "Boundaries".
// Every module under src/lib is read, its import specifiers are extracted, and each one is
// checked against the row of the table its own folder sits in. Anything the row does not
// allow is a violation: the table's "May import" column is the whole permission.

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const LIB = resolve(fileURLToPath(import.meta.url), '..', '..', 'src', 'lib');

const LAYERS = ['data', 'server', 'state', 'ui', 'shell', 'views', 'themes'];

// One entry per row of the table. A pattern ending in /** matches the folder and everything
// under it; any other pattern matches exactly. The view registry is the one module the shell
// and the views share, so a view can register itself without importing another view.
const ALLOWED: Record<string, string[]> = {
    ui: ['ui/**', 'themes/**', 'state/text'],
    shell: ['shell/**', 'ui/**', 'state/layout', 'state/ui', 'state/text', 'views/registry'],
    views: ['ui/**', 'state/**', 'views/registry'],
    state: ['state/**', 'data/model'],
    data: ['data/**'],
    server: ['server/**', 'data/**'],
    themes: ['themes/**']
};

const IMPORT = /(?:^|[\s;])(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;

function layerOf(id: string): string {
    return id.split('/')[0];
}

function matches(pattern: string, id: string): boolean {
    if (pattern.endsWith('/**')) {
        const folder = pattern.slice(0, -3);
        return id === folder || id.startsWith(`${folder}/`);
    }
    return id === pattern;
}

function sourceFiles(root: string, prefix = ''): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(join(root, prefix), { withFileTypes: true })) {
        const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
        if (entry.isDirectory()) found.push(...sourceFiles(root, rel));
        else if (/\.(ts|svelte)$/.test(entry.name)) found.push(rel);
    }
    return found;
}

/** The lib-relative module a specifier names, or null when it names something outside lib. */
function target(fileRel: string, spec: string): string | null {
    let id: string | null = null;
    if (spec.startsWith('$lib/')) id = spec.slice('$lib/'.length);
    else if (spec.startsWith('.')) {
        const joined = normalize(join(dirname(fileRel), spec))
            .split(sep)
            .join('/');
        id = joined.startsWith('..') ? null : joined;
    }
    if (id === null) return null;
    return id.replace(/\.(ts|js)$/, '');
}

export function findViolations(libRoot: string): string[] {
    const violations: string[] = [];
    for (const fileRel of sourceFiles(libRoot)) {
        const layer = layerOf(fileRel);
        if (!LAYERS.includes(layer)) continue;
        const allowed = ALLOWED[layer];
        const text = readFileSync(join(libRoot, fileRel), 'utf8');
        for (const match of text.matchAll(IMPORT)) {
            const id = target(fileRel, match[1]);
            if (id === null) continue;
            if (!allowed.some((pattern) => matches(pattern, id))) {
                violations.push(`${fileRel} imports ${id}`);
            }
        }
    }
    return violations.sort();
}

describe('layer boundaries', () => {
    it('holds across src/lib', () => {
        expect(findViolations(LIB)).toEqual([]);
    });

    it('catches a violation of every row it can be shown one of', () => {
        const dir = mkdtempSync(join(tmpdir(), 'oculus-boundaries-'));
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);

        const write = (rel: string, body: string) => {
            const full = join(dir, rel);
            expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
            mkdirSync(dirname(full), { recursive: true });
            writeFileSync(full, body);
        };

        write(
            'ui/Good.svelte',
            "<script>\nimport { t } from '$lib/state/text';\nimport './Card.svelte';\n</script>"
        );
        write('ui/Card.svelte', '<span></span>');
        write('ui/Bad.svelte', "<script>\nimport Focus from '../views/Focus.svelte';\n</script>");
        write('shell/Bad.ts', "import { branch } from '$lib/server/git';");
        write('views/Focus.svelte', "<script>\nimport Other from './Other.svelte';\n</script>");
        write('views/Other.svelte', '<span></span>');
        write('state/bad.svelte.ts', "import { read } from '$lib/data/sources/config';");
        write('server/git.ts', "import type { Project } from '../data/model.ts';");

        expect(findViolations(dir)).toEqual([
            'shell/Bad.ts imports server/git',
            'state/bad.svelte.ts imports data/sources/config',
            'ui/Bad.svelte imports views/Focus.svelte',
            'views/Focus.svelte imports views/Other.svelte'
        ]);
    });
});
