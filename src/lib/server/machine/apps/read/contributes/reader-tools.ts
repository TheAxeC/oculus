// Layer 2, server. The reader of the contribution points that reach the tools: languages, grammars,
// snippets, the semantic token points, JSON schemas, configuration defaults, debuggers, tasks and
// problem matchers. `reader.ts` hands each its value and the operations of the reader around it
// (`PointHelpers`); the checked entries go to the app's `AppContributes`.
//
// A fault refuses the app: a regular expression that does not compile, a path the app does not
// hold, a debugger or a matcher named as oculus's own, a pattern name no `problemPatterns` entry
// carries. Two things leave the app offered and drop the entry: a `jsonValidation` whose schema is
// no JSON file of the app, and a `configurationDefaults` name that no option of oculus takes. The
// ids two apps may not share (a debugger type, a task type, a matcher name) are compared across
// apps by `across/ids.ts`; a language is shared on purpose and is joined by
// `data/helpers/files/apps/tools/languages.ts`.

import {
    languageOfBlock,
    readLanguageDefaults
} from '../../../../../data/helpers/files/apps/tools/editor-defaults.ts';
import { settingFlaw } from '../../../../../data/helpers/files/apps/settings.ts';
import type {
    AppContributes,
    AppProblemMatcher,
    AppProblemPattern
} from '../../../../../data/model/index.ts';
import { placeOf, type PointHelpers } from './place.ts';
import type { ProblemPatternDefShape, ProblemPatternShape } from './shape-tools.ts';

/** The debugger oculus ships, which no app declares. */
const RITE = 'rite';

/** The files a JSON-with-comments point names. */
const JSON_FILE = /\.jsonc?$/;

/** The images a language icon may be. */
const IMAGE_FILE = /\.(svg|png|jpe?g)$/i;

/** Whether the text compiles as a regular expression. */
function compiles(source: string): boolean {
    try {
        new RegExp(source);
        return true;
    } catch {
        return false;
    }
}

/** One pattern of a matcher with the groups it names, 0 for a group it does not. */
function patternOf(one: ProblemPatternShape): AppProblemPattern {
    return {
        regexp: one.regexp,
        file: one.file ?? 0,
        location: one.location ?? 0,
        line: one.line ?? 0,
        column: one.column ?? 0,
        endLine: one.endLine ?? 0,
        endColumn: one.endColumn ?? 0,
        severity: one.severity ?? 0,
        code: one.code ?? 0,
        message: one.message ?? 0,
        loop: one.loop === true
    };
}

/** The text of a pattern given as a string or as `{ regexp }`. */
function patternText(one: string | { regexp: string }): string {
    return typeof one === 'string' ? one : one.regexp;
}

/** The reader of the tools' points over the reader around them. */
class ToolsReader {
    readonly #h: PointHelpers;
    readonly #out: AppContributes;

    constructor(helpers: PointHelpers, out: AppContributes) {
        this.#h = helpers;
        this.#out = out;
    }

