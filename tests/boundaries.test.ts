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
// `data/guards`, `data/dates` and `data/deck` join `data/model` in the state row as pure helpers with
// no reader and no I/O. `data/deck` is there because the deck's placement rule has two readers, the
// Present view and the write that saves a selection, and a copy of it on each side would let them
// disagree about what a slide key is. The model's own concern modules (`data/model-*`) are reached
// through the facade only, which is why they are not listed here.
//
// The shell's row names the state modules the workbench is made of, one at a time. The one drag in progress belongs to the shell, as do the theme picker and the configuration it offers; views do not read or write either concern. A shell component reaches those stores through the client object (`state/context`, read with `state/use`), which names every store there is, so the row alone would no longer hold the shell to its own: the stores a shell file may take out of the object are SHELL_STORES below, and the second rule checks each destructuring against that list.
//
// `state/context` is where the client's stores are wired together, so it is the one module of the state layer that names the view registry and the primitives' tooltip counter.
const ALLOWED: Record<string, string[]> = {
    ui: ['ui/**', 'themes/**', 'state/text'],
    shell: [
        'shell/**',
        'ui/**',
        'state/context',
        'state/use',
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
    state: [
        'state/**',
        'data/model',
        'data/guards',
        'data/dates',
        'data/deck',
        'views/registry',
        'ui/tip-ids'
    ],
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
// two places, the pure half in state/layout/ and the store in state/layout.svelte.ts, and the row
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

/** Whether a file's module-level bindings are checked: the server's, the routes', the client's. */
function holdsModuleState(fileRel: string): boolean {
    return (
        fileRel.startsWith('lib/server/') ||
        fileRel.startsWith('routes/') ||
        fileRel.startsWith('lib/state/') ||
        fileRel.startsWith('lib/shell/') ||
        fileRel.startsWith('lib/ui/') ||
        fileRel === 'lib/views/registry.ts'
    );
}

/**
 * The lines whose bindings are module-level. A .ts file's are all of them; a component's are its
 * `<script module>` block alone, since what its instance script declares belongs to one mounted
 * component and not to the module.
 */
function moduleLines(fileRel: string, text: string): string[] {
    if (!fileRel.endsWith('.svelte')) return text.split('\n');
    const found = /<script[^>]*\bmodule\b[^>]*>([\s\S]*?)<\/script>/.exec(text);
    return found === null ? [] : found[1].replace(/^ {4}/gm, '').split('\n');
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
        // module-level collection there is shared state nothing owns. The client is one graph, and
        // a collection held at module level there is every open page sharing one store: the stores
        // are built per client by state/context.ts and reached through Svelte's context, so the
        // same rule covers the client, with the catalogs named in FROZEN as the whole exception.
        if (!holdsModuleState(fileRel)) continue;
        for (const line of moduleLines(fileRel, text)) {
            const held =
                /^(?:export )?const (\w+)(?::[^=]+)? = (?:new (?:Map|Set)\b|\{\}|\[\]|\$state)/.exec(
                    line
                ) ?? /^(?:export )?let (\w+)\b/.exec(line);
            if (held !== null && !FROZEN.includes(`${fileRel}:${held[1]}`)) {
                violations.push(`${fileRel} holds module-level state in ${held[1]}`);
            }
        }
    }
    return violations.sort();
}

/**
 * Module-level bindings that are not a store, listed by name.
 *
 * The server's three are lookup tables written once at load. The client's are the four catalogs:
 * state/text.ts, state/tones.ts and state/appearance.ts hold what the server last sent, are never
 * written after a push installs them, and are read by t(), toneOf() and themes() from every layer,
 * `ui/` included, where there is no client object to read them from. The two runes beside them,
 * state/generation.svelte.ts and state/glyphmode.svelte.ts, are what makes those reads redraw: a
 * generation held per client would say a push had landed for one client and not for another over
 * the one set of maps they both read.
 */
const FROZEN = [
    'lib/server/audit.ts:STOPWORDS',
    'lib/server/pty/channel.ts:CHANGE_EVENTS',
    'lib/server/pty/tmux.ts:SINGLES',
    'lib/state/text.ts:catalog',
    'lib/state/text.ts:glyphs',
    'lib/state/text.ts:ascii',
    'lib/state/text.ts:icons',
    'lib/state/tones.ts:palette',
    'lib/state/tones.ts:statusPalette',
    'lib/state/tones.ts:typeColor',
    'lib/state/tones.ts:legend',
    'lib/state/tones.ts:domainColor',
    'lib/state/tones.ts:domainText',
    'lib/state/tones.ts:dataAccess',
    'lib/state/appearance.ts:list',
    'lib/state/appearance.ts:byName',
    'lib/state/appearance.ts:paper',
    'lib/state/appearance.ts:crt',
    'lib/state/appearance.ts:terminalFont',
    'lib/state/generation.svelte.ts:held',
    'lib/state/glyphmode.svelte.ts:held'
];

/** The stores a shell file may take out of the client object: the shell's row, by store name. */
const SHELL_STORES = [
    'layout',
    'drag',
    'ui',
    'selection',
    'terminals',
    'paletteSource',
    'registry'
];

/**
 * A shell file reading a store the shell's row does not name, whether it destructures it out of the
 * client object or reaches it by name. The row lists modules, and the client object names every
 * store there is, so this is what keeps the shell to its own concerns.
 *
 * The one thing it cannot follow is the whole object passed on: the rail and the pane strip hand it
 * to badgeOf(), so that a view's own badge hook reads the view's own stores.
 */
export function findShellStores(libRoot: string): string[] {
    const violations: string[] = [];
    for (const fileRel of sourceFiles(libRoot)) {
        if (!fileRel.startsWith('shell/')) continue;
        const text = readFileSync(join(libRoot, fileRel), 'utf8');
        const read = (name: string) => {
            if (name === '' || SHELL_STORES.includes(name)) return;
            violations.push(`${fileRel} reads store ${name}`);
        };
        for (const match of text.matchAll(
            /const\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\s*=\s*(?:client|useState\(\))/g
        )) {
            for (const part of match[1].split(/,(?![^{]*\})/)) read(part.split(':')[0].trim());
        }
        for (const match of text.matchAll(/\bclient\.(\w+)/g)) read(match[1]);
    }
    return violations.sort();
}

describe('layer boundaries', () => {
    it('holds across src/lib', () => {
        expect(findViolations(LIB)).toEqual([]);
    });

    it('holds no process-wide state under src', () => {
        expect(findGlobalState(SRC)).toEqual([]);
    });

    it('keeps every shell file to the stores its row names', () => {
        expect(findShellStores(LIB)).toEqual([]);
    });

    it('catches a shell file reading a store the shell may not read', () => {
        const dir = mkdtempSync(join(tmpdir(), 'oculus-shell-stores-'));
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        mkdirSync(join(dir, 'shell'), { recursive: true });
        writeFileSync(
            join(dir, 'shell', 'Bad.svelte'),
            '<script>\nconst {\n    layout: { openView },\n    entities: { portfolio }\n} = useState();\nconst held = client.files.files(id);\n</script>'
        );
        expect(findShellStores(dir)).toEqual([
            'shell/Bad.svelte reads store entities',
            'shell/Bad.svelte reads store files'
        ]);
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
        mkdirSync(join(dir, 'lib', 'state'), { recursive: true });
        writeFileSync(
            join(dir, 'lib', 'state', 'held.svelte.ts'),
            'const rows = $state({});\nconst pure = (id: string) => id;\n'
        );
        expect(findGlobalState(dir)).toEqual([
            'bad.ts declares global state',
            'bad.ts uses globalThis',
            'lib/server/held.ts holds module-level state in cache',
            'lib/server/held.ts holds module-level state in recorder',
            'lib/state/held.svelte.ts holds module-level state in rows'
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
