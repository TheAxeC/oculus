// Layer 3, primitive. The rite language the editor colours: its TextMate grammar and its language
// configuration (comments, brackets, auto-closing and surrounding pairs, word pattern). They are
// the two files of the VS Code extension for rite in cathedra (utils/vscode-rite), held here as
// values in oculus's own tree so that nothing is read from that repository at run time. Every value
// is the file's; the word pattern is a RegExp built from the file's string. The grammar loads into
// the highlighter on the first rite file (kit/load.ts), and the configuration is given to Monaco at
// start (kit/rite/settings.ts).

import type * as Monaco from 'monaco-editor';
import type { LanguageRegistration } from 'shiki';

/** The rite grammar, with the name and scope the editor loads it under. */
export const RITE_GRAMMAR = {
    $schema: 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
    name: 'rite',
    scopeName: 'source.rite',
    comment:
        "Syntax for rite. Written against the READER (src/rite/src/source/reader.cpp), not against a generic Lisp: rite's number grammar is strict, `.` `:` `/` `#` are ordinary symbol characters, and a comma is a read ERROR rather than whitespace. Each rule below cites the rite rule it encodes, because a grammar that quietly disagrees with the reader is worse than none: it teaches the wrong thing about what parses.",
    patterns: [
        {
            include: '#front-end-directive'
        },
        {
            include: '#comment-block'
        },
        {
            include: '#comment-line'
        },
        {
            include: '#string'
        },
        {
            include: '#character'
        },
        {
            include: '#illegal-comma'
        },
        {
            include: '#number'
        },
        {
            include: '#tagged-literal'
        },
        {
            include: '#quote'
        },
        {
            include: '#keyword'
        },
        {
            include: '#definition'
        },
        {
            include: '#special-form'
        },
        {
            include: '#constant'
        },
        {
            include: '#operator'
        },
        {
            include: '#bracket'
        },
        {
            include: '#symbol'
        }
    ],
    repository: {
        'front-end-directive': {
            comment:
                '`#!parser NAME` (ADR 0069 B). ONLY on the first non-blank line: a file that merely contains the text further down is ordinary rite, and the reader says so in as many words. \\A anchors it to the start of the document.',
            match: '\\A\\s*(#!parser)[ \\t]+([^\\s]+)',
            captures: {
                '1': {
                    name: 'keyword.control.directive.front-end.rite'
                },
                '2': {
                    name: 'entity.name.type.parser.rite'
                }
            }
        },
        'comment-block': {
            comment: "#| ... |#: nests, like the reader's.",
            name: 'comment.block.rite',
            begin: '#\\|',
            end: '\\|#',
            patterns: [
                {
                    include: '#comment-block'
                }
            ]
        },
        'comment-line': {
            name: 'comment.line.semicolon.rite',
            begin: ';',
            end: '$'
        },
        string: {
            name: 'string.quoted.double.rite',
            begin: '"',
            end: '"',
            patterns: [
                {
                    comment:
                        'The escapes the reader actually accepts. Anything else after a backslash is NOT an escape, so it is marked invalid rather than quietly coloured as one.',
                    name: 'constant.character.escape.rite',
                    match: '\\\\[ntr0abfve\\\\"]'
                },
                {
                    name: 'invalid.illegal.unknown-escape.rite',
                    match: '\\\\.'
                }
            ]
        },
        character: {
            comment:
                '`\\x` and `\\newline` read as ONE-CHARACTER STRINGS: rite has no char type. Named forms first so `\\newline` is not read as `\\n` followed by `ewline`.',
            name: 'constant.character.rite',
            match: '\\\\(newline|space|tab|return|formfeed|backspace)(?=[\\s,()\\[\\]{}";]|$)|\\\\.(?=[\\s,()\\[\\]{}";]|$)'
        },
        'illegal-comma': {
            comment:
                'A comma is a READ ERROR in rite, not whitespace (reader.cpp: it terminates an atom and is then rejected). Every Lisp grammar treats it as either whitespace or unquote, so borrowing one hides the single most common paste-from-elsewhere mistake. Showing it red is why this file exists rather than reusing lisp.',
            name: 'invalid.illegal.comma.rite',
            match: ','
        },
        number: {
            patterns: [
                {
                    comment:
                        'Fixed-point (Q32.16): `3.5q`, `-2q`. A distinct TYPE, not a number, so it gets its own scope: mixing the two is a type error and the colours should not imply otherwise.',
                    name: 'constant.numeric.fixed.rite',
                    match: '(?<![^\\s,()\\[\\]{}";])-?\\d+(\\.\\d+)?q(?=[\\s,()\\[\\]{}";]|$)'
                },
                {
                    name: 'constant.numeric.hex.rite',
                    match: '(?<![^\\s,()\\[\\]{}";])-?0[xX][0-9a-fA-F]+(?=[\\s,()\\[\\]{}";]|$)'
                },
                {
                    name: 'constant.numeric.binary.rite',
                    match: '(?<![^\\s,()\\[\\]{}";])-?0[bB][01]+(?=[\\s,()\\[\\]{}";]|$)'
                },
                {
                    comment:
                        'STRICT, matching isNumberToken: an optional `-`, at least one integer digit, and a fraction only as `.` followed by digits. `+5`, `.5`, `5.`, `inf` and `nan` are SYMBOLS in rite (and `.5` is a read error), so they must not colour as numbers: that is exactly the misconception a borrowed Lisp grammar teaches.',
                    name: 'constant.numeric.rite',
                    match: '(?<![^\\s,()\\[\\]{}";])-?\\d+(\\.\\d+)?([eE][+-]?\\d+)?(?=[\\s,()\\[\\]{}";]|$)'
                }
            ]
        },
        'tagged-literal': {
            comment:
                '`#tag <form>` (ADR 0069 A): the reader reads the tag up to a delimiter, then ONE ordinary form. `#` is an ordinary symbol character, so this only fires when `#` OPENS a token: `my#tag` is a plain symbol and stays one. `#{` (set) and `#|` (block comment) are excluded, being different constructs.',
            match: '(?<![^\\s,()\\[\\]{}";])(#)(?![{|!])([^\\s,()\\[\\]{}";]+)',
            captures: {
                '1': {
                    name: 'punctuation.definition.tag.rite'
                },
                '2': {
                    name: 'entity.name.tag.rite'
                }
            }
        },
        quote: {
            comment:
                'Reader sugar. `~@` before `~` so the splice is not split. `@` is deref (a world-state ref), not a value cell.',
            name: 'keyword.operator.quote.rite',
            match: "~@|['`~@]"
        },
        keyword: {
            comment:
                '`:health`: interned, self-evaluating. `:` is an ordinary symbol char, so a keyword is only one when the colon OPENS the token; `a:b` is a plain symbol.',
            name: 'constant.other.keyword.rite',
            match: '(?<![^\\s,()\\[\\]{}";])::?[^\\s,()\\[\\]{}";]+'
        },
        definition: {
            comment:
                'A defining form plus the name it binds, so the name reads as a definition rather than as another symbol. Longest-first inside each group: `defn/syntax` must win over `defn`, `def-trait` over `def`.',
            patterns: [
                {
                    match: '(?<=\\()(defn/syntax|defn/both|defmut/syntax|def/syntax|def/both|defmacro|defreader|defonce|defmut|defn|def)(?=[\\s,()\\[\\]{}";])\\s*([^\\s,()\\[\\]{}";]+)?',
                    captures: {
                        '1': {
                            name: 'storage.type.definition.rite'
                        },
                        '2': {
                            name: 'entity.name.function.rite'
                        }
                    }
                },
                {
                    comment:
                        'The world tier (curia): traits, resources, actors, scenes, nodes, and the behaviour forms. Their names are TYPES/registrations rather than values, so they scope as types.',
                    match: '(?<=\\()(def-trait|def-resource|def-actor|def-scene|def-node|def-phase|def-pipeline|def-startup|def-atomic|def-shared|def-mutex|defsystem|defobserver|defprocess|defquery|deftick|record)(?=[\\s,()\\[\\]{}";])\\s*([^\\s,()\\[\\]{}";]+)?',
                    captures: {
                        '1': {
                            name: 'storage.type.definition.rite'
                        },
                        '2': {
                            name: 'entity.name.type.rite'
                        }
                    }
                }
            ]
        },
        'special-form': {
            comment:
                "The reserved words the COMPILER enforces (compiler.cpp isReservedWord) plus the prelude's control sugar. Reserved words cannot be redefined at top level, which is a real, checkable property: this list is a copy of that one rather than a guess at what looks built-in.",
            patterns: [
                {
                    name: 'keyword.control.rite',
                    match: '(?<![^\\s,()\\[\\]{}";])(if|do|let|loop|recur|fn|quote|quasiquote|unquote|unquote-splice|and|or|not|apply|match|for|try|catch|throw|set!|when|when-not|cond|case|doseq|->>|->|with-lock|with-scope)(?=[\\s,()\\[\\]{}";]|$)'
                },
                {
                    comment:
                        'Module and world-state operators. `export`/`import` shape the namespace; `field`/`field!` and the `-rel` pair are the world-state accessors.',
                    name: 'keyword.other.rite',
                    match: '(?<![^\\s,()\\[\\]{}";])(export|import-macros|import|map-template|each-entity|field-rel!|field-rel|field!|field|submit-blocking|submit|parallel-for|parallel-map|swap!|reset!|fx|wait|yield|spawn|register-parser!)(?=[\\s,()\\[\\]{}";]|$)'
                }
            ]
        },
        constant: {
            name: 'constant.language.rite',
            match: '(?<![^\\s,()\\[\\]{}";])(true|false|nil)(?=[\\s,()\\[\\]{}";]|$)'
        },
        operator: {
            comment:
                'The FUSED operators (compiler.cpp): reserved, but shadowable by a local. The `.`-suffixed twins are the deterministic fixed-point suite.',
            name: 'keyword.operator.rite',
            match: '(?<![^\\s,()\\[\\]{}";])([-+*/]\\.?|=|<=|>=|<|>|[-+*/]\\.|quot|rem|mod)(?=[\\s,()\\[\\]{}";]|$)'
        },
        bracket: {
            patterns: [
                {
                    name: 'punctuation.section.set.rite',
                    match: '#\\{'
                },
                {
                    name: 'punctuation.section.list.rite',
                    match: '[()]'
                },
                {
                    name: 'punctuation.section.vector.rite',
                    match: '[\\[\\]]'
                },
                {
                    name: 'punctuation.section.map.rite',
                    match: '[{}]'
                }
            ]
        },
        symbol: {
            comment:
                'Everything else. `.` `:` `/` `#` are ordinary symbol characters in rite (by decision, a symbol has no internal structure and those characters are ordinary letters), so `a.b`, `mod::name` and `my#tag` are each ONE symbol.',
            patterns: [
                {
                    comment: 'A qualified reference `alias::name`: the module-scoped read.',
                    match: '(?<![^\\s,()\\[\\]{}";])([^\\s,()\\[\\]{}";:]+)(::)([^\\s,()\\[\\]{}";]+)',
                    captures: {
                        '1': {
                            name: 'entity.name.namespace.rite'
                        },
                        '2': {
                            name: 'punctuation.accessor.rite'
                        },
                        '3': {
                            name: 'variable.other.rite'
                        }
                    }
                },
                {
                    name: 'variable.other.rite',
                    match: '[^\\s,()\\[\\]{}";]+'
                }
            ]
        }
    }
} as unknown as LanguageRegistration;

/**
 * The rite language configuration as the file holds it. A pair of `surroundingPairs` is a
 * two-element array here, the form of a VS Code configuration file; Monaco reads an object, which
 * kit/rite/settings.ts makes of it.
 */
export type RiteConfiguration = Omit<Monaco.languages.LanguageConfiguration, 'surroundingPairs'> & {
    surroundingPairs: Monaco.languages.CharacterPair[];
};

/** The rite language configuration. */
export const RITE_CONFIGURATION: RiteConfiguration = {
    comments: {
        lineComment: ';'
    },
    brackets: [
        ['(', ')'],
        ['[', ']'],
        ['{', '}']
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
            open: '"',
            close: '"',
            notIn: ['string', 'comment']
        }
    ],
    surroundingPairs: [
        ['(', ')'],
        ['[', ']'],
        ['{', '}'],
        ['"', '"']
    ],
    wordPattern: new RegExp('[^\\s()\\[\\]{}";]+')
};
