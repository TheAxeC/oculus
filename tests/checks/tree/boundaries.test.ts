// Layer 4, tree check. The import graph respects the layers.
// Every module under src/lib is read, its imports are read out of its code by the import checks'
// own reader (tests/checks/imports/graph.ts, type-only ones included), and each one is checked
// against the row of the table its own folder sits in (layer-rows.ts). Anything the row does not
// allow is a violation: the table's "May import" column is the whole permission.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import { DELIBERATE, HELD } from './allow-styling.ts';
import { ALLOWED } from './layer-rows.ts';
import { runtimeImports, sourceFiles } from '../imports/graph.ts';
import { isReason } from '../../fixtures/reason.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { withoutComments } from '../source/code.ts';

const LIB = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..', 'src', 'lib');
const SRC = resolve(LIB, '..');

const LAYERS = ['data', 'server', 'server/transcripts', 'state', 'ui', 'shell', 'views', 'themes'];

function layerOf(id: string): string {
    if (id.startsWith('server/transcripts/')) return 'server/transcripts';
    return id.split('/')[0];
}

// A view is a folder `views/<group>/<name>/`: the view's component and its partials, and nothing
// else may import them. It is the one way a view too large for one file is split without widening
// the row that forbids a view importing another view: everything under `views/boards/focus/` may
// import `views/boards/focus/**`, and nothing under `views/boards/projects/` may, although both sit
// in the same group. `views/shared/**` is the row's own, open to every view.
function ownPartials(fileRel: string): string[] {
    const parts = fileRel.split('/');
    if (parts[0] !== 'views' || parts[1] === 'shared' || parts.length < 4) return [];
    return [`views/${parts[1]}/${parts[2]}/**`];
}

// An exact pattern also covers the runes module of the same name: `state/workbench/layout` is one
// module in two places, the pure half in state/workbench/layout/ and the store in
// state/workbench/layout.svelte.ts, and the row names the module. It covers that one name and no
// other, so `state/client/entities.svelte` is still refused to the shell, which the synthetic case
// below shows. It covers the folder's index module too: `data/model` is data/model/index.ts, the
// facade, and not the concern modules beside it.
function matches(pattern: string, id: string): boolean {
    if (pattern.endsWith('/**')) {
        const folder = pattern.slice(0, -3);
        return id === folder || id.startsWith(`${folder}/`);
    }
    return id === pattern || id === `${pattern}.svelte` || id === `${pattern}/index`;
}

