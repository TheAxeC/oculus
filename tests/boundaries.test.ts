// The import graph respects the layers of DESIGN.md, section "Boundaries".
// Every module under src/lib is read, its import specifiers are extracted, and each one is
// checked against the row of the table its own folder sits in. Anything the row does not
// allow is a violation: the table's "May import" column is the whole permission.

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const LIB = resolve(fileURLToPath(import.meta.url), '..', '..', 'src', 'lib');
const SRC = resolve(LIB, '..');

const LAYERS = ['data', 'server', 'server/transcripts', 'state', 'ui', 'shell', 'views', 'themes'];

// One entry per row of the table. A pattern ending in /** matches the folder and everything
// under it; any other pattern matches exactly. The view registry is the one module the shell
// and the views share, so a view can register itself without importing another view.
//
// A block two views draw the same way lives under `views/shared/**` once instead of twice, and only a view may import it. A file under `views/shared/` is in the views layer itself, so the row binds it too and it may reach no other view's partials.
//
// `data/guards` and `data/dates` join `data/model` in the state row as pure helpers with no reader
// and no I/O. The model's own concern modules (`data/model-*`) are reached through the facade only,
// which is why they are not listed here.
//
// The shell's row names the state modules the workbench is made of, one at a time. The one drag in progress belongs to the shell, as do the theme picker and the configuration it offers; views do not read or write either concern.
const ALLOWED: Record<string, string[]> = {
    ui: ['ui/**', 'themes/**', 'state/text'],
    shell: [
        'shell/**',
        'ui/**',
        'state/layout',
        'state/drag',
        'state/ui',
        'state/text',
        'state/appearance',
        'state/palette',
        'state/palette-source',
        'state/selection',
        'state/terminals',
        'views/registry'
    ],
    views: ['ui/**', 'state/**', 'views/registry', 'views/shared/**'],
    state: ['state/**', 'data/model', 'data/guards', 'data/dates'],
    data: ['data/**'],
    server: ['server/**', 'data/**'],
    'server/transcripts': ['server/transcripts/**', 'data/**'],
    themes: ['themes/**']
};

