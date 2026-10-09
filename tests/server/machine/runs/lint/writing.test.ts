// Layer 4, server test. G71: a writing-rule mark and its fix fall only in a Markdown or YAML file's
// text outside front matter, code, code spans and URLs, or in a code file's comment or Python
// docstring, so Fix All never changes code. Each case plants a file in a scratch root, asks
// POST /api/lint for the `writing` linter, and reads the rows (line, column, code) and the text
// the rows' fixes make, which is what Fix All in a tab writes.
//
// Banned characters are escapes in this file: the em dash, the en dash, the ellipsis and the
// arrow.
//
// What this does NOT cover: the squiggles and the lightbulb in the editor (seen at the look), the
// reader over the hub's own files (a run the step's report quotes), and the folder plan, which
// writing-fix.test.ts covers.

import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { it } from '../../../../fixtures/scratch.ts';
import { plant, route, scratch, settingsOf } from './lint-fixture.ts';

const EM = '\u2014';
const EN = '\u2013';
const ELL = '\u2026';
const ARROW = '\u2192';

type Row = {
    line: number;
    column: number;
    code: string;
    fixes: { kind: string; title: string; edits: Edit[] }[];
};
type Edit = { line: number; column: number; endLine: number; endColumn: number; text: string };

/** The lint routes made by a case, closed when it is over so no thread outlives it. */
const made: { comments: { close: () => void } }[] = [];
afterEach(() => {
    for (const one of made.splice(0)) one.comments.close();
});

/** A scratch root holding `files`, and the rows the writing linter gives for one of them. */
function world(
    files: Record<string, string>,
    writing: { skip?: string[]; glyphs?: string[] } = {}
) {
    const root = scratch('oculus-writing-');
    for (const [name, body] of Object.entries(files)) plant(join(root, name), body);
    const lint = route(
        () => [{ key: 'repo', dir: root }],
        () => ({
            ...settingsOf(),
            writingSkip: writing.skip ?? [],
            writingGlyphs: writing.glyphs ?? []
        })
    );
    made.push(lint);
    return async (path: string): Promise<{ status: number; rows: Row[]; state?: string }> => {
        const answered = await lint.post({ action: 'lint', root: 'repo', path, linter: 'writing' });
        const body = answered.body as { ok: boolean; rows?: Row[]; state?: string };
        expect({ status: answered.status, ok: body.ok }).toEqual({ status: 200, ok: true });
        return { status: answered.status, rows: body.rows ?? [], state: body.state };
    };
}

/** The offset of a 1-based line and column in `text`. */
function offsetOf(text: string, line: number, column: number): number {
    let at = 0;
    for (let n = 1; n < line; n += 1) at = text.indexOf('\n', at) + 1;
    return at + column - 1;
}

/** `text` with the first `fix` of every row applied, as Fix All applies them. */
function fixedText(text: string, rows: Row[]): string {
    const edits = rows.flatMap((row) => row.fixes.find((fix) => fix.kind === 'fix')?.edits ?? []);
    let out = text;
    const ordered = [...edits].sort(
        (a, b) => offsetOf(text, b.line, b.column) - offsetOf(text, a.line, a.column)
    );
    for (const edit of ordered) {
        const from = offsetOf(text, edit.line, edit.column);
        const to = offsetOf(text, edit.endLine, edit.endColumn);
        out = out.slice(0, from) + edit.text + out.slice(to);
    }
    return out;
}

/** The line and column (1-based) of the `nth` occurrence of `needle` in `text`. */
function place(text: string, needle: string, nth = 1): { line: number; column: number } {
    let at = -1;
    for (let n = 0; n < nth; n += 1) at = text.indexOf(needle, at + 1);
    const before = text.slice(0, at).split('\n');
    return { line: before.length, column: before[before.length - 1].length + 1 };
}

/** The rows as line, column and code, which is how a case names what is marked. */
const marked = (rows: Row[]) => rows.map((row) => [row.line, row.column, row.code]);

/** The mark a case expects at the `nth` occurrence of `needle`. */
function at(text: string, needle: string, code: string, nth = 1) {
    const found = place(text, needle, nth);
    return [found.line, found.column, code];
}

