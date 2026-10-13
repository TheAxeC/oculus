// Layer 1, data. What the acting apps give the editor of a page, as one value: the languages it
// registers, each language's configuration and grammars, the snippets, the semantic token rules,
// the JSON schemas, and the languages a language server serves. The page reads the files the
// manifests name from the server (the `file` action of `/api/app-host`) and this module joins them
// with the manifests, so a file not yet read leaves its part out until it arrives.
//
// A language is registered when no shipped language has its id, and takes the name of its first
// alias, else its id. A grammar is kept when its file read; the server has already left out a
// grammar whose scope name is a shipped one or an earlier app's. Snippets are VS Code's snippet
// files: a map of name to `{ prefix, body, description }`, a prefix or a body being one string or a
// list of them, and an entry with no prefix or no body is left out. The languages served are the
// shipped servers' and those the selectors of the running hosts of acting apps name (a pattern with
// no language names the language the joined map gives a file it names, as the relay reads it).

import { isMap } from '../../../guards.ts';
import type {
    AppContributes,
    AppEditorSnippet,
    AppLanguageKit,
    AppToolsHost
} from '../../../../model/index.ts';
import { registered } from '../../../../prose/languages.ts';
import type { LanguageMap } from '../../languages.ts';
import { selectorLanguages } from './languages.ts';

export type {
    AppEditorGrammar,
    AppEditorSnippets,
    AppLanguageKit,
    AppSemanticModifier,
    AppSemanticScopes,
    AppSemanticType
} from '../../../../model/index.ts';

/** The kinds of file the page reads for a contribution. */
export type KitFileKind = 'grammar' | 'configuration' | 'snippets' | 'schema';

/** One acting app: its view id, what it declares, and the files of it the page has read. */
export type KitApp = {
    app: string;
    contributes: Pick<
        AppContributes,
        | 'languages'
        | 'grammars'
        | 'snippets'
        | 'semanticTokenTypes'
        | 'semanticTokenModifiers'
        | 'semanticTokenScopes'
        | 'jsonValidation'
    >;
    /** The JSON of a file of the app, or undefined while it is not read. */
    read: (kind: KitFileKind, path: string) => unknown;
};

/** A file the page reads for a contribution. */
export type KitFile = { kind: KitFileKind; path: string };

/** The files a manifest's contributions name, each once. */
export function kitFiles(
    contributes: Pick<AppContributes, 'languages' | 'grammars' | 'snippets' | 'jsonValidation'>
): KitFile[] {
    const files: KitFile[] = [];
    const add = (kind: KitFileKind, path: string): void => {
        if (path !== '' && !files.some((one) => one.kind === kind && one.path === path)) {
            files.push({ kind, path });
        }
    };
    for (const language of contributes.languages) add('configuration', language.configuration);
    for (const grammar of contributes.grammars) add('grammar', grammar.path);
    for (const snippet of contributes.snippets) add('snippets', snippet.path);
    for (const validation of contributes.jsonValidation) add('schema', validation.url);
    return files;
}

/**
 * A glob of `jsonValidation.fileMatch` that matches anywhere in a path unless it names the whole
 * path: one that is not rooted, does not start with `**` and names no address is given `**` and a
 * slash in front.
 */
export function schemaGlob(glob: string): string {
    return glob.startsWith('/') || glob.startsWith('**') || glob.includes('://')
        ? glob
        : `**/${glob}`;
}

/** A string, or a list of strings joined with a line break, or null for anything else. */
function textOf(value: unknown): string | null {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && value.every((one) => typeof one === 'string')) {
        return value.join('\n');
    }
    return null;
}

/** The prefixes a snippet names, one string or a list. */
function prefixesOf(value: unknown): string[] {
    if (typeof value === 'string') return value === '' ? [] : [value];
    if (!Array.isArray(value)) return [];
    return value.filter((one): one is string => typeof one === 'string' && one !== '');
}

/** The snippets a snippet file holds. */
function snippetsOf(file: unknown): AppEditorSnippet[] {
    if (!isMap(file)) return [];
    const out: AppEditorSnippet[] = [];
    for (const [name, entry] of Object.entries(file)) {
        if (!isMap(entry)) continue;
        const prefix = prefixesOf(entry.prefix);
        const body = textOf(entry.body);
        if (prefix.length === 0 || body === null) continue;
        out.push({ name, prefix, body, description: textOf(entry.description) ?? '' });
    }
    return out;
}

/** The kit the acting apps give, in the order of `apps`. */
export function languageKit(
    apps: readonly KitApp[],
    shippedServed: readonly string[],
    hosts: readonly AppToolsHost[],
    map: LanguageMap
): AppLanguageKit {
    const shipped = new Set(registered());
    const kit: AppLanguageKit = {
        languages: [],
        grammars: [],
        snippets: [],
        semantic: { types: [], modifiers: [], scopes: [] },
        schemas: [],
        served: [...shippedServed]
    };
    const snippets = new Map<string, AppEditorSnippet[]>();
    for (const { app, contributes, read } of apps) {
        for (const language of contributes.languages) {
            if (shipped.has(language.id) || kit.languages.some((one) => one.id === language.id)) {
                continue;
            }
            const configuration =
                language.configuration === ''
                    ? undefined
                    : read('configuration', language.configuration);
            kit.languages.push({
                id: language.id,
                label: language.aliases.at(0) ?? language.id,
                configuration: configuration ?? null
            });
        }
        for (const grammar of contributes.grammars) {
            const value = read('grammar', grammar.path);
            if (!isMap(value)) continue;
            kit.grammars.push({
                language: grammar.language,
                scopeName: grammar.scopeName,
                grammar: value,
                embeddedLanguages: grammar.embeddedLanguages,
                injectTo: grammar.injectTo,
                tokenTypes: grammar.tokenTypes
            });
        }
        for (const file of contributes.snippets) {
            const found = snippetsOf(read('snippets', file.path));
            if (found.length > 0) {
                snippets.set(file.language, [...(snippets.get(file.language) ?? []), ...found]);
            }
        }
        kit.semantic.types.push(...contributes.semanticTokenTypes);
        kit.semantic.modifiers.push(...contributes.semanticTokenModifiers);
        kit.semantic.scopes.push(...contributes.semanticTokenScopes);
        for (const validation of contributes.jsonValidation) {
            const schema = read('schema', validation.url);
            if (schema === undefined || schema === null) continue;
            kit.schemas.push({
                url: `${app}/${validation.url}`,
                fileMatch: validation.fileMatch,
                schema
            });
        }
    }
    for (const [language, list] of snippets) kit.snippets.push({ language, snippets: list });
    const acting = new Set(apps.map((one) => one.app));
    for (const host of hosts) {
        if (!acting.has(host.app)) continue;
        const selectors = [
            ...host.servers.map((server) => server.selector),
            ...(host.providers === null ? [] : [host.providers.selector])
        ];
        for (const selector of selectors) {
            for (const language of selectorLanguages(selector, map)) {
                if (!kit.served.includes(language)) kit.served.push(language);
            }
        }
    }
    return kit;
}