function findViolations(libRoot: string): string[] {
    const violations: string[] = [];
    for (const fileRel of sourceFiles(libRoot)) {
        const layer = layerOf(fileRel);
        if (!LAYERS.includes(layer)) continue;
        const allowed = [...ALLOWED[layer], ...ownPartials(fileRel)];
        const text = readFileSync(join(libRoot, fileRel), 'utf8');
        for (const { id } of runtimeImports(fileRel, text, '', true)) {
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
        fileRel.startsWith('lib/ui/')
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
function findGlobalState(sourceRoot: string): string[] {
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
                /^(?:export )?const (\w+)(?::[^=]+)? = (?:new (?:Map|Set|WeakMap|WeakSet)\b|\{\}|\[\]|\$state)/.exec(
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
 * state/shared/words/text.ts, state/shared/words/tones.ts and state/shared/words/appearance.ts hold
 * what the server last sent, are never written after a push installs them, and are read by t(),
 * toneOf() and themes() from every layer, `ui/` included, where there is no client object to read
 * them from. The two runes beside them, state/shared/words/generation.svelte.ts and
 * state/shared/words/glyphmode.svelte.ts, are what makes those reads redraw: a generation held per
 * client would say a push had landed for one client and not for another over the one set of maps
 * they both read.
 *
 * And the editor's load, ui/controls/editor/kit/load.ts's `loading`: Monaco keeps one theme, one
 * set of key rules and its workers for the whole page, not per client, so the promise that loads it
 * once per page is page state by Monaco's own design, and a second load would register everything
 * twice. The same holds for the rules of the app colour theme in force, ui/theme/app-rules.ts's
 * `held`: the editor reads them for the one theme Monaco holds, and for the languages, grammars,
 * snippets and token rules the acting apps give it,
 * ui/controls/editor/kit/languages/apps.svelte.ts's `held`, `signature` and `version`: Monaco
 * registers a language once for the page, so the kit it was last given, the text of that kit and
 * the count that redraws on a change are page state. The file icon theme of an app is held once for
 * the page the same way, ui/display/icon-theme/held.svelte.ts's `held`, with what the theme is
 * drawn under (whether the colour theme is dark, and the language each file name has): every file
 * icon of the page reads them, from `ui/`, where there is no client object.
 */
const FROZEN = [
    'lib/ui/controls/editor/kit/load.ts:loading',
    'lib/ui/theme/app-rules.ts:held',
    'lib/ui/controls/editor/kit/languages/apps.svelte.ts:held',
    'lib/ui/controls/editor/kit/languages/apps.svelte.ts:signature',
    'lib/ui/controls/editor/kit/languages/apps.svelte.ts:version',
    'lib/ui/display/icon-theme/held.svelte.ts:held',
    'lib/server/content/audit/publications.ts:STOPWORDS',
    'lib/server/machine/pty/channel.ts:CHANGE_EVENTS',
    'lib/server/machine/pty/tmux.ts:SINGLES',
    'lib/state/shared/words/text.ts:catalog',
    'lib/state/shared/words/text.ts:glyphs',
    'lib/state/shared/words/text.ts:ascii',
    'lib/state/shared/words/text.ts:icons',
    'lib/state/shared/words/tones.ts:byHub',
    'lib/state/shared/words/tones.ts:union',
    'lib/state/shared/words/tones.ts:own',
    'lib/state/shared/words/tones.ts:domainColor',
    'lib/state/shared/words/tones.ts:domainText',
    'lib/state/shared/words/appearance.ts:list',
    'lib/state/shared/words/appearance.ts:byName',
    'lib/state/shared/words/appearance.ts:paper',
    'lib/state/shared/words/appearance.ts:look',
    'lib/state/shared/words/appearance.ts:codeTheme',
    'lib/state/shared/words/appearance.ts:terminal',
    'lib/state/shared/words/appearance.ts:tabBar',
    'lib/state/shared/words/appearance.ts:actionsAt',
    'lib/state/shared/words/appearance.ts:wrapping',
    'lib/state/shared/words/generation.svelte.ts:held',
    'lib/state/shared/words/glyphmode.svelte.ts:held'
];

/**
 * The stores a shell file may take out of the client object: the shell's row, by store name. The
 * palette runs the workspace commands through `fs` (switch and save a workspace) and `explorer`
 * (the folder panel), the key that finds in files or replaces in files asks the Search box of the
 * pane in focus for the cursor through `search`, the default build and test keys in shell/keys run
 * a project command through `commands`, CommandAsk.svelte and CommandForm.svelte in shell/commands
 * draw the question and the form `commands` holds, and the tab menu reveals a file and opens it in
 * a program through `writes` and offers Open in Program from the programs `selectors` reads, and
 * the panes, the tab menu and the windows of the desktop app ask the app's host for a window, the
 * find bar and the arrangement's save turn through `desktop`, and the update tray and its schedule
 * list and dialog read and write the schedules through `schedule`, and the status bar's language
 * server items and the palette's choice rows read the servers' states and choices through `lsp`,
 * and the palette's ESLint configuration list reads and approves the configuration through `lint`,
 * and the debugger's questions, toolbar and status bar item read the debug session through `debug`,
 * while the pane strip's breadcrumb reads the symbols of the file in view through `documents`, and
 * the status bar's LaTeX item reads the build of the root in front through `latex` and asks the
 * root of a file through `latexActions`, and the workbench and the browser's float windows read
 * which float a page draws through `float`, and the tab menu opens one through `windows`, and the
 * windows of the desktop app name the page that opens a float's window through `pageId`, and the
 * workbench's save key saves the custom editor of an app in front through `apps`, and the app items
 * of the status bar, the quick input and the modal messages read `appShell`, and the status bar's
 * source items, the palette's task rows and the registration of the languages apps add read the
 * tools the acting apps contribute through `appTools`.
 */
const SHELL_STORES = [
    'commands',
    'explorer',
    'fs',
    'layout',
    'drag',
    'ui',
    'selection',
    'terminals',
    'search',
    'paletteSource',
    'editorStatus',
    'notices',
    'registry',
    'writes',
    'selectors',
    'desktop',
    'schedule',
    'lsp',
    'lint',
    'clone',
    'lspEdits',
    'debug',
    'workspaceSymbols',
    'documents',
    'latex',
    'latexActions',
    'float',
    'windows',
    'pageId',
    'appShell',
    'apps',
    'appTools'
];

/**
 * A shell file reading a store the shell's row does not name, whether it destructures it out of the
 * client object or reaches it by name. The row lists modules, and the client object names every
 * store there is, so this is what keeps the shell to its own concerns.
 *
 * The one thing it cannot follow is the whole object passed on: the rail and the pane strip hand it
 * to badgeOf(), so that a view's own badge hook reads the view's own stores.
 */
function findShellStores(libRoot: string): string[] {
    const violations: string[] = [];
    for (const fileRel of sourceFiles(libRoot)) {
        if (!fileRel.startsWith('shell/')) continue;
        const text = readFileSync(join(libRoot, fileRel), 'utf8');
        const read = (name: string) => {
            if (name === '' || SHELL_STORES.includes(name)) return;
            violations.push(`${fileRel} reads store ${name}`);
        };
        for (const match of text.matchAll(
            /const\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\s*=\s*(?:client|useState\(\)|deps\.client)/g
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
function primitiveClasses(libRoot: string): Map<string, string[]> {
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
function findPrimitiveStyling(libRoot: string, allow: string[] = []): string[] {
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
    const bare = withoutComments('style.css', style);
    const before = Math.max(bare.lastIndexOf('}', at), bare.lastIndexOf('{', at));
    const brace = bare.indexOf('{', at);
    const span = bare.slice(before + 1, brace === -1 ? bare.length : brace);
    return span.replace(/\s+/g, ' ').trim();
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
        const dir = scratchDir('oculus-shell-stores-');
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
        const dir = scratchDir('oculus-global-state-');
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
        const dir = scratchDir('oculus-boundaries-');

        const write = (rel: string, body: string) => {
            const full = join(dir, rel);
            expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
            mkdirSync(dirname(full), { recursive: true });
            writeFileSync(full, body);
        };

        write(
            'ui/Good.svelte',
            "<script>\nimport { t } from '$lib/state/shared/words/text';\nimport './Card.svelte';\n</script>"
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
        write('shell/Bad.ts', "import { branch } from '$lib/server/core/git/git';");
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
        write(
            'views/boards/focus/CommandCenter.svelte',
            "<script>\nimport Row from './Row.svelte';\nimport Bad from '../projects/Projects.svelte';\n</script>"
        );
        write('views/boards/focus/Row.svelte', '<span></span>');
        write('views/boards/projects/Projects.svelte', '<span></span>');
        write('state/bad.svelte.ts', "import { read } from '$lib/data/sources/config';");
        write('state/good.ts', "import { isMap } from '$lib/data/helpers/guards';");
        write('server/core/git/git.ts', "import type { Project } from '../../../data/model.ts';");
        write(
            'server/transcripts/bad.ts',
            "import { scan } from '../sessions/stores/transcripts.ts';"
        );

        expect(findViolations(dir)).toEqual([
            'server/transcripts/bad.ts imports server/sessions/stores/transcripts',
            'shell/Bad.ts imports server/core/git/git',
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

    it('admits the index module of a folder a row names exactly, and no other module in it', () => {
        const dir = scratchDir('oculus-boundaries-index-');
        const full = join(dir, 'state', 'reads.ts');
        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(
            full,
            "import type { A } from '$lib/data/model/index';\nimport type { B } from '../data/model/index.ts';\nimport type { C } from '$lib/data/model/model-entities';\nimport type { D } from '$lib/data/model/indexes';\n"
        );
        // data/model is the facade, data/model/index.ts; its concern modules are not.
        expect(findViolations(dir)).toEqual([
            'state/reads.ts imports data/model/indexes',
            'state/reads.ts imports data/model/model-entities'
        ]);
    });

    it('lets no view or shell component style a primitive own class', () => {
        expect(
            findPrimitiveStyling(
                LIB,
                [...DELIBERATE, ...HELD].map((one) => one.line)
            )
        ).toEqual([]);
    });

    it('catches a view reaching into a primitive, and passes the theme class and its own', () => {
        const dir = scratchDir('oculus-primitive-styling-');
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
            '<div class="strip"></div>\n<style>\n    /* a } in prose */\n    .strip :global(.tool:hover) {\n        gap: 0;\n    }\n</style>'
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
        const bare = [...DELIBERATE, ...HELD].filter((one) => !isReason(one.why, one.line));
        expect(bare.map((one) => one.line)).toEqual([]);
    });

    it('holds the styling lists to rules the tree still has', () => {
        const held = findPrimitiveStyling(LIB);
        expect(
            [...DELIBERATE, ...HELD]
                .filter((one) => !held.includes(one.line))
                .map((one) => one.line)
        ).toEqual([]);
    });
});
