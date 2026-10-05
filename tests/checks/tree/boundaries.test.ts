// Layer 4, tree check. The import graph respects the layers of DESIGN.md, section "Boundaries".
// Every module under src/lib is read, its imports are read out of its code by the import checks'
// own reader (tests/checks/imports/graph.ts, type-only ones included), and each one is checked
// against the row of the table its own folder sits in. Anything the row does not allow is a
// violation: the table's "May import" column is the whole permission.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import { DELIBERATE, HELD } from './allow-styling.ts';
import { runtimeImports, sourceFiles } from '../imports/graph.ts';
import { isReason } from '../../fixtures/reason.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { withoutComments } from '../source/code.ts';

const LIB = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..', 'src', 'lib');
const SRC = resolve(LIB, '..');

const LAYERS = ['data', 'server', 'server/transcripts', 'state', 'ui', 'shell', 'views', 'themes'];

// One entry per row of the table. A pattern ending in /** matches the folder and everything under
// it; any other pattern matches exactly. The view registry is a state module under
// `state/workbench/navigation/`, which the shell's row and the views' row both name, so a view
// registers itself without importing another view and the shell draws a view it never imports.
//
// A block two views draw the same way lives under `views/shared/**` once instead of twice, and only
// a view may import it. A file under `views/shared/` is in the views layer itself, so the row binds
// it too and it may reach no other view's partials.
//
// `data/helpers/guards`, `data/accounts/calendar`, `data/accounts/mail`, `data/accounts/connect`,
// `data/helpers/dates`, `data/helpers/files/paths`, `data/helpers/deck`, `data/helpers/editor`,
// `data/accounts/leads`, `data/helpers/worktrees`, `data/helpers/files/text-kind`,
// `data/helpers/files/opens-in-program`, `data/helpers/files/languages`, `data/helpers/run/tasks`,
// `data/helpers/run/marker`, `data/helpers/search/**`, `data/helpers/finding-text` and
// `data/helpers/code-themes` join `data/model` in the state row as pure helpers with no reader and
// no I/O. `data/accounts/calendar` and `data/accounts/mail` are there because how a connector
// account is named, and how old a thread is, are read by the server that builds the credential file
// and reads the mailbox and by the page that presses Connect and draws the age on a card;
// `data/accounts/connect` because the rule a new account's label and a provider's client half are
// held to is read by the Add form and the setup page before they send and by the server before it
// writes, and a copy on each side would let them disagree; `data/helpers/deck` because the deck's
// placement rule has two readers, the Present view and the write that saves a selection, and a copy
// of it on each side would let them disagree about what a slide key is; `data/accounts/leads` for
// the same reason, since the statuses that close a lead are read by the Position Leads view, its
// badge and the ticker on the client, and by the summary the snapshot carries on the server;
// `data/helpers/worktrees` likewise, the Repositories view naming the path a worktree will take and
// the write making it; `data/helpers/files/text-kind`, the file browser deciding which tab a file
// opens in and the source route refusing a save over bytes no editor could have read;
// `data/helpers/files/opens-in-program`, the open endpoint opening only a file whose extension
// `open.program_ext` lists and the cards and the file view offering the control for that name
// alone; `data/helpers/files/languages`, the reader of the `languages:` map: the server words its
// findings from it, and the file browser, the source tab and the diff and merge views read a file's
// language through it, so the two cannot disagree about which entries the map dropped;
// `data/helpers/files/nesting`, the reader of the `patterns:` map of file-nesting.yml and the rule
// that nests a folder's names: the server words its findings from it and the Files view nests the
// rows it draws through it, so the two cannot disagree about which patterns were dropped;
// `data/helpers/run/tasks`, the server building an update task's argv from the `tasks:` block and
// the update tray asking that block whether the task it is about to start runs unattended;
// `data/helpers/run/marker`, the line a project command's chain prints before each command, which
// the server writes into the chain's line and the page reads the task's output by;
// `data/helpers/editor`, the order that resolves a tab's editor options (`resolveEditor`) and their
// types, which the source tab and the diff view resolve a tab's options through; and
// `data/helpers/search/**`, the Search view refusing a query before it sends it and the search
// route refusing the same query when it arrives, from one rule and one argument list (`query`), and
// the Search view drawing the replacement of each hit with the rules the server writes it by
// (`replace`); and `data/helpers/finding-text`, whose placeholder rule is the one the client's t()
// fills a catalog string with and the one the server words every finding with before the snapshot
// carries it; `data/helpers/code-themes`, the list of Shiki's bundled themes (ids, display names,
// dark or light), which the server words the finding for a bad `code_theme:` from, the appearance
// store checks a saved pick against and the Settings view draws as the Code theme menu; and
// `data/sources/config/rail`, the rule over the `rail:` list of config/layout.yml, which the page
// drawing the rail, the Settings view editing it and the server writing it and wording its findings
// all read, so the three agree on which entries are pages; and `data/sources/config/settings`, the
// typed readers of single settings, which the page reads by the rule the server reads by: the Files
// view `files.confirm_delete`, so a delete asks only while the setting says so, the source editor
// the paint limit, the cards and the file view the `open.program_ext` map, and the Usage view the
// refresh cadence; and `data/sources/config/catalog/value-rule`, the rule a value of an option is
// wrong by (its control, `min`, `max` and values), which the Settings view refuses a value by
// before it is sent and the server's write and readers by after it, so the three agree; and
// `data/sources/config/editor-options`, the reader of the editor's options and of a repository's
// `.oculus/settings.yml` by that rule, which the source tab, the diff view and the Settings view's
// lines under `editor.languages` read; and `data/sources/config/catalog/options`, the options
// catalog's types and the reader of it from the merged config, which the Settings view's rows are
// made from, so the rows and the server's write of one option
// (server/edit/writes/config/config-key.ts) read one description of what an option is; and
// `data/hub-address`, the rule telling a path of the hub from a web address, which the collection
// card reads to decide what a click opens and the Audit reads to decide which links to look for on
// disk; and `data/prose/literature`, the rules of the literature search that both sides read: how
// a DOI, a PubMed id and an arXiv id are written the one way and the bounds of a request, which the
// Literature search refuses a query by before it sends it and the route refuses the same query by
// when it arrives, and the rule by which Lit Watch holds a paper already.
// `data/helpers/files/paths` holds the `/` path rules (a path's last name, the path under a
// folder, the deepest folder holding a target) that the file browser, the source tab and the status
// bar read a root or a repository by, so the three agree on which one holds a file.
// `data/shapes/shapes` holds the zod helpers (a schema that answers its input, the map and number
// schemas, the quick path) that the server's, the state layer's, the views' and the shell's readers
// of untyped input share, so all four read by one rule. `data/file-ops` holds what a file or folder
// name may be, the name a copy takes, the sizes of an upload and of a comparison, and the shapes of
// a file operation and its answer, which the Files view checks while a name is typed and the server
// checks when the name arrives. The model's own concern modules (`data/model-*`) are reached
// through the facade only, which is why they are not listed here.
//
// `data/prose/markdown` is in the primitives' row, the one module of layer 1 there: a Markdown
// document is rendered by the document route on the server and by ui/html.ts on the page, and the
// heading ids and the table of contents are one rule for both, so a document reads the same in the
// doc view and in the source tab's preview. It holds no reader and no I/O. `data/prose/languages`,
// the highlighter, is in the state row for the same reason: the server paints a document's and a
// transcript turn's code with it, and the page reaches it through state/shared/words/languages.ts.
// `data/prose/latex`, the reader of a LaTeX text (magic comments, sections, includes), is in the
// state row because the server's outline and the Files Outline read the same sections through it,
// the LaTeX store takes the list of programs from it, and the answers module takes the words a
// LaTeX request is refused with; it takes a string and a parser and does no I/O, and imports no
// parser of its own.
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
// `state/client/context` is where the client's stores are wired together, and it names nothing of
// layer 3: the view registry is a state module, and the page root makes the primitives' tooltip
// counter beside the client object, so the state row reaches no layer above it.
const ALLOWED: Record<string, string[]> = {
    ui: ['ui/**', 'themes/**', 'state/shared/words/text', 'data/prose/markdown'],
    shell: [
        'shell/**',
        'ui/**',
        'state/client/context',
        'state/client/use',
        'state/client/instance-context',
        'state/workbench/layout',
        'state/workbench/drag',
        'state/workbench/ui',
        'state/shared/words/text',
        'state/shared/words/appearance',
        'state/workbench/palette',
        'state/workbench/palette-source',
        'state/workbench/selection',
        'state/workbench/navigation/**',
        'state/sessions/terminals',
        'data/shapes/shapes'
    ],
    views: ['ui/**', 'state/**', 'views/shared/**', 'data/shapes/shapes'],
    state: [
        'state/**',
        'data/model',
        'data/helpers/guards',
        'data/shapes/shapes',
        'data/accounts/calendar',
        'data/accounts/mail',
        'data/accounts/connect',
        'data/helpers/dates',
        'data/helpers/files/paths',
        'data/helpers/deck',
        'data/accounts/leads',
        'data/helpers/worktrees',
        'data/helpers/files/text-kind',
        'data/helpers/files/opens-in-program',
        'data/helpers/files/languages',
        'data/prose/latex',
        'data/helpers/files/nesting',
        'data/helpers/run/tasks',
        'data/helpers/run/marker',
        'data/helpers/editor',
        'data/helpers/search/**',
        'data/file-ops',
        'data/helpers/code-themes',
        'data/helpers/finding-text',
        'data/sources/config/rail',
        'data/sources/config/settings',
        'data/sources/config/editor-options',
        'data/sources/config/catalog/options',
        'data/sources/config/catalog/value-rule',
        'data/hub-address',
        'data/prose/languages',
        'data/prose/literature'
    ],
    data: ['data/**'],
    server: ['server/**', 'data/**'],
    'server/transcripts': ['server/transcripts/**', 'data/**'],
    themes: ['themes/**']
};

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
 * state/shared/words/text.ts, state/shared/words/tones.ts and state/shared/words/appearance.ts hold
 * what the server last sent, are never written after a push installs them, and are read by t(),
 * toneOf() and themes() from every layer, `ui/` included, where there is no client object to read
 * them from. The two runes beside them, state/shared/words/generation.svelte.ts and
 * state/shared/words/glyphmode.svelte.ts, are what makes those reads redraw: a generation held per
 * client would say a push had landed for one client and not for another over the one set of maps
 * they both read.
 *
 * And the editor's load, ui/controls/editor/kit/load.ts's `loading`: Monaco keeps one theme, one
 * set of key rules and its workers for the whole page, not per client, so the promise that loads
 * it once per page is page state by Monaco's own design, and a second load would register
 * everything twice.
 */
