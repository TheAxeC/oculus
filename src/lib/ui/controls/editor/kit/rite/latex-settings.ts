// Layer 3, primitive. The language settings of LaTeX and BibTeX as LaTeX Workshop v10.19.0 gives
// them to VS Code, copied whole from its two files, syntax/latex-language-configuration.json and
// syntax/bibtex-language-configuration.json (LaTeX Workshop, MIT License, Copyright (c) 2016 James
// Yu): the `%` line comment, the brackets (for LaTeX also the `\left`/`\right` and `\bigl`/`\bigr`
// pairs, so the editor matches them), the auto-closing and surrounding pairs, the folding markers,
// and the word pattern, with LaTeX's indentation rules and `autoCloseBefore`. A LaTeX auto-closing
// pair that closes with nothing (`\begin{`, `\left(`, `@(` and the others) keeps the editor from
// closing the bracket typed after it, so the `@(` suggestion, which writes its own `\right)`,
// leaves no stray `)`. The data keeps the files' JSON shape, which kit/languages/configuration.ts
// turns into Monaco's (kit/rite/settings.ts), so a new version of the files is copied in as it
// stands.

/** LaTeX Workshop's syntax/latex-language-configuration.json. */
export const LATEX_WORKSHOP_LATEX: unknown = {
    comments: {
        lineComment: '%'
    },
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['[', ')'],
        ['(', ']'],
        ['\\{', '\\}'],
        ['\\left(', '\\right)'],
        ['\\left(', '\\right]'],
        ['\\left(', '\\right.'],
        ['\\left.', '\\right)'],
        ['\\left[', '\\right]'],
        ['\\left[', '\\right)'],
        ['\\left[', '\\right.'],
        ['\\left.', '\\right]'],
        ['\\left\\{', '\\right\\}'],
        ['\\left\\{', '\\right.'],
        ['\\left.', '\\right\\}'],
        ['\\left<', '\\right>'],
        ['\\bigl(', '\\bigr)'],
        ['\\bigl[', '\\bigr]'],
        ['\\bigl\\{', '\\bigr\\}'],
        ['\\Bigl(', '\\Bigr)'],
        ['\\Bigl[', '\\Bigr]'],
        ['\\Bigl\\{', '\\Bigr\\}'],
        ['\\biggl(', '\\biggr)'],
        ['\\biggl[', '\\biggr]'],
        ['\\biggl\\{', '\\biggr\\}'],
        ['\\Biggl(', '\\Biggr)'],
        ['\\Biggl[', '\\Biggr]'],
        ['\\Biggl\\{', '\\Biggr\\}'],
        ['\\langle', '\\rangle'],
        ['\\lvert', '\\rvert'],
        ['\\lVert', '\\rVert'],
        ['\\left|', '\\right|'],
        ['\\left.', '\\right|'],
        ['\\left|', '\\right.'],
        ['\\left\\vert', '\\right\\vert'],
        ['\\left\\|', '\\right\\|'],
        ['\\left\\Vert', '\\right\\Vert'],
        ['\\left\\langle', '\\right\\rangle'],
        ['\\left\\lvert', '\\right\\rvert'],
        ['\\left\\lVert', '\\right\\rVert'],
        ['\\bigl\\langle', '\\bigr\\rangle'],
        ['\\bigl|', '\\bigr|'],
        ['\\bigl\\vert', '\\bigr\\vert'],
        ['\\bigl\\lvert', '\\bigr\\rvert'],
        ['\\bigl\\|', '\\bigr\\|'],
        ['\\bigl\\lVert', '\\bigr\\rVert'],
        ['\\bigl\\Vert', '\\bigr\\Vert'],
        ['\\Bigl\\langle', '\\Bigr\\rangle'],
        ['\\Bigl|', '\\Bigr|'],
        ['\\Bigl\\lvert', '\\Bigr\\rvert'],
        ['\\Bigl\\vert', '\\Bigr\\vert'],
        ['\\Bigl\\|', '\\Bigr\\|'],
        ['\\Bigl\\lVert', '\\Bigr\\rVert'],
        ['\\Bigl\\Vert', '\\Bigr\\Vert'],
        ['\\biggl\\langle', '\\biggr\\rangle'],
        ['\\biggl|', '\\biggr|'],
        ['\\biggl\\lvert', '\\biggr\\rvert'],
        ['\\biggl\\vert', '\\biggr\\vert'],
        ['\\biggl\\|', '\\biggr\\|'],
        ['\\biggl\\lVert', '\\biggr\\rVert'],
        ['\\biggl\\Vert', '\\biggr\\Vert'],
        ['\\Biggl\\langle', '\\Biggr\\rangle'],
        ['\\Biggl|', '\\Biggr|'],
        ['\\Biggl\\lvert', '\\Biggr\\rvert'],
        ['\\Biggl\\vert', '\\Biggr\\vert'],
        ['\\Biggl\\|', '\\Biggr\\|'],
        ['\\Biggl\\lVert', '\\Biggr\\rVert'],
        ['\\Biggl\\Vert', '\\Biggr\\Vert']
    ],
    autoClosingPairs: [
        ['\\begin{', ''],
        ['\\left(', ''],
        ['\\left[', ''],
        ['\\left{', ''],
        ['\\bigl(', ''],
        ['\\bigl[', ''],
        ['\\bigl{', ''],
        ['\\Bigl(', ''],
        ['\\Bigl[', ''],
        ['\\Bigl{', ''],
        ['\\biggl(', ''],
        ['\\biggl[', ''],
        ['\\biggl{', ''],
        ['\\Biggl(', ''],
        ['\\Biggl[', ''],
        ['\\Biggl{', ''],
        ['\\(', ''],
        ['\\[', ''],
        ['\\{', ''],
        ['@(', ''],
        ['@[', ''],
        ['@{', ''],
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['`', "'"]
    ],
    surroundingPairs: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['"', '"'],
        ["'", "'"],
        ['`', "'"],
        ['$', '$']
    ],
    indentationRules: {
        increaseIndentPattern: '\\\\begin{(?!document)([^}]*)}(?!.*\\\\end{\\1})',
        decreaseIndentPattern: '^\\s*\\\\end{(?!document)'
    },
    folding: {
        markers: {
            start: '^\\s*(%\\s*region|%?\\s*\\\\begingroup)\\b',
            end: '^\\s*(%\\s*endregion|%?\\s*\\\\endgroup)\\b'
        }
    },
    autoCloseBefore: ';:.,={}])>\\` \n\t$',
    wordPattern: {
        pattern: '(__)|(\\*\\*)|(\\.\\.\\.)|(\\p{Alphabetic}|\\p{Number}|\\p{Nonspacing_Mark}){1,}',
        flags: 'u'
    }
};

/** LaTeX Workshop's syntax/bibtex-language-configuration.json. */
export const LATEX_WORKSHOP_BIBTEX: unknown = {
    comments: {
        lineComment: '%'
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
        ['`', "'"]
    ],
    surroundingPairs: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['"', '"'],
        ["'", "'"],
        ['`', "'"],
        ['$', '$']
    ],
    folding: {
        markers: {
            start: '^\\s*%?\\s*region\\b',
            end: '^\\s*%?\\s*endregion\\b'
        }
    },
    wordPattern: {
        pattern: '(__)|(\\*\\*)|(\\.\\.\\.)|(\\p{Alphabetic}|\\p{Number}|\\p{Nonspacing_Mark}){1,}',
        flags: 'u'
    }
};
