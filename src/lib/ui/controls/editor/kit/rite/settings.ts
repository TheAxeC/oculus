// Layer 3, primitive. The language settings Monaco is given at start for the languages it has none
// of, so that Cmd+/ and Shift+Alt+A comment, a bracket closes and a pair matches in each. rite
// takes its own (kit/rite/rite.ts), and latex and bibtex LaTeX Workshop's (latex-settings.ts).
// shellscript, make, diff and julia take VS Code's own files, extensions/<name>/
// language-configuration.json of microsoft/vscode (MIT License, Copyright (c) Microsoft
// Corporation), each field the file has; Make's line comment is written at the line's first column
// (`noIndent`), as a recipe needs. matlab takes MathWorks' extension's language-configuration.json
// (mathworks/MATLAB-extension-for-vscode, MIT License, Copyright (c) 2023 MathWorks), whose block
// comment puts `%{` and `%}` each on a line of its own, as MATLAB requires, and ocaml the OCaml
// Platform's languages/ocaml.json (ocamllabs/vscode-ocaml-platform, ISC License, Copyright (c) 2019
// OCaml Labs), whose comment is a block comment alone. common-lisp, which no file of VS Code's or
// of an extension covers, takes `;` and `#|` `|#` as Common Lisp writes them, with the three
// bracket pairs and the double quote; cmake, fortran-free-form, fortran-fixed-form, jinja and
// svelte take their comment and the three bracket pairs.
//
// The copied files keep their JSON shape and are read by kit/languages/configuration.ts, the reader
// of an app's language configuration, so a new version of a file is copied in as it stands. The
// languages Monaco registers itself (C, C++, Lua, Ruby, SCSS, Java, Dart and the others) keep its
// own settings. Monaco also has settings of Julia's, with no comment rule, which it gives the first
// time it meets a Julia model, once its module of the language has loaded. Monaco merges the
// settings of a language field by field, a higher rank winning and the later of two at one rank, so
// the settings here are given through Monaco's language configuration service at a rank above the
// one Monaco gives its own at, and Julia has VS Code's comment rule, brackets and pairs whenever
// Monaco's arrive. An app's settings of a language are given a rank higher still
// (kit/languages/register.ts), so they win over these. The ids are the ones the editor registers
// (kit/languages/grammars.ts's `shikiId`), which is Shiki's.

import type * as Monaco from 'monaco-editor';
import { languageConfiguration } from '../languages/configuration';
import { LATEX_WORKSHOP_BIBTEX, LATEX_WORKSHOP_LATEX } from './latex-settings';
import { RITE_CONFIGURATION } from './rite';

type Configuration = Monaco.languages.LanguageConfiguration;

/** Monaco's language configuration service, which takes a language's settings at a rank. */
export type Registry = {
    register(
        languageId: string,
        configuration: Configuration,
        priority: number
    ): Monaco.IDisposable;
};

/** The three bracket pairs every one of the bracketed languages has. */
const BRACKETS: Monaco.languages.CharacterPair[] = [
    ['(', ')'],
    ['[', ']'],
    ['{', '}']
];

/**
 * The settings of a language that comments with `comments` and has the three bracket pairs, which
 * close, with the `extra` pairs beside them; Monaco surrounds a selection with the pairs that
 * close.
 */
function bracketed(
    comments: Monaco.languages.CommentRule,
    extra: Monaco.languages.IAutoClosingPairConditional[] = []
): Configuration {
    return {
        comments,
        brackets: BRACKETS,
        autoClosingPairs: [...BRACKETS.map(([open, close]) => ({ open, close })), ...extra]
    };
}

/** VS Code's extensions/shellscript/language-configuration.json. */
const VSCODE_SHELLSCRIPT: unknown = {
    comments: {
        lineComment: '#'
    },
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
    ],
    autoClosingPairs: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string'] },
        { open: '`', close: '`', notIn: ['string'] }
    ],
    surroundingPairs: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['"', '"'],
        ["'", "'"],
        ['`', '`']
    ],
    folding: {
        markers: {
            start: '^\\s*#\\s*#?region\\b.*',
            end: '^\\s*#\\s*#?endregion\\b.*'
        }
    }
};

