// Layer 1, data, pure. The one reader of LaTeX text: the magic comments at the head of a file, the
// sectioning commands of a text and the commands that include another file. The server (the root
// and the program of a main file, the outline over includes) and the page (the Files Outline, the
// editor's sticky scroll) read the same sections from here, so the two never disagree about what a
// heading is.
//
// The reader holds no parser. It takes latex-utensils' `parse` as an argument, so the server binds
// the package with a static import (server/content/latex/reader.ts) and the page binds it through
// `lazyReader`, which loads the package as a chunk of its own on first use; the package is a PEG
// over the whole text and is large, and a page that never opens a LaTeX file does not fetch it.
//
// The parser refuses a file it cannot parse, so the magic comments are parsed alone: the block of
// comment and blank lines before the first line of code never meets the body, and a body the parser
// refuses never hides the root or the program of its file. A text the parser refuses is read for
// its sectioning commands by a line scan that skips comments and verbatim blocks, and says so in
// `refused`; its includes are not read, since a path guessed from text the parser could not read
// would send the server into a file the text may not name.
//
// It also holds the words around a LaTeX file that both sides name: the programs latexmk builds
// with, the formatters Format Document can run (`latex.formatter` of config/behavior.yml, as LaTeX
// Workshop's `latex-workshop.formatting.latex` offers them), and the words the LaTeX endpoint and
// the LaTeX terminal action refuse with beyond the file operations' own. A refusal is answered as
// a word, never as a sentence, and the page says the sentence the catalog holds for it
// (state/shared/answers/answers.ts); a refusal these words do not name is one of the file
// operations' words (data/file-ops.ts).

import type { latexParser as lp } from 'latex-utensils';

/** The parser the reader takes: latex-utensils' `latexParser.parse`. */
export type Parse = (text: string, options?: { enableComment?: boolean }) => lp.LatexAst;

/** The programs latexmk can build a main file with, the first being the default. */
export const PROGRAMS = ['pdflatex', 'xelatex', 'lualatex'] as const;
export type Program = (typeof PROGRAMS)[number];

/** The formatters of `latex.formatter`; `none` formats nothing. */
export const FORMATTERS = ['none', 'latexindent', 'tex-fmt', 'badness'] as const;
export type Formatter = (typeof FORMATTERS)[number];

/** The words a LaTeX request is refused with beyond the file operations' own. */
export const LATEX_REFUSALS = [
    'no-project',
    'not-a-file',
    'not-a-main',
    'count-missing',
    'count-timeout',
    'count-failed',
    'format-none',
    'latexindent-missing',
    'tex-fmt-missing',
    'badness-missing',
    'format-timeout',
    'format-failed'
] as const;
export type LatexRefusal = (typeof LATEX_REFUSALS)[number];

/** The sectioning commands, from the outermost (level 0) to the innermost (level 6). */
export const SECTION_COMMANDS = [
    'part',
    'chapter',
    'section',
    'subsection',
    'subsubsection',
    'paragraph',
    'subparagraph'
] as const;

/** One sectioning command: its level (0 to 6), its title as written and its line (from one). */
export type Section = { level: number; title: string; line: number };

/** The commands that include another file's text. */
export type IncludeCommand = 'input' | 'include' | 'subfile' | 'import';

/**
 * One include command: which, the path it names as written (without a `.tex` added) and its line.
 */
export type Include = { command: IncludeCommand; path: string; line: number };

/**
 * What a text holds: whether the parser refused it, and its sections and includes in order. A
 * refused text has the sections its line scan found and no includes.
 */
export type TexRead = { refused: boolean; sections: Section[]; includes: Include[] };

/** One line with its comment cut off: everything from the first `%` that is not escaped. */
export function uncommented(line: string): string {
    for (let at = 0; at < line.length; at += 1) {
        if (line[at] === '\\') {
            at += 1;
            continue;
        }
        if (line[at] === '%') return line.slice(0, at);
    }
    return line;
}