const IMPORT = /(?:^|[\s;])(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;

function layerOf(id: string): string {
    if (id.startsWith('server/transcripts/')) return 'server/transcripts';
    return id.split('/')[0];
}

// A view may import partials from its own folder `views/<name>/`, and nothing else may import
// them. It is the one way a view too large for one file is split without widening the row that
// forbids a view importing another view: `views/Focus.svelte` and everything under `views/focus/`
// may import `views/focus/**`, and `views/Projects.svelte` may not.
function ownPartials(fileRel: string): string[] {
    const parts = fileRel.split('/');
    if (parts[0] !== 'views' || parts.length < 2) return [];
    if (parts.length > 2) return [`views/${parts[1]}/**`];
    return [`views/${parts[1].replace(/\.(ts|svelte)$/, '').toLowerCase()}/**`];
}

// An exact pattern also covers the runes module of the same name: `state/layout` is one module in
// two files, the pure half in state/layout.ts and the store in state/layout.svelte.ts, and the row
// names the module. It covers that one name and no other, so `state/entities.svelte` is still
// refused to the shell, which the synthetic case below shows.
function matches(pattern: string, id: string): boolean {
    if (pattern.endsWith('/**')) {
        const folder = pattern.slice(0, -3);
        return id === folder || id.startsWith(`${folder}/`);
    }
    return id === pattern || id === `${pattern}.svelte`;
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
        const allowed = [...ALLOWED[layer], ...ownPartials(fileRel)];
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

/** Process-wide state is forbidden under src; app.d.ts alone declares Kit's App namespace. */
export function findGlobalState(sourceRoot: string): string[] {
    const violations: string[] = [];
    for (const fileRel of sourceFiles(sourceRoot)) {
        const text = readFileSync(join(sourceRoot, fileRel), 'utf8');
        if (/\bglobalThis\b/.test(text)) violations.push(`${fileRel} uses globalThis`);
        if (fileRel !== 'app.d.ts' && /\bdeclare\s+global\b/.test(text)) {
            violations.push(`${fileRel} declares global state`);
        }
        // The server runs as two module graphs (the built handler and the Node entry), so a
        // module-level collection there is shared state nothing owns; the client's state modules
        // hold their runes at module level by the state layer's design and are one graph.
        if (!fileRel.startsWith('lib/server/') && !fileRel.startsWith('routes/')) continue;
        for (const line of text.split('\n')) {
            const held =
                /^(?:export )?const (\w+)(?::[^=]+)? = (?:new (?:Map|Set)\b|\{\}|\[\])/.exec(
                    line
                ) ?? /^(?:export )?let (\w+)\b/.exec(line);
            if (held !== null && !FROZEN.includes(`${fileRel}:${held[1]}`)) {
                violations.push(`${fileRel} holds module-level state in ${held[1]}`);
            }
        }
    }
    return violations.sort();
}

/** Module-level collections that are never written after load: lookup tables, listed by name. */
const FROZEN = ['lib/server/pty/channel.ts:CHANGE_EVENTS', 'lib/server/pty/tmux.ts:SINGLES'];

describe('layer boundaries', () => {
    it('holds across src/lib', () => {
        expect(findViolations(LIB)).toEqual([]);
    });

    it('holds no process-wide state under src', () => {
        expect(findGlobalState(SRC)).toEqual([]);
    });

    it('catches process-wide state outside app.d.ts', () => {
        const dir = mkdtempSync(join(tmpdir(), 'oculus-global-state-'));
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        mkdirSync(join(dir, 'lib', 'server'), { recursive: true });
        writeFileSync(join(dir, 'bad.ts'), 'declare global {}\nconst held = globalThis.value;\n');
        writeFileSync(
            join(dir, 'lib', 'server', 'held.ts'),
            'const cache = new Map<string, string>();\nlet recorder = null;\n'
        );
        writeFileSync(join(dir, 'app.d.ts'), 'declare global { namespace App {} }\n');
        expect(findGlobalState(dir)).toEqual([
            'bad.ts declares global state',
            'bad.ts uses globalThis',
            'lib/server/held.ts holds module-level state in cache',
            'lib/server/held.ts holds module-level state in recorder'
        ]);
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
        write(
            'ui/Shared.svelte',
            "<script>\nimport Sub from '../views/shared/Subtasks.svelte';\n</script>"
        );
        write('shell/Bad.ts', "import { branch } from '$lib/server/git';");
        write('shell/Shared.ts', "import Sub from '$lib/views/shared/Subtasks.svelte';");
        write('shell/Runes.ts', "import { portfolio } from '$lib/state/entities.svelte';");
        write('shell/Store.ts', "import { apply } from '$lib/state/layout.svelte';");
        write(
            'views/Focus.svelte',
            "<script>\nimport Other from './Other.svelte';\nimport Cc from './focus/CommandCenter.svelte';\nimport Sub from './shared/Subtasks.svelte';\n</script>"
        );
        write('views/shared/Subtasks.svelte', '<span></span>');
        write(
            'views/shared/Card.svelte',
            "<script>\nimport Bad from '../projects/Card.svelte';\n</script>"
        );
        write('views/projects/Card.svelte', '<span></span>');
        write(
            'views/Other.svelte',
            "<script>\nimport Cc from './focus/CommandCenter.svelte';\n</script>"
        );
        write(
            'views/focus/CommandCenter.svelte',
            "<script>\nimport Row from './Row.svelte';\nimport Bad from '../Projects.svelte';\n</script>"
        );
        write('views/focus/Row.svelte', '<span></span>');
        write('views/Projects.svelte', '<span></span>');
        write('state/bad.svelte.ts', "import { read } from '$lib/data/sources/config';");
        write('state/good.ts', "import { isMap } from '$lib/data/guards';");
        write('server/git.ts', "import type { Project } from '../data/model.ts';");
        write('server/transcripts/bad.ts', "import { scan } from '../sessions/transcripts.ts';");

        expect(findViolations(dir)).toEqual([
            'server/transcripts/bad.ts imports server/sessions/transcripts',
            'shell/Bad.ts imports server/git',
            'shell/Runes.ts imports state/entities.svelte',
            'shell/Shared.ts imports views/shared/Subtasks.svelte',
            'state/bad.svelte.ts imports data/sources/config',
            'ui/Bad.svelte imports views/Focus.svelte',
            'ui/Shared.svelte imports views/shared/Subtasks.svelte',
            'views/Focus.svelte imports views/Other.svelte',
            'views/Other.svelte imports views/focus/CommandCenter.svelte',
            'views/focus/CommandCenter.svelte imports views/Projects.svelte',
            'views/shared/Card.svelte imports views/projects/Card.svelte'
        ]);
    });
});