/** VS Code's extensions/make/language-configuration.json. */
const VSCODE_MAKE: unknown = {
    comments: {
        lineComment: {
            comment: '#',
            noIndent: true
        }
    },
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
    ],
    autoClosingPairs: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        {
            open: "'",
            close: "'",
            notIn: ['string', 'comment']
        },
        {
            open: '"',
            close: '"',
            notIn: ['string', 'comment']
        }
    ]
};

/** VS Code's extensions/diff/language-configuration.json. */
const VSCODE_DIFF: unknown = {
    comments: {
        lineComment: '#',
        blockComment: ['#', ' ']
    },
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
    ]
};

/** VS Code's extensions/julia/language-configuration.json. */
const VSCODE_JULIA: unknown = {
    comments: {
        lineComment: '#',
        blockComment: ['#=', '=#']
    },
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
    ],
    autoClosingPairs: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['`', '`'],
        { open: '"', close: '"', notIn: ['string', 'comment'] }
    ],
    surroundingPairs: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['"', '"'],
        ['`', '`']
    ],
    folding: {
        markers: {
            start: '^\\s*#region',
            end: '^\\s*#endregion'
        }
    },
    indentationRules: {
        increaseIndentPattern:
            '^(\\s*|.*=\\s*|.*@\\w*\\s*)[\\w\\s]*(?:["\'`][^"\'`]*["\'`])*[\\w\\s]*\\b(if|while|for|function|macro|(mutable\\s+)?struct|abstract\\s+type|primitive\\s+type|let|quote|try|begin|.*\\)\\s*do|else|elseif|catch|finally)\\b(?!(?:.*\\bend\\b[^\\]]*)|(?:[^\\[]*\\].*)$).*$',
        decreaseIndentPattern: '^\\s*(end|else|elseif|catch|finally)\\b.*$'
    }
};

/** MathWorks' language-configuration.json. */
const MATHWORKS_MATLAB: unknown = {
    comments: {
        blockComment: ['\n%{\n', '\n%}\n'],
        lineComment: '%'
    },
    brackets: [
        ['(', ')'],
        ['[', ']'],
        ['{', '}'],
        ['%{', '%}']
    ],
    autoClosingPairs: [
        {
            open: '(',
            close: ')'
        },
        {
            open: '[',
            close: ']'
        },
        {
            open: '{',
            close: '}'
        },
        {
            open: "'",
            close: "'",
            notIn: ['comment', 'string']
        },
        {
            open: '"',
            close: '"',
            notIn: ['comment', 'string']
        },
        {
            open: '%{',
            close: '%}',
            notIn: ['string']
        }
    ],
    surroundingPairs: [
        ['(', ')'],
        ['[', ']'],
        ['{', '}'],
        ["'", "'"],
        ['"', '"']
    ],
    indentationRules: {
        increaseIndentPattern:
            '^\\s*\\b(?:for|parfor|spmd|if|elseif|else|while|try|catch|switch|function|classdef|properties|enumeration|events|methods|arguments)\\b',
        decreaseIndentPattern: '^\\s*\\b(?:elseif|else|catch|end)\\b'
    },
    onEnterRules: [
        {
            beforeText: '%(?!{).*$',
            afterText: '\\S',
            action: {
                indent: 'none',
                appendText: '% '
            }
        },
        {
            previousLineText: '.*(?<!\\.\\.\\.)$',
            beforeText: '\\.\\.\\.\\s*$',
            afterText: '^\\s*$',
            action: {
                indent: 'indent'
            }
        },
        {
            beforeText: '^\\s*(\\bcase\\s.+|\\botherwise)\\s*$',
            afterText: '\\s*',
            action: {
                indent: 'indent'
            }
        }
    ]
};