/** A magic comment: `!TEX`, a key, an equals sign and a value, the spaces between free. */
const MAGIC = /^\s*!\s*TEX\s+([A-Za-z][\w-]*)\s*=\s*(.*?)\s*$/i;

/** A line that is blank or a comment, which is what the head of a file is made of. */
const HEAD_LINE = /^\s*(%.*)?$/;

/**
 * The magic comments of a file's leading comment block, by lower-cased key. The block is the lines
 * before the first line that is neither blank nor a comment; a comment after code is not read. The
 * value is trimmed, and the first comment naming a key wins.
 */
export function magicCommentsWith(parse: Parse, text: string): ReadonlyMap<string, string> {
    const found = new Map<string, string>();
    const lines = text.split(/\r?\n/);
    const end = lines.findIndex((line) => !HEAD_LINE.test(line));
    const block = lines.slice(0, end < 0 ? lines.length : end).join('\n');
    if (!block.includes('%')) return found;
    try {
        const ast = parse(block, { enableComment: true });
        for (const comment of ast.comment ?? []) {
            const magic = MAGIC.exec(comment.content);
            if (magic !== null && !found.has(magic[1].toLowerCase())) {
                found.set(magic[1].toLowerCase(), magic[2]);
            }
        }
    } catch {
        // A head the parser refuses names no magic comment.
    }
    return found;
}

/** The environments whose lines hold no commands. */
const VERBATIM = ['verbatim', 'lstlisting', 'minted', 'comment'];

/** The text between the brace opening at `from` and its match, or null when it never closes. */
function braced(text: string, from: number): string | null {
    let depth = 0;
    for (let at = from; at < text.length; at += 1) {
        const char = text[at];
        const escaped = at > 0 && text[at - 1] === '\\';
        if (char === '{' && !escaped) depth += 1;
        else if (char === '}' && !escaped) {
            depth -= 1;
            if (depth === 0) return text.slice(from + 1, at);
        }
    }
    return null;
}

/** The text with every comment, and every line of a verbatim block, cut to an empty line. */
function codeOf(text: string): string {
    let skipping: string | null = null;
    const kept = text.split(/\r?\n/).map((line) => {
        const code = uncommented(line);
        if (skipping !== null) {
            if (code.includes(`\\end{${skipping}}`)) skipping = null;
            return '';
        }
        const begun = VERBATIM.find((name) => code.includes(`\\begin{${name}}`));
        if (begun !== undefined && !code.includes(`\\end{${begun}}`)) {
            skipping = begun;
            return '';
        }
        return code;
    });
    return kept.join('\n');
}

/**
 * The sectioning commands of a text, found by a scan of its lines and not by the parser: the
 * command, its optional short title, and the braces after it. A `%` comment and a verbatim block
 * hold none, and a title whose brace never closes is skipped. It is what a text the parser refuses
 * is read with. On a text the parser accepts it finds the same sections except in three known
 * forms: a sectioning command inside `\verb` is read as a section, a title that ends in `\\` drops
 * the section, and a verbatim block opened and closed on one line is read inside.
 */
export function scanSections(text: string): Section[] {
    const code = codeOf(text);
    const found: Section[] = [];
    const command = new RegExp(
        `\\\\(${SECTION_COMMANDS.join('|')})\\*?\\s*(?:\\[[^\\]\\n]*\\])?\\s*\\{`,
        'g'
    );
    let line = 1;
    let counted = 0;
    for (let match = command.exec(code); match !== null; match = command.exec(code)) {
        for (; counted < match.index; counted += 1) if (code[counted] === '\n') line += 1;
        const title = braced(code, match.index + match[0].length - 1)
            ?.replace(/\s+/g, ' ')
            .trim();
        if (title === undefined || title === '') continue;
        found.push({ level: SECTION_COMMANDS.findIndex((one) => one === match[1]), title, line });
    }
    return found;
}

/** The text between a group's braces, as the source wrote it. */
function groupText(text: string, group: lp.Group): string {
    return text.slice(group.location.start.offset + 1, group.location.end.offset - 1);
}

