// Layer 4, tree check. The catalog key gate in both directions. Every literal reader names a
// catalog key, and every catalog key is reached by a literal, registration metadata, or one
// documented computed lookup. The finding sentences of config/text/findings.yml are held to the
// source by their literals alone: every `findings.` string literal under src is a key of that file
// and every key of it is such a literal, whatever expression the formatter is handed the catalog
// through.

import { statusWordKey } from '../../../src/lib/state/sources/repositories/repositories.ts';
import { registered } from '../../../src/lib/state/shared/words/languages.ts';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect } from 'vitest';
import { parse } from 'yaml';
import {
    collectionKeys,
    engineDir,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { CATALOGS, LOCAL_NAME } from '../../../src/lib/state/system/config/config-files.ts';
import { SETTINGS_MESSAGES } from '../../../src/lib/state/system/config/messages.ts';
import { descriptionKey } from '../../../src/lib/state/system/config/config-files.ts';
import { SERVED_LANGUAGES, factsForLanguage } from '../../../src/lib/data/prose/lsp-servers.ts';
import { LSP_EDIT_NOTICES } from '../../../src/lib/data/prose/text-edits.ts';
import { symbolKindName } from '../../../src/lib/data/prose/symbol-kinds.ts';
import { registerAll, registerApps, registerCollections } from '../../../src/routes/views.ts';
import { fixtureApp } from '../../fixtures/entities-fixture.ts';
import { recordedKinds } from '../../fixtures/kinds.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { withoutComments } from './code.ts';
import { treeFiles } from '../walk.ts';

let client: ClientState;
let views: ClientState['registry']['views'];

beforeEach(() => {
    client = createClientState();
    ({ views } = client.registry);
    registerAll(client.registry);
    registerCollections(client.registry, collectionKeys(config));
    registerApps(client.registry, [
        fixtureApp({ name: 'draft', approved: false, key: '' }),
        fixtureApp({ name: 'kept', kept: true })
    ]);
});

/** Each language server's entry once, read through the languages they serve. */
const LSP_SERVER_LIST = [
    ...new Set(SERVED_LANGUAGES.flatMap((language) => factsForLanguage(language) ?? []))
];

/** Every name a symbol kind is worded by: the protocol's kinds 1 to 26 and `symbol` for others. */
const SYMBOL_KIND_WORDS = (): string[] => [
    ...new Set(Array.from({ length: 27 }, (_, kind) => symbolKindName(kind)))
];

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'src');

/**
 * Readers whose first argument is a catalog key: the client's three and the audit's `sentence`,
 * spread or not.
 */
