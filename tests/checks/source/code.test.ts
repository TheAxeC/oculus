// Layer 4, test. The code reader of the checks tells code from strings and comments by the parse of
// each language: TypeScript's for a module and a component's scripts, svelte/compiler's for a
// component's markup and style, parseCss for a stylesheet, and the `#` rule for a shell script.
//
// Several cases are places a scanner by delimiters reads wrong: a regular expression after
// `return`, a `//` inside a url() of a style block, a comment inside a markup expression.

import { describe, expect, it } from 'vitest';
import { commentLines, commentText, fileCode, withoutComments } from './code.ts';

describe('the code reader', () => {
    // Revert: in tests/checks/source/code.ts, take RegularExpressionLiteral out of STRINGS, and the
    // inside of the regular expression is kept as code.
    it('reads a regular expression after return as a string, not a division', () => {
        const text = "const ok = (s: string) => {\n    return /it's/.test(s); // c\n};\n";
        expect(commentLines('a.ts', text)).toEqual([]);
        expect(fileCode('a.ts', text).split('\n')[1]).toBe('    return /    /.test(s);     ');
    });

    // Audit: no revert of the parse turns this red; a reader that takes a slash after a name for
    // the opening of a regular expression does.
    it('reads a division as code and a trailing comment as a comment', () => {
        expect(fileCode('a.ts', 'const a = x / y / z; // d\n')).toBe(
            'const a = x / y / z;   ' + '  \n'
        );
    });

    // Revert: in componentKinds of tests/checks/source/code.ts, also mark each `//` of the style
    // block up to its line end as a comment, and the url() line holds comment text.
    it('reads a url() in a style block as no comment', () => {
        const text = '<p>x</p>\n<style>\n    .a { background: url(http://x/y); }\n</style>\n';
        expect(commentLines('a.svelte', text)).toEqual([]);
        expect(commentText('a.svelte', text).split('\n')[2].trim()).toBe('');
    });

    // Revert: in componentKinds of tests/checks/source/code.ts, leave out the parse's own list of
    // comments, and the comment of the markup expression is kept as code.
    it('blanks a comment inside a markup expression', () => {
        expect(fileCode('a.svelte', '<p>{x /* e */}</p>\n')).toBe('<p>{x        }</p>\n');
    });

    // Revert: in componentKinds of tests/checks/source/code.ts, leave out htmlComments, and the
    // HTML comment is read as markup.
    it('reads an HTML comment of the markup as a comment line', () => {
        expect(commentLines('a.svelte', '<!-- c -->\n<p>x</p>\n')).toEqual([1]);
    });

    // Revert: in fileKinds of tests/checks/source/code.ts, read a stylesheet through markScript,
    // and it does not parse as a module.
    it('reads a stylesheet comment by parseCss and a // in a string as none', () => {
        expect(commentLines('a.css', 'a { content: "//"; }\n/* b */\n')).toEqual([2]);
    });

    // Revert: in shellKinds of tests/checks/source/code.ts, open a comment at any `#`, and the
    // quoted `#` of the last line is read as one.
    it('reads a shell comment by its #, not a # after code or inside quotes', () => {
        expect(commentLines('a.sh', "x=1 # c\n# d\necho '#'\n")).toEqual([2]);
        expect(fileCode('a.sh', "echo '#'\n")).toBe("echo '#'\n");
    });

    // Revert: in withoutComments of tests/checks/source/code.ts, keep code alone, and the
    // specifier's inside is blanked.
    it('keeps every string and blanks every comment in withoutComments', () => {
        expect(withoutComments('a.ts', "import x from './y.ts'; // z\n")).toBe(
            "import x from './y.ts';     \n"
        );
    });

    // Revert: in commentText of tests/checks/source/code.ts, keep every character that is not
    // code, and the string's inside is kept beside the comment.
    it('gives each line its comment text alone, a trailing comment included', () => {
        expect(commentText('a.ts', "const u = 'http://x'; // Q\n")).toBe(
            '                      // Q\n'
        );
        expect(commentText('a.sh', 'x=1 # Q\n')).toBe('    # Q\n');
    });

    // Revert: in markScript of tests/checks/source/code.ts, drop the check of syntaxErrors, and the
    // file is read as it parsed.
    it('throws with the name of a file that does not parse', () => {
        expect(() => fileCode('a.ts', 'const = ;\n')).toThrow(/a\.ts does not parse/);
    });
});