/** A title as written: its comments cut off and its runs of whitespace joined to one space. */
function titleOf(text: string, group: lp.Group): string {
    const lines = groupText(text, group).split(/\r?\n/);
    return lines.map(uncommented).join(' ').replace(/\s+/g, ' ').trim();
}

/** A node of the parse tree that is a command. */
function isCommand(node: lp.Node): node is lp.Command {
    return node.kind === 'command';
}

/** A node of the parse tree that is a braced argument. */
function isGroup(node: lp.Node): node is lp.Group {
    return node.kind === 'arg.group';
}

/** The braced arguments of a command, in order. */
function groupsOf(command: lp.Command): lp.Group[] {
    return command.args.filter(isGroup);
}

/** The section a command opens, or null for any other command or a title that is empty. */
function sectionOf(text: string, command: lp.Command): Section | null {
    const level = SECTION_COMMANDS.findIndex((name) => name === command.name.replace(/\*$/, ''));
    const groups = groupsOf(command);
    if (level < 0 || groups.length === 0) return null;
    const title = titleOf(text, groups[groups.length - 1]);
    return title === '' ? null : { level, title, line: command.location.start.line };
}

/** The file an include command names, or null for any other command. */
function includeOf(text: string, command: lp.Command): Include | null {
    const name = command.name.replace(/\*$/, '');
    const groups = groupsOf(command);
    const line = command.location.start.line;
    if (name === 'input' || name === 'include' || name === 'subfile') {
        return groups.length === 0
            ? null
            : { command: name, path: groupText(text, groups[0]).trim(), line };
    }
    if (name === 'import' && groups.length >= 2) {
        const path = groupText(text, groups[0]).trim() + groupText(text, groups[1]).trim();
        return { command: 'import', path, line };
    }
    return null;
}

/** A node with a list of child nodes under `key`, as the parser's guards read one. */
function childrenOf(node: lp.Node, key: 'content' | 'args'): lp.Node[] {
    const list = (node as unknown as Record<string, unknown>)[key];
    return Object.hasOwn(node, key) && Array.isArray(list) ? (list as lp.Node[]) : [];
}

/** Every node under the given ones, in document order, each handed to `visit`. */
function walk(nodes: readonly lp.Node[], visit: (node: lp.Node) => void): void {
    for (const node of nodes) {
        visit(node);
        walk(childrenOf(node, 'content'), visit);
        walk(childrenOf(node, 'args'), visit);
    }
}

/** The sections and includes of a text, and whether the parser refused it. */
export function readTexWith(parse: Parse, text: string): TexRead {
    let ast: lp.LatexAst;
    try {
        ast = parse(text);
    } catch {
        return { refused: true, sections: scanSections(text), includes: [] };
    }
    const read: TexRead = { refused: false, sections: [], includes: [] };
    walk(ast.content, (node) => {
        if (!isCommand(node)) return;
        const section = sectionOf(text, node);
        if (section !== null) read.sections.push(section);
        const include = includeOf(text, node);
        if (include !== null) read.includes.push(include);
    });
    return read;
}

/** What `import('latex-utensils')` gives: the package's named exports, or the CommonJS default. */
export type ParserModule = {
    latexParser?: { parse: Parse };
    default?: { latexParser: { parse: Parse } };
};

/** A reader of LaTeX text that waits for the parser to load. */
export type LazyReader = (text: string) => Promise<TexRead>;

/** The parser a loaded module holds. */
function parserOf(loaded: ParserModule): Parse {
    const parser = loaded.latexParser ?? loaded.default?.latexParser;
    if (parser === undefined) throw new Error('latex-utensils holds no latexParser');
    return (text, options) => parser.parse(text, options);
}

/** A reader whose parser is loaded by `load` on the first call and never loaded twice. */
export function lazyReader(load: () => Promise<ParserModule>): LazyReader {
    let loading: Promise<Parse> | null = null;
    return async (text) => {
        loading ??= load().then(parserOf);
        const parse = await loading.catch((error: unknown) => {
            loading = null;
            throw error;
        });
        return readTexWith(parse, text);
    };
}
