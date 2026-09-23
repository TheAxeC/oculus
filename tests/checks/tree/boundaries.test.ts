// The import graph respects the layers of DESIGN.md, section "Boundaries".
// Every module under src/lib is read, its import specifiers are extracted, and each one is
// checked against the row of the table its own folder sits in. Anything the row does not
// allow is a violation: the table's "May import" column is the whole permission.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { DELIBERATE, HELD } from './allow-styling.ts';
import { isReason } from '../../fixtures/reason.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const LIB = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..', 'src', 'lib');
const SRC = resolve(LIB, '..');

const LAYERS = ['data', 'server', 'server/transcripts', 'state', 'ui', 'shell', 'views', 'themes'];

// One entry per row of the table. A pattern ending in /** matches the folder and everything
// under it; any other pattern matches exactly. The view registry is the one module the shell
// and the views share, so a view can register itself without importing another view.
//
// A block two views draw the same way lives under `views/shared/**` once instead of twice, and only
// a view may import it. A file under `views/shared/` is in the views layer itself, so the row binds
// it too and it may reach no other view's partials.
//
// `data/helpers/guards`, `data/accounts/calendar`, `data/accounts/mail`, `data/helpers/dates`,
// `data/helpers/deck`, `data/helpers/editor`, `data/accounts/leads`, `data/helpers/worktrees`,
// `data/helpers/text-kind`, `data/helpers/opens-in-program`, `data/helpers/tasks` and
// `data/helpers/search` and `data/helpers/finding-text` join `data/model` in the state row as pure
// helpers with no reader and no I/O. `data/accounts/calendar` and `data/accounts/mail` are there
// because how a connector account is named, and how old a thread is, are read by the server that
// builds the credential file and reads the mailbox and by the page that presses Connect and draws
// the age on a card; `data/helpers/deck` because the deck's placement rule has two readers, the
// Present view and the write that saves a selection, and a copy of it on each side would let them
// disagree about what a slide key is; `data/accounts/leads` for the same reason, since the statuses
// that close a lead are read by the Position Leads view, its badge and the ticker on the
// client, and by the summary the snapshot carries on the server; `data/helpers/worktrees` likewise,
// the Repositories view naming the path a worktree will take and the write making it;
// `data/helpers/text-kind`, the file browser deciding which tab a file opens in and the source
// route refusing a save over bytes no editor could have read; `data/helpers/opens-in-program`, the
// open endpoint opening only a file whose extension `open.program_ext` lists and the cards and the
// file view offering the control for that name alone; `data/helpers/tasks`, the server building an
// update task's argv from the `tasks:` block and the update tray asking that block whether the task
// it is about to start runs unattended; `data/helpers/editor`, the server requiring
// `editor.paint_limit_kb` at start and the source editor reading the same cap out of the
// configuration it was sent; and `data/helpers/search`, the Search view refusing a query before it
// sends it and the search route refusing the same query when it arrives, from one rule and one
// argument list; and `data/helpers/finding-text`, whose placeholder rule is the one the client's
// t() fills a catalog string with and the one the server words every finding with before the
// snapshot carries it; and `data/sources/config/rail`, the rule over the `rail:` list of
// config/layout.yml, which the page drawing the rail, the Settings view editing it and the server
// writing it and wording its findings all read, so the three agree on which entries are pages. The
// model's own concern modules (`data/model-*`) are reached through the facade only, which is why
// they are not listed here.
//
// The shell's row names the state modules the workbench is made of, one at a time, and the folder
// `state/workbench/navigation/`, whose modules (the rail's pages, the view catalogue and its keys,
// what a page is called and what closing it asks) the shell and the views both read. The one drag
// in progress is the drag store's, which the shell's strips start and draw and the Pages view
// starts for a page carried out of its list. A shell component reaches those stores through the
// client object (`state/client/context`, read with `state/client/use`), which names every store
// there is, so the row alone would no longer hold the shell to its own: the stores a shell file may
// take out of the object are SHELL_STORES below, and the second rule checks each destructuring
// against that list.
//
// `state/client/context` is where the client's stores are wired together, so it is the one module
// of the state layer that names the view registry and the primitives' tooltip counter.
const ALLOWED: Record<string, string[]> = {
    ui: ['ui/**', 'themes/**', 'state/words/text'],
    shell: [
        'shell/**',
        'ui/**',
        'state/client/context',
        'state/client/use',
        'state/client/instance-context',
        'state/workbench/layout',
        'state/workbench/drag',
        'state/workbench/ui',
        'state/words/text',
        'state/words/appearance',
        'state/workbench/palette',
        'state/workbench/palette-source',
        'state/workbench/selection',
        'state/workbench/navigation/**',
        'state/sessions/terminals',
        'views/registry'
    ],
    views: ['ui/**', 'state/**', 'views/registry', 'views/shared/**'],
    state: [
        'state/**',
        'data/model',
        'data/helpers/guards',
        'data/accounts/calendar',
        'data/accounts/mail',
        'data/helpers/dates',
        'data/helpers/deck',
        'data/accounts/leads',
        'data/helpers/worktrees',
        'data/helpers/text-kind',
        'data/helpers/opens-in-program',
        'data/helpers/tasks',
        'data/helpers/editor',
        'data/helpers/search',
        'data/helpers/finding-text',
        'data/sources/config/rail',
        'views/registry',
        'ui/menu/tip-ids'
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

// A view is a folder `views/<group>/<name>/`: the view's component and its partials, and nothing
// else may import them. It is the one way a view too large for one file is split without widening
// the row that forbids a view importing another view: everything under `views/boards/focus/` may
// import `views/boards/focus/**`, and nothing under `views/boards/projects/` may, although both sit
// in the same group. `views/shared/**` and `views/registry` are the row's own, open to every view.
function ownPartials(fileRel: string): string[] {
    const parts = fileRel.split('/');
    if (parts[0] !== 'views' || parts[1] === 'shared' || parts.length < 4) return [];
    return [`views/${parts[1]}/${parts[2]}/**`];
}

// An exact pattern also covers the runes module of the same name: `state/workbench/layout` is one
// module in two places, the pure half in state/workbench/layout/ and the store in
// state/workbench/layout.svelte.ts, and the row names the module. It covers that one name and no
// other, so `state/client/entities.svelte` is still refused to the shell, which the synthetic case
// below shows.
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
        // are built per client by state/client/context.ts and reached through Svelte's context, so
        // the same rule covers the client, with the catalogs named in FROZEN as the whole
        // exception.
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
 * state/words/text.ts, state/words/tones.ts and state/words/appearance.ts hold what the server last
 * sent, are never written after a push installs them, and are read by t(), toneOf() and themes()
 * from every layer, `ui/` included, where there is no client object to read them from. The two
 * runes beside them, state/client/generation.svelte.ts and state/words/glyphmode.svelte.ts, are
 * what makes those reads redraw: a generation held per client would say a push had landed for one
 * client and not for another over the one set of maps they both read.
 */
const FROZEN = [
    'lib/server/content/audit/publications.ts:STOPWORDS',
    'lib/server/machine/pty/channel.ts:CHANGE_EVENTS',
    'lib/server/machine/pty/tmux.ts:SINGLES',
    'lib/state/words/text.ts:catalog',
    'lib/state/words/text.ts:glyphs',
    'lib/state/words/text.ts:ascii',
    'lib/state/words/text.ts:icons',
    'lib/state/words/tones.ts:palette',
    'lib/state/words/tones.ts:statusPalette',
    'lib/state/words/tones.ts:typeColor',
    'lib/state/words/tones.ts:legend',
    'lib/state/words/tones.ts:domainColor',
    'lib/state/words/tones.ts:domainText',
    'lib/state/words/tones.ts:dataAccess',
    'lib/state/words/appearance.ts:list',
    'lib/state/words/appearance.ts:byName',
    'lib/state/words/appearance.ts:paper',
    'lib/state/words/appearance.ts:crt',
    'lib/state/words/appearance.ts:terminalFont',
    'lib/state/client/generation.svelte.ts:held',
    'lib/state/words/glyphmode.svelte.ts:held'
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

/** The style block of a component, or the empty string where it has none. */
function styleOf(text: string): string {
    const found = /<style[^>]*>([\s\S]*?)<\/style>/.exec(text);
    return found === null ? '' : found[1];
}

/** Every class name a selector text names. */
function classesIn(selector: string): string[] {
    return [...selector.matchAll(/\.([A-Za-z][\w-]*)/g)].map((found) => found[1]);
}

/**
 * Every class a primitive declares as its own, with the primitives that declare it.
 *
 * What a primitive writes inside `:global(...)` is not its own: that is how it reads the theme
 * class the body carries, and a consumer naming the same class is naming the theme, not the
 * primitive.
 */
export function primitiveClasses(libRoot: string): Map<string, string[]> {
    const owners = new Map<string, string[]>();
    for (const fileRel of sourceFiles(libRoot)) {
        if (!fileRel.startsWith('ui/') || !fileRel.endsWith('.svelte')) continue;
        const style = styleOf(readFileSync(join(libRoot, fileRel), 'utf8')).replace(
            /:global\([^)]*\)/g,
            ' '
        );
        for (const held of classesIn(style)) {
            owners.set(held, [...new Set([...(owners.get(held) ?? []), fileRel])].sort());
        }
    }
    return owners;
}

/**
 * Every `:global(...)` rule in a view or a shell component that names a primitive's own class.
 *
 * A primitive owns how it is drawn; a consumer that reaches past its props into its markup is the
 * coupling the layer table forbids in the one direction the import graph cannot see.
 */
export function findPrimitiveStyling(libRoot: string, allow: string[] = []): string[] {
    const owners = primitiveClasses(libRoot);
    const found = new Set<string>();
    for (const fileRel of sourceFiles(libRoot)) {
        if (!fileRel.endsWith('.svelte')) continue;
        if (!fileRel.startsWith('views/') && !fileRel.startsWith('shell/')) continue;
        const style = styleOf(readFileSync(join(libRoot, fileRel), 'utf8'));
        for (const rule of style.matchAll(/:global\(([^)]*)\)/g)) {
            for (const held of classesIn(rule[1])) {
                const owned = owners.get(held);
                if (owned === undefined) continue;
                const where = selectorAt(style, rule.index);
                const line = `${fileRel} styles .${held} of ${owned.join(', ')} through ${where}`;
                if (allow.includes(line)) continue;
                found.add(line);
            }
        }
    }
    return [...found].sort();
}

/**
 * The whole selector a `:global(...)` sits in, from the end of the rule before it to its brace.
 *
 * The entry of the allow list is keyed on this rather than on the file and the class, so a second,
 * unrelated rule for the same class in a file already on the list is a violation of its own.
 */
function selectorAt(style: string, at: number): string {
    const before = Math.max(style.lastIndexOf('}', at), style.lastIndexOf('{', at));
    const brace = style.indexOf('{', at);
    const span = style.slice(before + 1, brace === -1 ? style.length : brace);
    return span
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

const made: string[] = [];

afterEach(() => {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A scratch root inside the temporary directory, removed when the case ends. */
function scratch(name: string): string {
    const dir = scratchDir(name);
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    made.push(dir);
    return dir;
}

describe('layer boundaries', () => {
    it('holds across src/lib', () => {
        // revert: tests/checks/tree/boundaries.test.ts:92 => views: ['state/**', 'views/registry'],
        expect(findViolations(LIB)).toEqual([]);
    });

    it('holds no process-wide state under src', () => {
        // revert: tests/checks/tree/boundaries.test.ts:259 => delete
        expect(findGlobalState(SRC)).toEqual([]);
    });

    it('keeps every shell file to the stores its row names', () => {
        // revert: tests/checks/tree/boundaries.test.ts:281 => delete
        expect(findShellStores(LIB)).toEqual([]);
    });

    it('catches a shell file reading a store the shell may not read', () => {
        // revert: tests/checks/tree/boundaries.test.ts:305 => delete
        const dir = scratch('oculus-shell-stores-');
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
        // revert: tests/checks/tree/boundaries.test.ts:220 => delete
        const dir = scratch('oculus-global-state-');
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
        // revert: tests/checks/tree/boundaries.test.ts:184 => if (false) {
        const dir = scratch('oculus-boundaries-');

        const write = (rel: string, body: string) => {
            const full = join(dir, rel);
            expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
            mkdirSync(dirname(full), { recursive: true });
            writeFileSync(full, body);
        };

        write(
            'ui/Good.svelte',
            "<script>\nimport { t } from '$lib/state/words/text';\nimport './Card.svelte';\n</script>"
        );
        write('ui/Card.svelte', '<span></span>');
        write(
            'ui/Bad.svelte',
            "<script>\nimport Focus from '../views/boards/focus/Focus.svelte';\n</script>"
        );
        write(
            'ui/Shared.svelte',
            "<script>\nimport Sub from '../views/shared/forms/Subtasks.svelte';\n</script>"
        );
        write('shell/Bad.ts', "import { branch } from '$lib/server/git/git';");
        write('shell/Shared.ts', "import Sub from '$lib/views/shared/forms/Subtasks.svelte';");
        write('shell/Runes.ts', "import { portfolio } from '$lib/state/client/entities.svelte';");
        write('shell/Store.ts', "import { apply } from '$lib/state/workbench/layout.svelte';");
        write(
            'views/boards/focus/Focus.svelte',
            "<script>\nimport Map from '../../structure/map/Map.svelte';\nimport Cc from './CommandCenter.svelte';\nimport Sub from '../../shared/forms/Subtasks.svelte';\n</script>"
        );
        write('views/shared/forms/Subtasks.svelte', '<span></span>');
        write(
            'views/shared/Card.svelte',
            "<script>\nimport Bad from '../boards/projects/Card.svelte';\n</script>"
        );
        write('views/boards/projects/Card.svelte', '<span></span>');
        write(
            'views/structure/map/Map.svelte',
            "<script>\nimport Cc from '../../boards/focus/CommandCenter.svelte';\n</script>"
        );
        // A sibling view of the same group is another view: the rule is the view's own folder,
        // never the group's.
        // revert: tests/checks/tree/boundaries.test.ts:134 => return [`views/${parts[1]}/**`];
        write(
            'views/boards/focus/CommandCenter.svelte',
            "<script>\nimport Row from './Row.svelte';\nimport Bad from '../projects/Projects.svelte';\n</script>"
        );
        write('views/boards/focus/Row.svelte', '<span></span>');
        write('views/boards/projects/Projects.svelte', '<span></span>');
        write('state/bad.svelte.ts', "import { read } from '$lib/data/sources/config';");
        write('state/good.ts', "import { isMap } from '$lib/data/helpers/guards';");
        write('server/git/git.ts', "import type { Project } from '../../data/model.ts';");
        write(
            'server/transcripts/bad.ts',
            "import { scan } from '../sessions/stores/transcripts.ts';"
        );

        expect(findViolations(dir)).toEqual([
            'server/transcripts/bad.ts imports server/sessions/stores/transcripts',
            'shell/Bad.ts imports server/git/git',
            'shell/Runes.ts imports state/client/entities.svelte',
            'shell/Shared.ts imports views/shared/forms/Subtasks.svelte',
            'state/bad.svelte.ts imports data/sources/config',
            'ui/Bad.svelte imports views/boards/focus/Focus.svelte',
            'ui/Shared.svelte imports views/shared/forms/Subtasks.svelte',
            'views/boards/focus/CommandCenter.svelte imports views/boards/projects/Projects.svelte',
            'views/boards/focus/Focus.svelte imports views/structure/map/Map.svelte',
            'views/shared/Card.svelte imports views/boards/projects/Card.svelte',
            'views/structure/map/Map.svelte imports views/boards/focus/CommandCenter.svelte'
        ]);
    });

    // revert: tests/checks/tree/allow-styling.ts:72 => line: 'views/sources/search/Results.svelte styles .label of ui/controls/Chip.svelte, ui/tabs/Tabs.svelte, ui/controls/Tag.svelte through .hit :global(.label)',
    it('lets no view or shell component style a primitive own class', () => {
        // revert: tests/checks/tree/boundaries.test.ts:369 => delete
        expect(
            findPrimitiveStyling(
                LIB,
                [...DELIBERATE, ...HELD].map((one) => one.line)
            )
        ).toEqual([]);
    });

    it('catches a view reaching into a primitive, and passes the theme class and its own', () => {
        // revert: tests/checks/tree/boundaries.test.ts:365 => const owned = undefined;
        const dir = scratch('oculus-primitive-styling-');
        const write = (rel: string, body: string) => {
            const full = join(dir, rel);
            expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
            mkdirSync(dirname(full), { recursive: true });
            writeFileSync(full, body);
        };

        write(
            'ui/controls/ToolButton.svelte',
            '<button class="tool"></button>\n<style>\n    .tool {\n        color: red;\n    }\n    :global(body.wall) .tool {\n        color: blue;\n    }\n</style>'
        );
        write(
            'views/Bad.svelte',
            '<div class="row"></div>\n<style>\n    .row :global(.tool) {\n        gap: 0;\n    }\n</style>'
        );
        write(
            'shell/AlsoBad.svelte',
            '<div class="strip"></div>\n<style>\n    .strip :global(.tool:hover) {\n        gap: 0;\n    }\n</style>'
        );
        write(
            'views/Good.svelte',
            '<div class="row"></div>\n<style>\n    :global(body.wall) .row {\n        gap: 0;\n    }\n    .row :global(.own) {\n        gap: 0;\n    }\n</style>'
        );

        const alsoBad =
            'shell/AlsoBad.svelte styles .tool of ui/controls/ToolButton.svelte through .strip :global(.tool:hover)';
        const bad =
            'views/Bad.svelte styles .tool of ui/controls/ToolButton.svelte through .row :global(.tool)';
        expect(findPrimitiveStyling(dir)).toEqual([alsoBad, bad]);
        expect(findPrimitiveStyling(dir, [bad])).toEqual([alsoBad]);
    });

    it('holds every styling entry to a reason', () => {
        // revert: tests/checks/tree/allow-styling.ts:17 => why: 'x'
        const bare = [...DELIBERATE, ...HELD].filter((one) => !isReason(one.why, one.line));
        expect(bare.map((one) => one.line)).toEqual([]);
        expect(isReason('x')).toBe(false);
        expect(isReason('the rule sizes the primitive inside the band')).toBe(true);
    });

    it('holds the styling lists to rules the tree still has', () => {
        // revert: tests/checks/tree/boundaries.test.ts:370 => delete
        const held = findPrimitiveStyling(LIB);
        expect(
            [...DELIBERATE, ...HELD]
                .filter((one) => !held.includes(one.line))
                .map((one) => one.line)
        ).toEqual([]);
    });
});