describe('G71: a mark falls only in text, and in a code file only in a comment or docstring', () => {
    it(
        'marks the comments of a TypeScript file and none of its strings, templates or expressions (case 21)',
        { tags: ['slow'] },
        async () => {
            const text = [
                `const s = "a${EM}b"; // c${EM}d`,
                `const t = \`x \${s} ${EM}\`;`,
                `const r = /${EM}/;`,
                `/* e${ELL} */`,
                ''
            ].join('\n');
            const rows = await world({ 'a.ts': text })('a.ts');
            expect(marked(rows.rows)).toEqual([
                at(text, EM, 'em-dash', 2),
                at(text, ELL, 'ellipsis')
            ]);
            expect(fixedText(text, rows.rows)).toBe(text.replace(ELL, '...'));
        }
    );

    it('marks a Python comment and a docstring, and not a string or a string assigned to a name (case 22)', async () => {
        const text = [
            `x = "# not ${EM} a comment"  # a comment ${EM} here`,
            `def f():`,
            `    """Doc ${ARROW} string."""`,
            `s = '''not a doc ${ELL}'''`,
            ''
        ].join('\n');
        const rows = await world({ 'a.py': text })('a.py');
        expect(marked(rows.rows)).toEqual([at(text, EM, 'em-dash', 2), at(text, ARROW, 'arrow')]);
        expect(fixedText(text, rows.rows)).toBe(text.replace(ARROW, '->'));
    });

    it('marks the arrow of a raw docstring (case 22b)', async () => {
        const text = `r"""Doc ${ARROW} string."""\n`;
        const rows = await world({ 'a.py': text })('a.py');
        expect(marked(rows.rows)).toEqual([at(text, ARROW, 'arrow')]);
    });

    it('marks the comment of a shell file and not the string or the parameter expansion (case 23)', async () => {
        const text = `echo "# not ${EM}" # yes ${EM}\nx=\${y#pre} # strip\n`;
        const rows = await world({ 'a.sh': text })('a.sh');
        expect(marked(rows.rows)).toEqual([at(text, EM, 'em-dash', 2)]);
    });

    it('marks the four comment forms of a Svelte file and not its text node (case 24)', async () => {
        const text = [
            '<script>',
            `    // a ${EM} b`,
            '</script>',
            `<!-- c ${EM} d -->`,
            `{a /* e ${EM} f */}`,
            `<p>text ${EM} node</p>`,
            '<style>',
            `    /* g ${EM} h */`,
            '</style>',
            ''
        ].join('\n');
        const rows = await world({ 'a.svelte': text })('a.svelte');
        expect(marked(rows.rows)).toEqual([
            at(text, EM, 'em-dash', 1),
            at(text, EM, 'em-dash', 2),
            at(text, EM, 'em-dash', 3),
            at(text, EM, 'em-dash', 5)
        ]);
    });

    it('marks the comments of a TSX and a JSX file and not the text of an element (case 43)', async () => {
        const text = [
            `const a = <p>a ${EM} b</p>;`,
            `const b = <p>{/* c ${EM} d */}</p>;`,
            `// e ${EM} f`,
            ''
        ].join('\n');
        const answer = world({ 'a.tsx': text, 'a.jsx': text });
        for (const name of ['a.tsx', 'a.jsx']) {
            const rows = await answer(name);
            expect({ name, rows: marked(rows.rows) }).toEqual({
                name,
                rows: [at(text, EM, 'em-dash', 2), at(text, EM, 'em-dash', 3)]
            });
        }
    });

    it('marks the text of a link and not its address, an autolink or a bare address (case 26)', async () => {
        const text = [
            `[a${EN}b](https://en.wikipedia.org/wiki/Kaplan${EN}Meier_estimator)`,
            '',
            `<https://x.org/a${EN}b>`,
            '',
            `https://x.org/c${EN}d`,
            ''
        ].join('\n');
        const rows = await world({ 'a.md': text })('a.md');
        expect(marked(rows.rows)).toEqual([at(text, EN, 'en-dash', 1)]);
        expect(fixedText(text, rows.rows)).toBe(text.replace(`a${EN}b]`, 'a-b]'));
    });

    it('marks a YAML comment and a quoted value and not an address (case 27)', async () => {
        const text = `url: https://x.org/a${EN}b # see ${ELL}\nname: "A ${EM} B"\n`;
        const rows = await world({ 'a.yml': text })('a.yml');
        expect(marked(rows.rows)).toEqual([at(text, ELL, 'ellipsis'), at(text, EM, 'em-dash')]);
        expect(fixedText(text, rows.rows)).toBe(text.replace(ELL, '...'));
    });

    it('marks nothing in a tilde fence or an indented code block (case 33)', async () => {
        const text = `~~~\na ${EM} b ${ELL}\n~~~\n\n    c ${EM} d ${ELL}\n`;
        const rows = await world({ 'a.md': text })('a.md');
        expect(rows.rows).toEqual([]);
    });

    it('offers the join of a paragraph that would merge two lists as a suggestion, never a fix (case 46)', async () => {
        const text = '> - a\nb\n> - c\n';
        const rows = await world({ 'a.md': text })('a.md');
        expect(rows.rows.map((row) => row.code)).toEqual(['wrapped-paragraph']);
        expect(rows.rows[0].fixes.map((fix) => fix.kind)).toEqual(['suggestion']);
        expect(fixedText(text, rows.rows)).toBe(text);
    });

    it('marks the text of an HTML element and not an address, a reference definition or its title (case 47)', async () => {
        const text = [
            `[r]: https://x.org/a${EN}b "T${EM}t"`,
            '',
            `<a href="https://x.org/a${EN}b">x${EM}y</a>`,
            ''
        ].join('\n');
        const rows = await world({ 'a.md': text })('a.md');
        expect(marked(rows.rows)).toEqual([at(text, EM, 'em-dash', 2)]);
    });
});
