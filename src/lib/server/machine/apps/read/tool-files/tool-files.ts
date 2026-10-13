// Layer 2, server. The files the tools' contribution points name: the TextMate grammars, language
// configuration files, snippet files and JSON schemas of an app, read as VS Code writes them (JSON
// with comments and trailing commas).
//
// A grammar file that is no JSON object refuses the app, with a finding that names the file. A
// grammar whose scope name a shipped grammar has is left out with a finding, and the shipped one is
// kept. A language configuration, a snippet file and a schema that do not read, and the
// configuration of a language oculus ships, are left out with a finding and the app is offered.
// The scan runs `checkToolFiles` after the manifest was read, as it runs `checkThemes`, so the
// page is offered only files that read.

import { findingText, type TextCatalog } from '../../../../../data/helpers/finding-text.ts';
import { SHIPPED_SCOPES } from '../../../../../data/helpers/files/apps/tools/scope-names.ts';
import { isMap } from '../../../../../data/helpers/guards.ts';
import type { AppContributes, Finding } from '../../../../../data/model/index.ts';
import { registered } from '../../../../../data/prose/languages.ts';
import { readJsonc } from '../theme-files/themes.ts';

/** What `checkToolFiles` is given. */
export type ToolFilesCheck = {
    folder: string;
    files: ReadonlySet<string>;
    contributes: AppContributes;
    catalog: TextCatalog;
    /** The key and file the findings are about. */
    key: string;
    file: string;
};

/** The kinds of file the page asks the server to read for a contribution. */
export type ToolFileKind = 'grammar' | 'configuration' | 'snippets' | 'schema';

/**
 * The JSON value of the file an app's `contributes` names for a kind, or null when the app names
 * no such file, or it does not read. The page asks for it to build the editor's languages from.
 */
export function toolFileValue(
    folder: string,
    contributes: AppContributes,
    kind: ToolFileKind,
    path: string
): unknown {
    const named =
        kind === 'grammar'
            ? contributes.grammars.some((one) => one.path === path)
            : kind === 'configuration'
              ? contributes.languages.some((one) => one.configuration === path)
              : kind === 'snippets'
                ? contributes.snippets.some((one) => one.path === path)
                : contributes.jsonValidation.some((one) => one.url === path);
    if (!named) return null;
    const read = readJsonc(folder, path);
    return 'value' in read ? read.value : null;
}

/** The reason a file of the app is no JSON object, or null when it is one. */
function objectFlaw(folder: string, files: ReadonlySet<string>, path: string): string | null {
    if (!files.has(path)) return 'not a file of the app';
    const read = readJsonc(folder, path);
    if ('why' in read) return read.why;
    return isMap(read.value) ? null : 'not an object';
}

/**
 * The app's `contributes` with each entry whose file does not read taken out and a finding for
 * each, and whether the app is refused for a grammar file that does not.
 */
export function checkToolFiles(check: ToolFilesCheck): {
    contributes: AppContributes;
    findings: Finding[];
    refused: boolean;
} {
    const { folder, files, catalog, key, file } = check;
    const findings: Finding[] = [];
    const note = (message: string): void => {
        findings.push({ file, key, message });
    };
    let refused = false;
    const grammars = check.contributes.grammars.filter((grammar) => {
        const flaw = objectFlaw(folder, files, grammar.path);
        if (flaw !== null) {
            refused = true;
            note(findingText(catalog, 'findings.apps.grammar_unreadable', grammar.path, flaw));
            return false;
        }
        if (SHIPPED_SCOPES.has(grammar.scopeName)) {
            note(
                findingText(
                    catalog,
                    'findings.apps.grammar_shipped',
                    grammar.path,
                    grammar.scopeName
                )
            );
            return false;
        }
        return true;
    });
    const shipped = new Set(registered());
    const languages = check.contributes.languages.map((language) => {
        if (language.configuration === '') return language;
        if (shipped.has(language.id)) {
            note(
                findingText(
                    catalog,
                    'findings.apps.language_configuration_shipped',
                    language.id,
                    language.configuration
                )
            );
            return { ...language, configuration: '' };
        }
        const flaw = objectFlaw(folder, files, language.configuration);
        if (flaw === null) return language;
        note(
            findingText(
                catalog,
                'findings.apps.language_configuration_unreadable',
                language.configuration,
                flaw
            )
        );
        return { ...language, configuration: '' };
    });
    const snippets = check.contributes.snippets.filter((snippet) => {
        const flaw = objectFlaw(folder, files, snippet.path);
        if (flaw === null) return true;
        note(findingText(catalog, 'findings.apps.snippets_unreadable', snippet.path, flaw));
        return false;
    });
    const jsonValidation = check.contributes.jsonValidation.filter((one) => {
        const read = files.has(one.url) ? readJsonc(folder, one.url) : { why: 'not a file' };
        const ok = 'value' in read && (isMap(read.value) || typeof read.value === 'boolean');
        if (!ok)
            note(
                findingText(
                    catalog,
                    'findings.apps.schema_unreadable',
                    one.url,
                    'why' in read ? read.why : 'not a schema'
                )
            );
        return ok;
    });
    return {
        contributes: { ...check.contributes, grammars, languages, snippets, jsonValidation },
        findings,
        refused
    };
}
