// Layer 2, server. The shape of the contribution points that reach the tools, by VS Code's names:
// `languages`, `grammars`, `snippets`, the semantic token points, `jsonValidation`,
// `configurationDefaults`, `debuggers`, `breakpoints`, `taskDefinitions`, `problemPatterns` and
// `problemMatchers`. Each is a zod shape of the fields oculus reads; `shape.ts` joins them to the
// shell's points in `POINTS`, so the editor's JSON Schema of `app.yml` marks the same fields the
// reader refuses. What a shape cannot say (a file the app holds, a regular expression that
// compiles, a name another app already took) is checked after it by the readers of this folder.

import { z } from 'zod';

const text = z.string();
const texts = z.array(text);
const object = z.record(text, z.unknown());

const language = z.strictObject({
    id: text.min(1),
    aliases: texts.optional(),
    extensions: texts.optional(),
    filenames: texts.optional(),
    filenamePatterns: texts.optional(),
    firstLine: text.optional(),
    configuration: text.optional(),
    icon: z.strictObject({ light: text, dark: text }).optional()
});

const grammar = z.strictObject({
    language: text.optional(),
    scopeName: text.min(1),
    path: text.min(1),
    embeddedLanguages: z.record(text, text).optional(),
    injectTo: texts.optional(),
    tokenTypes: z.record(text, z.enum(['string', 'comment', 'other'])).optional()
});

const snippet = z.strictObject({ language: text.min(1), path: text.min(1) });

const semanticType = z.strictObject({
    id: text.min(1),
    superType: text.optional(),
    description: text.optional()
});

const semanticModifier = z.strictObject({ id: text.min(1), description: text.optional() });

const semanticScopes = z.strictObject({
    language: text.optional(),
    scopes: z.record(text, texts)
});

const jsonValidation = z.strictObject({
    fileMatch: z.union([text.min(1), z.array(text.min(1)).min(1)]),
    url: text.min(1)
});

const configurationSnippet = z.strictObject({
    label: text.min(1),
    description: text.optional(),
    body: z.unknown()
});

const debuggerShape = z.strictObject({
    type: text.min(1),
    label: text.min(1),
    languages: texts.optional(),
    program: text.optional(),
    args: texts.optional(),
    runtime: text.optional(),
    runtimeArgs: texts.optional(),
    configurationAttributes: z
        .strictObject({ launch: object.optional(), attach: object.optional() })
        .optional(),
    initialConfigurations: z.array(object).optional(),
    configurationSnippets: z.array(configurationSnippet).optional()
});

const breakpoint = z.strictObject({ language: text.min(1) });

const taskDefinition = z.strictObject({
    type: text.min(1),
    required: texts.optional(),
    properties: object.optional()
});

const group = z.number().int().min(0);

/** One pattern of a problem matcher, with the groups of its regular expression. */
const pattern = z.strictObject({
    regexp: text.min(1),
    kind: z.enum(['file', 'location']).optional(),
    file: group.optional(),
    location: group.optional(),
    line: group.optional(),
    column: group.optional(),
    endLine: group.optional(),
    endColumn: group.optional(),
    severity: group.optional(),
    code: group.optional(),
    message: group.optional(),
    loop: z.boolean().optional()
});

const problemPattern = z.strictObject({
    name: text.min(1),
    regexp: text.min(1).optional(),
    kind: z.enum(['file', 'location']).optional(),
    file: group.optional(),
    location: group.optional(),
    line: group.optional(),
    column: group.optional(),
    endLine: group.optional(),
    endColumn: group.optional(),
    severity: group.optional(),
    code: group.optional(),
    message: group.optional(),
    loop: z.boolean().optional(),
    patterns: z.array(pattern).optional()
});

const watching = z.strictObject({
    activeOnStart: z.boolean().optional(),
    beginsPattern: z.union([text.min(1), z.strictObject({ regexp: text.min(1) })]),
    endsPattern: z.union([text.min(1), z.strictObject({ regexp: text.min(1) })])
});

const problemMatcher = z.strictObject({
    name: text.min(1),
    owner: text.min(1),
    source: text.optional(),
    fileLocation: z.union([text, z.tuple([text, text]).rest(text)]).optional(),
    pattern: z.union([text, pattern, z.array(pattern).min(1)]),
    severity: z.enum(['error', 'warning', 'info']).optional(),
    background: watching.optional()
});

/** The tools' points, by the name the manifest writes them under. */
export const TOOL_POINTS = {
    languages: z.array(language),
    grammars: z.array(grammar),
    snippets: z.array(snippet),
    semanticTokenTypes: z.array(semanticType),
    semanticTokenModifiers: z.array(semanticModifier),
    semanticTokenScopes: z.array(semanticScopes),
    jsonValidation: z.array(jsonValidation),
    configurationDefaults: object,
    debuggers: z.array(debuggerShape),
    breakpoints: z.array(breakpoint),
    taskDefinitions: z.array(taskDefinition),
    problemPatterns: z.array(problemPattern),
    problemMatchers: z.array(problemMatcher)
};

export type ProblemPatternShape = z.infer<typeof pattern>;
export type ProblemPatternDefShape = z.infer<typeof problemPattern>;
