// Layer 3, primitive, pure. What the editor reads of a LaTeX text to preview a reference and a
// package: the label a `\ref`-like command names at a position, the package a `\usepackage` names,
// the block of the text a label sits in (its environment, or its own line), and the sub- and
// superscript bodies the text already uses. The widget that draws a preview is
// kit/latex/latex-widget.ts's; the page supplies the label's number and file.
//
// A name list (`\cref{a,b}`) is read by element, so the position picks one name. A `%` comment is
// not read: a position inside one names nothing.

/** A name a command's argument holds, with the offsets of that name in the text. */
export type NamedAt = { name: string; start: number; end: number };

/** The reference commands whose argument is a label name, `\ref` and its relatives. */
const REFERENCES =
    'ref|eqref|pageref|autoref|nameref|vref|cref|Cref|crefrange|Crefrange|labelcref|hyperref';

/** The package commands whose argument is a package name. */
const PACKAGES = 'usepackage|RequirePackage';

/** Whether the offset lies in a `%` comment of its line. */
function inComment(text: string, offset: number): boolean {
    const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
    const line = text.slice(lineStart, offset);
    return /(^|[^\\])%/.test(line);
}

/** The name of a comma list an argument holds that the offset is in, or null. */
function elementAt(text: string, offset: number, open: number, body: string): NamedAt | null {
    let from = open + 1;
    for (const part of body.split(',')) {
        const start = from + (part.length - part.trimStart().length);
        const end = from + part.trimEnd().length;
        if (offset >= start && offset <= end && end > start) {
            return { name: text.slice(start, end), start, end };
        }
        from += part.length + 1;
    }
    return null;
}

/** The name of the call of `commands` whose argument holds the offset, or null. */
function callAt(text: string, offset: number, commands: string): NamedAt | null {
    if (inComment(text, offset)) return null;
    const call = new RegExp(`\\\\(?:${commands})\\*?(?:\\s*\\[[^\\]]*\\])?\\s*\\{([^{}]*)\\}`, 'g');
    for (const match of text.matchAll(call)) {
        const open = match.index + match[0].lastIndexOf('{' + match[1] + '}');
        if (offset < open || offset > open + match[1].length + 1) continue;
        return elementAt(text, offset, open, match[1]);
    }
    return null;
}

/** The label a `\ref`-like command names at the offset, or null. */
export function refAt(text: string, offset: number): NamedAt | null {
    return callAt(text, offset, REFERENCES);
}

/** The package a `\usepackage` names at the offset, or null. */
export function packageAt(text: string, offset: number): NamedAt | null {
    return callAt(text, offset, PACKAGES);
}

/** The environments a block of text may be set as a formula by. */
const MATH_ENVIRONMENTS = [
    'equation',
    'align',
    'alignat',
    'gather',
    'multline',
    'flalign',
    'eqnarray',
    'displaymath'
];

/** The most lines a label's block shows. */
const BLOCK_LINES = 12;

/**
 * The block of the text a label on the 1-based `line` sits in: the innermost environment that
 * opens before the line and closes after it, else the line alone. `math` is set when that
 * environment is one a formula is set in, and the block is then the formula's own source.
 */
export function blockOf(text: string, line: number): { text: string; math: boolean } {
    const lines = text.split('\n');
    const at = Math.min(Math.max(line, 1), lines.length) - 1;
    const stack: { name: string; line: number }[] = [];
    let found: { name: string; from: number; to: number } | null = null;
    for (let index = 0; index < lines.length; index += 1) {
        const code = lines[index].replace(/(^|[^\\])%.*$/, '$1');
        for (const mark of code.matchAll(/\\(begin|end)\{([^{}]+)\}/g)) {
            if (mark[1] === 'begin') {
                stack.push({ name: mark[2], line: index });
                continue;
            }
            const opened = stack.pop();
            if (opened?.name !== mark[2]) continue;
            if (opened.line <= at && index >= at) {
                if (found === null || opened.line > found.from) {
                    found = { name: opened.name, from: opened.line, to: index };
                }
            }
        }
    }
    if (found === null) return { text: lines[at].trim(), math: false };
    const kept = lines.slice(found.from, Math.min(found.to + 1, found.from + BLOCK_LINES));
    const bare = found.name.replace(/\*$/, '');
    return { text: kept.join('\n'), math: MATH_ENVIRONMENTS.includes(bare) };
}

/** The bodies of the sub- and superscripts a text uses, each once, in the order first used. */
export function scriptsOf(text: string): string[] {
    const seen = new Set<string>();
    for (const match of text.matchAll(/[_^]\{([^{}\n]{1,40})\}/g)) seen.add(match[1]);
    return [...seen];
}
