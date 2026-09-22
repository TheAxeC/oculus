// Layer 4, test support. Which characters of a source file are code, which are the inside of a
// string, a template or a regular expression, and which are a comment. The checks that read source
// text read it through this, so a word, a bracket or a call written in a string or a comment is not
// taken for code, and a comment is found wherever it is written.
//
// It is a scanner rather than a parser: it knows the delimiters and the escape, and it tells a
// slash that opens a regular expression from one that divides by the character before it. A Svelte
// file is read as its script and style blocks, whose comments are those of the language, and its
// markup, whose comments are HTML ones and whose text holds no string.

/** What one character of a file is. */
export type Kind = 'code' | 'string' | 'comment';

/** The characters after which a slash opens a regular expression rather than divides. */
const BEFORE_REGEX = new Set(['', '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';']);

/** The kind of each UTF-16 unit of a script, a stylesheet or a module. */
function kinds(text: string): Kind[] {
    const out: Kind[] = Array.from({ length: text.length }, () => 'code');
    const mark = (from: number, to: number, kind: Kind): void => {
        for (let one = from; one < Math.min(to, text.length); one += 1) out[one] = kind;
    };
    let at = 0;
    let last = '';
    while (at < text.length) {
        const ch = text[at];
        const pair = text.slice(at, at + 2);
        if (pair === '//') {
            const end = text.indexOf('\n', at);
            const stop = end === -1 ? text.length : end;
            mark(at, stop, 'comment');
            at = stop;
            continue;
        }
        if (pair === '/*') {
            const end = text.indexOf('*/', at + 2);
            const stop = end === -1 ? text.length : end + 2;
            mark(at, stop, 'comment');
            at = stop;
            continue;
        }
        const regex = ch === '/' && BEFORE_REGEX.has(last);
        if (ch === "'" || ch === '"' || ch === '`' || regex) {
            let end = at + 1;
            let inClass = false;
            while (end < text.length) {
                const one = text[end];
                if (one === '\\') {
                    end += 2;
                    continue;
                }
                if (regex && one === '[') inClass = true;
                else if (regex && one === ']') inClass = false;
                else if (one === ch && !inClass) break;
                else if (one === '\n' && ch !== '`') break;
                end += 1;
            }
            mark(at + 1, end, 'string');
            at = end + 1;
            last = 'x';
            continue;
        }
        if (!/\s/.test(ch)) last = /[\w$)\]]/.test(ch) ? 'x' : ch;
        at += 1;
    }
    return out;
}

/** The kind of each UTF-16 unit of a Svelte component: its blocks as code, its markup as HTML. */
function svelteKinds(text: string): Kind[] {
    const out: Kind[] = Array.from({ length: text.length }, () => 'code');
    const blocks = /<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/g;
    let from = 0;
    const markup = (to: number): void => {
        for (const found of text.slice(from, to).matchAll(/<!--[\s\S]*?-->/g)) {
            const start = from + found.index;
            for (let one = start; one < start + found[0].length; one += 1) out[one] = 'comment';
        }
    };
    for (const found of text.matchAll(blocks)) {
        const start = found.index + found[0].indexOf('>') + 1;
        markup(found.index);
        const inner = kinds(found[2]);
        for (let one = 0; one < inner.length; one += 1) out[start + one] = inner[one];
        from = found.index + found[0].length;
    }
    markup(text.length);
    return out;
}

/** The kind of each UTF-16 unit of a shell script: a `#` that opens a word opens a comment. */
function shellKinds(text: string): Kind[] {
    const out: Kind[] = Array.from({ length: text.length }, () => 'code');
    let at = 0;
    for (const line of text.split('\n')) {
        const found = /(^|\s)#/.exec(line);
        if (found !== null && !line.startsWith('#!')) {
            const start = at + found.index + found[1].length;
            for (let one = start; one < at + line.length; one += 1) out[one] = 'comment';
        }
        at += line.length + 1;
    }
    return out;
}

/** The kinds of a file of any of the languages the tree is written in, by its name. */
function fileKinds(name: string, text: string): Kind[] {
    if (name.endsWith('.svelte')) return svelteKinds(text);
    if (name.endsWith('.sh')) return shellKinds(text);
    return kinds(text);
}

/**
 * A file as code alone: the inside of every string, template and regular expression and the whole
 * of every comment turned to spaces, line breaks kept, so every line and column stays where it was.
 * The name is what says which language's comments and strings those are.
 */
export function fileCode(name: string, text: string): string {
    const kind = fileKinds(name, text);
    let out = '';
    for (let one = 0; one < text.length; one += 1) {
        out += kind[one] === 'code' || text[one] === '\n' ? text[one] : ' ';
    }
    return out;
}

/** The same for a module, a script or a stylesheet, whose comments and strings are one language. */
export function code(text: string): string {
    return fileCode('one.ts', text);
}

/**
 * The lines of a file that are comment lines, as 1-based numbers: the lines whose first character
 * that is not a space belongs to a comment.
 */
export function commentLines(name: string, text: string): number[] {
    const kind = fileKinds(name, text);
    const found: number[] = [];
    let at = 0;
    text.split('\n').forEach((line, index) => {
        const first = line.search(/\S/);
        if (first !== -1 && kind[at + first] === 'comment') found.push(index + 1);
        at += line.length + 1;
    });
    return found;
}