const FROZEN = [
    'lib/ui/controls/editor/kit/load.ts:loading',
    'lib/server/content/audit/publications.ts:STOPWORDS',
    'lib/server/machine/pty/channel.ts:CHANGE_EVENTS',
    'lib/server/machine/pty/tmux.ts:SINGLES',
    'lib/state/shared/words/text.ts:catalog',
    'lib/state/shared/words/text.ts:glyphs',
    'lib/state/shared/words/text.ts:ascii',
    'lib/state/shared/words/text.ts:icons',
    'lib/state/shared/words/tones.ts:palette',
    'lib/state/shared/words/tones.ts:statusPalette',
    'lib/state/shared/words/tones.ts:typeColor',
    'lib/state/shared/words/tones.ts:legend',
    'lib/state/shared/words/tones.ts:domainColor',
    'lib/state/shared/words/tones.ts:domainText',
    'lib/state/shared/words/tones.ts:dataAccess',
    'lib/state/shared/words/appearance.ts:list',
    'lib/state/shared/words/appearance.ts:byName',
    'lib/state/shared/words/appearance.ts:paper',
    'lib/state/shared/words/appearance.ts:crt',
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
 * a program through `writes` and offers Open in Program from the programs `selectors` reads.
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
    'selectors'
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
        // Revert: in selectorAt of tests/checks/tree/boundaries.test.ts, strip comments from the
        // span alone, and the brace inside the comment above the rule cuts its selector short.
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