/** The OCaml Platform's languages/ocaml.json. */
const OCAML_PLATFORM_OCAML: unknown = {
    autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: '(*', close: '*', notIn: ['string'] },
        { open: '[|', close: '|', notIn: ['string'] },
        { open: '{|', close: '|', notIn: ['string'] }
    ],
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['[|', '|]'],
        ['{|', '|}']
    ],
    comments: {
        blockComment: ['(*', '*)']
    },
    surroundingPairs: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ["'", "'"],
        ['"', '"']
    ],
    indentationRules: {
        decreaseIndentPattern: '^\\s*(end|done|with|in|else)\\b|^\\s*;;',
        increaseIndentPattern:
            "\\b(begin|object)\\s*$|\\b(let|and)([$&*+\\-/=>@^|<][!?$&*+\\-/=>@^|%:]*)? [a-zA-Z0-9'_-]+( [^ ]+)* =\\s*$|method!?[ \\t]+.*=[ \\t]*$|->[ \\t]*$|\\b(for|while)(_lwt)?[ \\t]+.*[ \\t]+do[ \\t]*$|(\\btry(_lwt)?$|\\bif\\s+.*\\sthen$|\\belse|[:=]\\s*sig|=\\s*struct)\\s*$",
        indentNextLinePattern:
            '(?!\\bif.*then.*(else.*|(;|[ \\t]in)[ \\t]*$))\\bif|\\bthen[ \\t]*$|\\belse[ \\t]*$$'
    },
    onEnterRules: [
        {
            beforeText: '\\(\\*\\*',
            afterText: '\\*\\)',
            action: {
                indent: 'none',
                appendText: '    '
            }
        },
        {
            beforeText: '\\(\\*',
            afterText: '\\*\\)',
            action: {
                indent: 'none',
                appendText: '   '
            }
        }
    ]
};

/** The settings of every language given here, by the id the editor registers. */
function settings(): [string, Configuration][] {
    // Monaco reads a surrounding pair as an object; rite's file gives it as a two-element array.
    const surroundingPairs = RITE_CONFIGURATION.surroundingPairs.map(([open, close]) => ({
        open,
        close
    }));
    return [
        ['rite', { ...RITE_CONFIGURATION, surroundingPairs }],
        ['latex', languageConfiguration(LATEX_WORKSHOP_LATEX)],
        ['bibtex', languageConfiguration(LATEX_WORKSHOP_BIBTEX)],
        ['shellscript', languageConfiguration(VSCODE_SHELLSCRIPT)],
        ['make', languageConfiguration(VSCODE_MAKE)],
        ['diff', languageConfiguration(VSCODE_DIFF)],
        ['julia', languageConfiguration(VSCODE_JULIA)],
        ['matlab', languageConfiguration(MATHWORKS_MATLAB)],
        ['ocaml', languageConfiguration(OCAML_PLATFORM_OCAML)],
        [
            'common-lisp',
            bracketed({ lineComment: ';', blockComment: ['#|', '|#'] }, [
                { open: '"', close: '"', notIn: ['string', 'comment'] }
            ])
        ],
        ['cmake', bracketed({ lineComment: '#' })],
        ['fortran-free-form', bracketed({ lineComment: '!' })],
        ['fortran-fixed-form', bracketed({ lineComment: '!' })],
        ['jinja', bracketed({ blockComment: ['{#', '#}'] })],
        ['svelte', bracketed({ blockComment: ['<!--', '-->'] })]
    ];
}

/**
 * The rank the settings here are given at: one above the 100 Monaco's `setLanguageConfiguration`
 * gives every language's settings at, its own included (standaloneLanguages.js). An app's settings
 * of a language rank above these (languages/register.ts).
 */
export const OCULUS_RANK = 101;

/**
 * Give Monaco the settings of rite and of the languages it does not know, and VS Code's of Julia,
 * at a rank above Monaco's own.
 */
export function registerSettings(registry: Registry): void {
    for (const [id, configuration] of settings()) {
        registry.register(id, configuration, OCULUS_RANK);
    }
}