    /** A regular expression that must compile; a refusal naming the text when it does not. */
    #regexp(source: string, place: string): boolean {
        if (compiles(source)) return true;
        this.#h.refuse('findings.apps.contributes_regexp', place, source);
        return false;
    }

    languages(value: unknown): void {
        const list = this.#h.parse('languages', value);
        if (list === null) return;
        list.forEach((one, at) => {
            const place = (field: string): string => placeOf('languages', [at, field]);
            const extensions = one.extensions ?? [];
            extensions.forEach((extension, index) => {
                if (!/^\.[^./\s]+$/.test(extension)) {
                    this.#h.refuse(
                        'findings.apps.contributes_extension',
                        placeOf('languages', [at, 'extensions', index]),
                        extension
                    );
                }
            });
            const filenames = one.filenames ?? [];
            filenames.forEach((name, index) => {
                if (name === '' || name.includes('/')) {
                    this.#h.refuse(
                        'findings.apps.contributes_filename',
                        placeOf('languages', [at, 'filenames', index]),
                        name
                    );
                }
            });
            const firstLine = one.firstLine ?? '';
            if (firstLine !== '') this.#regexp(firstLine, place('firstLine'));
            this.#out.languages.push({
                id: one.id,
                aliases: one.aliases ?? [],
                extensions: extensions.map((extension) => extension.toLowerCase()),
                filenames: filenames.map((name) => name.toLowerCase()),
                filenamePatterns: one.filenamePatterns ?? [],
                firstLine,
                configuration:
                    one.configuration === undefined
                        ? ''
                        : this.#h.file(one.configuration, place('configuration'), JSON_FILE),
                icon:
                    one.icon === undefined
                        ? null
                        : {
                              light: this.#h.file(one.icon.light, place('icon.light'), IMAGE_FILE),
                              dark: this.#h.file(one.icon.dark, place('icon.dark'), IMAGE_FILE)
                          }
            });
        });
    }

    grammars(value: unknown): void {
        const list = this.#h.parse('grammars', value);
        if (list === null) return;
        list.forEach((one, at) => {
            this.#out.grammars.push({
                language: one.language ?? '',
                scopeName: one.scopeName,
                path: this.#h.file(one.path, placeOf('grammars', [at, 'path']), JSON_FILE),
                embeddedLanguages: one.embeddedLanguages ?? {},
                injectTo: one.injectTo ?? [],
                tokenTypes: one.tokenTypes ?? {}
            });
        });
    }

    snippets(value: unknown): void {
        const list = this.#h.parse('snippets', value);
        if (list === null) return;
        list.forEach((one, at) => {
            this.#out.snippets.push({
                language: one.language,
                path: this.#h.file(one.path, placeOf('snippets', [at, 'path']), JSON_FILE)
            });
        });
    }

    semantic(types: unknown, modifiers: unknown, scopes: unknown): void {
        const typeList = this.#h.parse('semanticTokenTypes', types);
        for (const one of typeList ?? []) {
            this.#out.semanticTokenTypes.push({
                id: one.id,
                superType: one.superType ?? '',
                description: one.description ?? ''
            });
        }
        const modifierList = this.#h.parse('semanticTokenModifiers', modifiers);
        for (const one of modifierList ?? []) {
            this.#out.semanticTokenModifiers.push({
                id: one.id,
                description: one.description ?? ''
            });
        }
        const scopeList = this.#h.parse('semanticTokenScopes', scopes);
        for (const one of scopeList ?? []) {
            this.#out.semanticTokenScopes.push({
                language: one.language ?? '',
                scopes: one.scopes
            });
        }
    }

    jsonValidation(value: unknown): void {
        const list = this.#h.parse('jsonValidation', value);
        if (list === null) return;
        for (const one of list) {
            if (!JSON_FILE.test(one.url) || !this.#h.has(one.url)) {
                this.#h.note('findings.apps.contributes_validation_dropped', one.url);
                continue;
            }
            this.#out.jsonValidation.push({
                fileMatch: typeof one.fileMatch === 'string' ? [one.fileMatch] : one.fileMatch,
                url: one.url
            });
        }
    }

    /** The defaults: `[<language>]` blocks of editor options, and the app's own settings. */
    defaults(value: unknown): void {
        const map = this.#h.parse('configurationDefaults', value);
        if (map === null) return;
        const own = this.#out.configuration?.properties ?? [];
        for (const [key, entry] of Object.entries(map)) {
            const language = languageOfBlock(key);
            if (language !== null) {
                const { dropped } = readLanguageDefaults(entry);
                for (const name of dropped) {
                    this.#h.note('findings.apps.contributes_default_dropped', key, name);
                }
                this.#out.configurationDefaults[key] = Object.fromEntries(
                    Object.entries(entry as Record<string, unknown>).filter(
                        ([name]) => !dropped.includes(name)
                    )
                );
                continue;
            }
            const setting = own.find((one) => one.key === key);
            if (setting === undefined || settingFlaw(setting, entry) !== null) {
                this.#h.note(
                    'findings.apps.contributes_default_dropped',
                    'configurationDefaults',
                    key
                );
                continue;
            }
            setting.default = entry;
            this.#out.configurationDefaults[key] = entry;
        }
    }

    debuggers(value: unknown, breakpoints: unknown): void {
        const list = this.#h.parse('debuggers', value);
        list?.forEach((one, at) => {
            const place = (field: string): string => placeOf('debuggers', [at, field]);
            if (one.type === RITE)
                this.#h.refuse('findings.apps.contributes_rite', place('type'), RITE);
            if (one.program !== undefined) this.#h.file(one.program, place('program'), /./);
            const runtime = one.runtime ?? '';
            if (runtime.includes('/') || runtime.includes('\\')) {
                this.#h.refuse('findings.apps.contributes_shape', place('runtime'));
            }
            this.#out.debuggers.push({
                type: one.type,
                label: one.label,
                languages: one.languages ?? [],
                program: one.program ?? '',
                args: one.args ?? [],
                runtime,
                runtimeArgs: one.runtimeArgs ?? [],
                configurationAttributes: {
                    launch: one.configurationAttributes?.launch ?? {},
                    attach: one.configurationAttributes?.attach ?? {}
                },
                initialConfigurations: one.initialConfigurations ?? [],
                configurationSnippets: (one.configurationSnippets ?? []).map((snippet) => ({
                    label: snippet.label,
                    description: snippet.description ?? '',
                    body: snippet.body ?? {}
                }))
            });
        });
        const points = this.#h.parse('breakpoints', breakpoints);
        for (const one of points ?? []) this.#out.breakpoints.push({ language: one.language });
    }

    taskDefinitions(value: unknown): void {
        const list = this.#h.parse('taskDefinitions', value);
        for (const one of list ?? []) {
            this.#out.taskDefinitions.push({
                type: one.type,
                required: one.required ?? [],
                properties: one.properties ?? {}
            });
        }
    }

    /** The named patterns, then the matchers that may refer to them. */
    matchers(patterns: unknown, matchers: unknown): void {
        const defs = this.#h.parse('problemPatterns', patterns);
        const known = new Map<string, AppProblemPattern[]>();
        defs?.forEach((def, at) => {
            const place = placeOf('problemPatterns', [at, 'name']);
            const own = this.#patternsOf(def, placeOf('problemPatterns', [at]));
            if (known.has(def.name))
                this.#h.refuse('findings.apps.contributes_repeated', place, def.name);
            known.set(def.name, own);
            this.#out.problemPatterns.push({ name: def.name, patterns: own });
        });
        const list = this.#h.parse('problemMatchers', matchers);
        list?.forEach((one, at) => {
            const place = (field: string): string => placeOf('problemMatchers', [at, field]);
            this.#h.declare(one.name, place('name'));
            let patternsOf: AppProblemPattern[];
            if (typeof one.pattern === 'string') {
                const wanted = one.pattern.startsWith('$') ? one.pattern.slice(1) : one.pattern;
                const found = known.get(wanted);
                if (found === undefined) {
                    this.#h.refuse(
                        'findings.apps.contributes_pattern_unknown',
                        place('pattern'),
                        wanted
                    );
                    return;
                }
                patternsOf = found;
            } else {
                const given = Array.isArray(one.pattern) ? one.pattern : [one.pattern];
                patternsOf = this.#checked(given.map(patternOf), place('pattern'));
            }
            const watching = one.background;
            if (watching !== undefined) {
                this.#regexp(
                    patternText(watching.beginsPattern),
                    place('background.beginsPattern')
                );
                this.#regexp(patternText(watching.endsPattern), place('background.endsPattern'));
            }
            const matcher: AppProblemMatcher = {
                name: one.name,
                owner: one.owner,
                source: one.source ?? '',
                fileLocation: Array.isArray(one.fileLocation)
                    ? one.fileLocation[0]
                    : (one.fileLocation ?? 'relative'),
                patterns: patternsOf,
                severity: one.severity ?? 'error',
                background:
                    watching === undefined
                        ? null
                        : {
                              activeOnStart: watching.activeOnStart === true,
                              beginsPattern: patternText(watching.beginsPattern),
                              endsPattern: patternText(watching.endsPattern)
                          }
            };
            this.#out.problemMatchers.push(matcher);
        });
    }

    /** The patterns of a named definition: its own fields, or its list. */
    #patternsOf(def: ProblemPatternDefShape, place: string): AppProblemPattern[] {
        if (def.patterns !== undefined) return this.#checked(def.patterns.map(patternOf), place);
        if (def.regexp === undefined) {
            this.#h.refuse('findings.apps.contributes_shape', `${place}.regexp`);
            return [];
        }
        return this.#checked([patternOf({ ...def, regexp: def.regexp })], place);
    }

    /** The patterns of one matcher: each compiles, one names the file and one the message. */
    #checked(patterns: AppProblemPattern[], place: string): AppProblemPattern[] {
        patterns.forEach((one, at) => {
            this.#regexp(one.regexp, `${place}[${at}].regexp`);
            if (one.loop && at !== patterns.length - 1) {
                this.#h.refuse('findings.apps.contributes_shape', `${place}[${at}].loop`);
            }
        });
        if (!patterns.some((one) => one.file > 0) || !patterns.some((one) => one.message > 0)) {
            this.#h.refuse('findings.apps.contributes_shape', place);
        }
        return patterns;
    }
}

/** The names of the points this reader takes, which `reader.ts` hands over. */
export type ToolsInput = Record<string, unknown>;

/** Read the tools' points of the whole `contributes` map into the app's contributions. */
export function readTools(map: ToolsInput, helpers: PointHelpers, out: AppContributes): void {
    const reader = new ToolsReader(helpers, out);
    reader.languages(map.languages ?? []);
    reader.grammars(map.grammars ?? []);
    reader.snippets(map.snippets ?? []);
    reader.semantic(
        map.semanticTokenTypes ?? [],
        map.semanticTokenModifiers ?? [],
        map.semanticTokenScopes ?? []
    );
    reader.jsonValidation(map.jsonValidation ?? []);
    reader.debuggers(map.debuggers ?? [], map.breakpoints ?? []);
    reader.taskDefinitions(map.taskDefinitions ?? []);
    reader.matchers(map.problemPatterns ?? [], map.problemMatchers ?? []);
    reader.defaults(map.configurationDefaults ?? {});
}