const CALL = /(?<![\w$.])(?:\.\.\.)?(t|lookup|catalogText|sentence)\(/g;

/**
 * Server interpolation takes the catalog before its key: `words` of server/core/words.ts, which
 * names the chat terminals and the LaTeX terminals and writes the chat instruction and the
 * transcript export. Every
 * `words(` call in a file under WORDS_DIR is read, whatever its first argument is spelled, and its
 * declaration is left out by the `function` rule CALL uses. Outside that folder a `words` is
 * another module's own helper (the data layer's `words(catalog)` in sources/config/merge.ts, the
 * state and present modules' `words` of a value) and is not a catalog read. A call whose key is not
 * a literal is held to COMPUTED_PREFIXES like every other reader, and none of those is a `words`
 * call.
 */
const WORDS = /(?<![\w$.])words\(/g;

/** The folder, relative to the scanned root, whose `words` calls are the server's catalog reads. */
const WORDS_DIR = 'lib/server/';

/**
 * The text after the first argument of a call whose argument list starts at `at`, or null when the
 * list closes before a comma at its own depth. Quotes and nested brackets are skipped, so a first
 * argument such as `textCatalog(config)` is passed over whole.
 */
function afterFirstArgument(source: string, at: number): string | null {
    let depth = 0;
    let quote = '';
    for (let index = at; index < source.length; index += 1) {
        const char = source[index];
        if (quote !== '') {
            if (char === '\\') index += 1;
            else if (char === quote) quote = '';
        } else if (char === "'" || char === '"' || char === '`') {
            quote = char;
        } else if ('([{'.includes(char)) {
            depth += 1;
        } else if (')]}'.includes(char)) {
            if (depth === 0) return null;
            depth -= 1;
        } else if (char === ',' && depth === 0) {
            return source.slice(index + 1, index + 201);
        }
    }
    return null;
}

/**
 * A `findings.` key written as a string literal in any quote, with at least one dot after the
 * group.
 */
const FINDING_LITERAL = /(['"`])(findings\.[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+)\1/g;

/** A `findingText` call (not its declaration), up to the end of its key argument. */
const FINDING_CALL = /(?<![\w$.])(?<!function\s+)findingText\(\s*[^,()]+,\s*([^,)]+)/g;

/** A key argument written as one whole `findings.` string literal. */
const WHOLE_FINDING_KEY = /^(['"])findings\.[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+\1$/;

/**
 * The `findingText` calls whose key is not a whole literal, each with the file and the argument
 * text: the audit's collector words a key its rules named through `sentence(`, and the deck
 * reader words the key its callers name as a whole literal in each `raise(` call, which the
 * reader scan holds.
 */
const COMPUTED_FINDING_KEYS = [
    { file: 'lib/server/content/audit/rules.ts', key: 'key' },
    { file: 'lib/data/sources/deck/read.ts', key: 'id' }
] as const;

/** Every `findingText` call under `root` whose key is not one whole `findings.` literal. */
function computedFindingKeys(root: string): { file: string; key: string }[] {
    const found: { file: string; key: string }[] = [];
    for (const file of sources(root)) {
        const source = withoutComments(file, readFileSync(file, 'utf8'));
        for (const match of source.matchAll(FINDING_CALL)) {
            const key = match[1].trim();
            if (!WHOLE_FINDING_KEY.test(key))
                found.push({ file: file.slice(root.length + 1), key });
        }
    }
    return found;
}

/**
 * Direct server indexing of the flat catalog, by subscript or through the guarded record reader.
 */
const INDEX =
    /textCatalog\([^)]*\)\s*\[\s*(['"])([^'"\\]+)\1\s*\]|byKey\(\s*textCatalog\([^)]*\)\s*,\s*(['"])([^'"\\]+)\3\s*\)/g;

/** The first argument when it is a plain string literal, and nothing when it is not. */
const LITERAL = /^\s*(?:'([^'\\]*)'|"([^"\\]*)")\s*[,)]/;

/** The computed prefixes, with the file that computes each and the catalog keys it covers. */
const COMPUTED_PREFIXES = [
    {
        file: 'lib/views/boards/collection/Collection.svelte',
        start: 'lookup(`views.${instance.view}`',
        keys: () => collectionKeys(loadConfig(engineDir()).config).map((id) => `views.${id}`)
    },
    {
        file: 'lib/views/boards/projects/Projects.svelte',
        start: 'lookup(`views.${preset.id}`',
        keys: () => ['projects', 'coauthor', 'archive'].map((id) => `views.${id}`)
    },
    {
        // One description per file of the engine's config folder and of its catalogs folder, keyed
        // by the file's own name. The machine's own file is named whether or not this checkout
        // holds one, since it is described for every machine and a clone that has not made one
        // still reads the key.
        file: 'lib/state/system/config/config-files.ts',
        start: 'lookup(descriptionKey(',
        keys: () => {
            const names = [
                ...readdirSync(join(engineDir(), 'config')),
                ...readdirSync(join(engineDir(), 'config', CATALOGS))
            ].filter((name) => name.endsWith('.yml'));
            return [...new Set([...names, LOCAL_NAME])].map((name) => descriptionKey(name));
        }
    },
    {
        // A sentence of the Settings rows is a message of the rows module: its catalog key and the
        // values to fill in. The keys are the module's own list, so a message added there without
        // a word fails here.
        file: 'lib/views/system/workbench/settings/said.ts',
        start: 't(message.key',
        keys: () => Object.values(SETTINGS_MESSAGES)
    },
    {
        // One word per kind of write the change log records, keyed by the body kind itself, so a
        // kind added to writes/bodies.ts without a word fails here rather than drawing the wire
        // word.
        file: 'lib/views/system/history/History.svelte',
        start: 't(`history.kind_${row.kind',
        keys: () => recordedKinds().map((kind) => `history.kind_${kind.replaceAll('-', '_')}`)
    },
    {
        // A language is named by the highlighter's own name for it, so a language registered in
        // data/prose/languages.ts without a name in config/text/statusbar.yml fails here.
        file: 'lib/state/workbench/navigation/status.ts',
        start: 't(`statusbar.language_${known}`',
        keys: () => registered().map((name) => `statusbar.language_${name}`)
    },
    {
        // A change row is named by its path and the word its git status stands for, an unmerged
        // pair by the conflict it is; a letter git adds later reads as `changed`.
        file: 'lib/views/sources/repositories/changes/ChangeRow.svelte',
        start: 't(statusWordKey(',
        keys: () =>
            ['M', 'A', 'D', 'R', 'C', '?', 'U', 'UU', 'AA', 'DD', 'AU', 'UA', 'DU', 'UD'].map(
                (status) => statusWordKey(status)
            )
    },
    {
        // A language server's labels are the catalog keys its entry in data/prose/lsp-servers.ts
        // holds, so an entry added there without its words fails here: its name in the status bar
        // and in the title of its output tab, its Restart and Show Output actions, and the action
        // of each choice it asks for.
        file: 'lib/shell/status/LanguageItems.svelte',
        start: 't(facts.words.name',
        keys: () => LSP_SERVER_LIST.map((server) => server.words.name)
    },
    {
        file: 'lib/views/sources/source/language/lsp.ts',
        start: 't(facts.words.name',
        keys: () => LSP_SERVER_LIST.map((server) => server.words.name)
    },
    {
        file: 'lib/views/sources/source/language/lsp.ts',
        start: 't(facts.words.restart',
        keys: () => LSP_SERVER_LIST.map((server) => server.words.restart)
    },
    {
        file: 'lib/views/sources/source/language/lsp.ts',
        start: 't(facts.words.output',
        keys: () => LSP_SERVER_LIST.map((server) => server.words.output)
    },
    {
        file: 'lib/views/sources/source/language/lsp.ts',
        start: 't(facts.words.choice',
        keys: () => LSP_SERVER_LIST.flatMap((server) => Object.values(server.words.choice))
    },
    {
        // The notice that says why an edit a language server asked for was not made is one of the
        // list in data/prose/text-edits.ts.
        file: 'lib/views/sources/source/language/lsp.ts',
        start: 't(`source.${key}`',
        keys: () => LSP_EDIT_NOTICES.map((notice) => `source.${notice}`)
    },
    {
        // A symbol of the palette's `#` list is worded by its kind, the protocol's own list.
        file: 'lib/shell/keys/rows/SymbolRows.svelte',
        start: 't(`app.palette.symbol_',
        keys: () => SYMBOL_KIND_WORDS().map((name) => `app.palette.symbol_${name}`)
    }
] as const;

/** Registration metadata is a configured catalog-key value rather than a computed prefix. */
const REGISTRATION_LOOKUPS = [
    { file: 'lib/state/workbench/navigation/registry.ts', start: 'lookup(registration.label)' },
    { file: 'lib/state/workbench/navigation/registry.ts', start: 'lookup(registration.glyph)' },
    { file: 'lib/state/workbench/navigation/registry.ts', start: 'lookup(means)' }
] as const;

/** Every module and component under a folder, as full paths, in name order. */
function sources(dir: string): string[] {
    return treeFiles(dir)
        .filter((rel) => /\.(ts|svelte)$/.test(rel))
        .map((rel) => join(dir, rel));
}

type Call = { file: string; reader: string; key: string | null; text: string };

/** Every catalog read under `root`, with its key when the argument is a literal. */
function calls(root: string): Call[] {
    const found: Call[] = [];
    for (const file of sources(root)) {
        const source = withoutComments(file, readFileSync(file, 'utf8'));
        for (const match of source.matchAll(CALL)) {
            const at = match.index + match[0].length;
            if (/function\s+$/.test(source.slice(0, match.index))) continue;
            const literal = LITERAL.exec(source.slice(at, at + 200));
            found.push({
                file: file.slice(root.length + 1),
                reader: match[1],
                key: literal ? (literal.at(1) ?? literal.at(2) ?? null) : null,
                text: source.slice(match.index, at + 80).split('\n')[0]
            });
        }
        const relativePath = file.slice(root.length + 1);
        for (const match of relativePath.startsWith(WORDS_DIR) ? source.matchAll(WORDS) : []) {
            const at = match.index + match[0].length;
            if (/function\s+$/.test(source.slice(0, match.index))) continue;
            const key = afterFirstArgument(source, at);
            const literal = key === null ? null : LITERAL.exec(key);
            found.push({
                file: relativePath,
                reader: 'words',
                key: literal ? (literal.at(1) ?? literal.at(2) ?? null) : null,
                text: source.slice(match.index, at + 80).split('\n')[0]
            });
        }
        for (const match of source.matchAll(INDEX)) {
            found.push({
                file: file.slice(root.length + 1),
                reader: 'index',
                key: match.at(2) ?? match.at(4) ?? null,
                text: match[0]
            });
        }
    }
    return found;
}

/** Every `findings.` string literal under `root`, comments left out, with the file it is in. */
function findingLiterals(root: string): { file: string; key: string }[] {
    const found: { file: string; key: string }[] = [];
    for (const file of sources(root)) {
        const source = withoutComments(file, readFileSync(file, 'utf8'));
        for (const match of source.matchAll(FINDING_LITERAL)) {
            found.push({ file: file.slice(root.length + 1), key: match[2] });
        }
    }
    return found;
}

const config = loadConfig(engineDir()).config;
const catalog = textCatalog(config);
const found = calls(SRC);
const findingKeys = findingLiterals(SRC);

/** Every key of config/text/findings.yml, read from that file alone rather than the merged map. */
const SENTENCE_KEYS = Object.keys(
    textCatalog(
        parse(readFileSync(join(engineDir(), 'config', 'text', 'findings.yml'), 'utf8')) as Record<
            string,
            unknown
        >
    )
);

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
            if (registration.badgeMark !== undefined) allowed.add(registration.badgeMark);
        }
        for (const entry of COMPUTED_PREFIXES) {
            for (const key of entry.keys()) allowed.add(key);
        }
        for (const literal of findingKeys) allowed.add(literal.key);
        const orphaned = Object.keys(catalog).filter((key) => !allowed.has(key));
        expect(orphaned).toEqual([]);
    });

    it('holds every findings. literal of the source to config/text/findings.yml, both ways', () => {
        expect(findingKeys.length).toBeGreaterThan(0);
        expect(
            findingKeys
                .filter((literal) => !SENTENCE_KEYS.includes(literal.key))
                .map((literal) => `${literal.file}: ${literal.key}`)
        ).toEqual([]);
        const named = new Set(findingKeys.map((literal) => literal.key));
        expect(SENTENCE_KEYS.filter((key) => !named.has(key))).toEqual([]);
        expect(SENTENCE_KEYS.filter((key) => !key.startsWith('findings.'))).toEqual([]);
    });

    it('reads every findingText key as a whole literal, except where a documented rule computes it', () => {
        const documented = (call: { file: string; key: string }): boolean =>
            COMPUTED_FINDING_KEYS.some(
                (entry) => entry.file === call.file && entry.key === call.key
            );
        expect(
            computedFindingKeys(SRC)
                .filter((call) => !documented(call))
                .map((call) => `${call.file}: ${call.key}`)
        ).toEqual([]);
    });

    it('reads a findings. literal whatever holds the catalog, and none written in a comment', () => {
        const dir = scratchDir('oculus-finding-keys-');
        const file = join(dir, 'Rules.ts');
        expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
        writeFileSync(
            file,
            [
                "const a = findingText(rules.text, 'findings.validate.nope');",
                'const b = findingText(CATALOG, "findings.config.nope", 3);',
                '// findingText(catalog, `findings.file.commented`)',
                "const c = t('views.findings');",
                ''
            ].join('\n')
        );
        expect(findingLiterals(dir)).toEqual([
            { file: 'Rules.ts', key: 'findings.validate.nope' },
            { file: 'Rules.ts', key: 'findings.config.nope' }
        ]);
    });

    it('catches a computed key and a literal key, and reads past neither', () => {
        const dir = scratchDir('oculus-keys-');
        const write = (name: string, body: string) => {
            const full = join(dir, name);
            expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
            mkdirSync(dirname(full), { recursive: true });
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
        // The server reads the flat catalog by subscript or through the guarded record reader, and
        // the gate counts both as one read of the key each names.
        write(
            'Server.ts',
            "const e = textCatalog(config)['app.nav.host'];\n" +
                "const f = byKey(textCatalog(config), 'app.search');\n"
        );
        // Under lib/server every `words` call is read whatever its first argument is spelled, a
        // call with no key argument reads no key, and the declaration is left out by the `function`
        // rule. A `words` outside lib/server is another module's helper and is not read at all.
        write(
            'lib/server/pty/Words.ts',
            "const g = words(catalog, 'server.chat.chat_name', 1);\n" +
                "const h = words(textCatalog(config), 'server.chat.' + name);\n" +
                "const i = words(texts, 'server.latex.name', step);\n" +
                'const k = words(catalog);\n' +
                'export function words(\n    catalog: Record<string, string>,\n    key: string\n) {}\n'
        );
        write('lib/server/mail/Words.ts', "const m = words(catalog, 'server.chat.' + kind);\n");
        write(
            'lib/state/Words.ts',
            "const j = words('kicker', 'kicker');\nconst l = words(catalog, 'app.title');\n"
        );
        expect(calls(dir)).toEqual([
            { file: 'Computed.ts', reader: 't', key: null, text: 't(key);' },
            { file: 'Computed.ts', reader: 'lookup', key: null, text: 'lookup(key);' },
            { file: 'Good.svelte', reader: 't', key: 'app.title', text: "t('app.title');" },
            {
                file: 'Good.svelte',
                reader: 'lookup',
                key: 'views.status',
                text: 'lookup("views.status");'
            },
            {
                file: 'Server.ts',
                reader: 'index',
                key: 'app.nav.host',
                text: "textCatalog(config)['app.nav.host']"
            },
            {
                file: 'Server.ts',
                reader: 'index',
                key: 'app.search',
                text: "byKey(textCatalog(config), 'app.search')"
            },
            {
                file: 'lib/server/mail/Words.ts',
                reader: 'words',
                key: null,
                text: "words(catalog, 'server.chat.' + kind);"
            },
            {
                file: 'lib/server/pty/Words.ts',
                reader: 'words',
                key: 'server.chat.chat_name',
                text: "words(catalog, 'server.chat.chat_name', 1);"
            },
            {
                file: 'lib/server/pty/Words.ts',
                reader: 'words',
                key: null,
                text: "words(textCatalog(config), 'server.chat.' + name);"
            },
            {
                file: 'lib/server/pty/Words.ts',
                reader: 'words',
                key: 'server.latex.name',
                text: "words(texts, 'server.latex.name', step);"
            },
            {
                file: 'lib/server/pty/Words.ts',
                reader: 'words',
                key: null,
                text: 'words(catalog);'
            }
        ]);
        expect(unapproved(calls(dir)).map((call) => call.text)).toEqual([
            't(key);',
            'lookup(key);',
            "words(catalog, 'server.chat.' + kind);",
            "words(textCatalog(config), 'server.chat.' + name);",
            'words(catalog);'
        ]);
    });
});
