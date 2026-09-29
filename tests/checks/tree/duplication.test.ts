// Layer 4, test. A rule, a parser or a fold written a second time instead of reused.
//
// jscpd reads every TypeScript, JavaScript and Svelte file under src/lib, and separately every one
// under tests, and reports each run of tokens two places share: fifty tokens at least, over eight
// lines at least in one of the two files, comments and whitespace aside, and import statements
// skipped, so a shared import list is not counted. A clone in a component's style block is
// dropped, since a repeated CSS rule is not a rule written twice, and so is a clone whose two ends
// sit in one file: what this check finds is a copy one file should be importing from the other.
//
// jscpd reads a component's markup with its script and style bodies as a few opaque tokens, so a
// markup clone could run through two script or style blocks whose text differs. The check therefore
// runs jscpd twice per group: once for code, keeping clones that are neither CSS nor markup, and
// once with every script and style block skipped, keeping its markup clones alone. A component's
// script and style blocks are never part of a markup clone; its script's code is compared in the
// first run. The second run reads a component as HTML alone, since jscpd's Svelte format skips a
// whole component whose script and style blocks together hold fewer than fifty tokens, markup and
// all.
//
// A clone's length is the number of lines both ends hold: the smaller of its two extents, since one
// file can lay the same tokens on fewer lines than the other, or end its extent on a line the other
// does not reach. It can therefore be under eight.
//
// jscpd 5 is a native program with no Node API, so the check runs the package's own launcher and
// reads each JSON report from a scratch directory that is removed after the read.
//
// The two groups are kept apart because a helper a test shares with the code it covers is not a
// copy: the test reaches the module. DELIBERATE names the pairs that share on purpose, each with
// its reason; HELD is what the tree already shared when the check landed, so that a pair added from
// now on fails.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, rmSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { afterAll, describe, expect, it } from 'vitest';
import { isReason } from '../../fixtures/reason.ts';
import { plantScratch, scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..');

/** The package's own launcher, which runs the jscpd binary built for this machine. */
const JSCPD = join(ROOT, 'node_modules', 'jscpd', 'run-jscpd.js');

/** The least run of lines, and of tokens, that is a copy rather than a coincidence of shape. */
const MIN_LINES = 8;
const MIN_TOKENS = 50;

/** Every static import statement, on one line or several, wherever in the file it sits. */
const IMPORTS = String.raw`(?m)^\s*import\b[^;]*;`;

/** The files the run for code reads, each in its own format. */
const CODE_FORMATS = ['--format', 'typescript,javascript,svelte'];

/** The files the run for markup reads: every component as HTML, whatever its blocks hold. */
const MARKUP_FORMATS = ['--format', 'html', '--formats-exts', 'html:svelte'];

/** A component's style and script blocks, skipped in the run that keeps markup clones. */
const BLOCKS = [String.raw`(?s)<style[^>]*>.*?</style>`, String.raw`(?s)<script[^>]*>.*?</script>`];

/**
 * A clone two files share: the pair, the mark of the lines themselves, and the reason it is listed.
 *
 * The mark is what makes an entry stand for one clone rather than for the pair: two files already
 * on the list cannot grow a second copy under the first one's entry.
 */
export type Pair = { a: string; b: string; mark: string; why: string };

/** The tokens of a fragment as the TypeScript scanner reads them, past comments and spaces. */
function tokensOf(fragment: string): string[] {
    const scanner = ts.createScanner(
        ts.ScriptTarget.Latest,
        true,
        ts.LanguageVariant.Standard,
        fragment
    );
    const found: string[] = [];
    for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
        found.push(scanner.getTokenText());
    }
    return found;
}

/**
 * The mark of a clone: its tokens joined by one space and hashed, so that a comment or a reflow
 * inside the clone, in whichever file jscpd takes its fragment from, does not move it.
 */
export function markOf(fragment: string): string {
    return createHash('sha256').update(tokensOf(fragment).join(' ')).digest('hex').slice(0, 12);
}

/**
 * The pairs that share on purpose, each with the reason the copy belongs where it is.
 *
 * A pair moves here from the floor when the two are meant to hold the same lines; an entry is a
 * decision, and the case over the reasons refuses one written without it.
 */
export const DELIBERATE: Pair[] = [];

/** The floor: the pairs the tree already shared, read from the list beside this file. */
export function readHeld(text: string): Pair[] {
    const found: Pair[] = [];
    for (const line of text.split('\n')) {
        if (line.startsWith('#') || line.trim() === '') continue;
        const part = line.trim().split(/\s+/);
        found.push({
            a: part[0],
            b: part[1] ?? '',
            mark: part[2] ?? '',
            why: part.slice(3).join(' ')
        });
    }
    return found;
}

export const HELD = readHeld(
    readFileSync(join(ROOT, 'tests', 'checks', 'tree', 'allow-duplication.txt'), 'utf8')
);

/** One end of a clone as jscpd's JSON report gives it. */
type End = { name: string; start: number; end: number };

/** One clone of jscpd's JSON report, the fields this check reads. */
type Reported = {
    format: string;
    fragment: string;
    firstFile: End;
    secondFile: End;
};

/** A clone the check reports: both ends as paths under the root, its length and its mark. */
type Copy = {
    left: string;
    leftAt: number;
    right: string;
    rightAt: number;
    lines: number;
    mark: string;
};

/**
 * jscpd's clones in one group, skipping the tokens the patterns match, read from its JSON report in
 * a scratch directory removed after.
 */
function detect(root: string, group: string, formats: string[], skip: string[]): Reported[] {
    const out = scratchDir('oculus-jscpd-');
    try {
        execFileSync(
            process.execPath,
            [
                JSCPD,
                '--min-lines',
                String(MIN_LINES),
                '--min-tokens',
                String(MIN_TOKENS),
                ...formats,
                '--ignore-pattern',
                skip.join(','),
                '--reporters',
                'json',
                '--output',
                out,
                '--absolute',
                join(root, group)
            ],
            { stdio: 'pipe' }
        );
        const report = JSON.parse(readFileSync(join(out, 'jscpd-report.json'), 'utf8')) as {
            duplicates: Reported[];
        };
        return report.duplicates;
    } finally {
        rmSync(out, { recursive: true, force: true });
    }
}

/** Whether this clone of this pair is on the allow list, in either order. */
function deliberate(allow: Pair[], a: string, b: string, mark: string): boolean {
    return allow.some(
        (one) => one.mark === mark && ((one.a === a && one.b === b) || (one.a === b && one.b === a))
    );
}

/**
 * The file one end of a clone sits in, as a path under the root. jscpd names a block of a component
 * by its file and the block's format (`Row.svelte:html`), and gives the line in the file itself.
 */
function fileOf(base: string, name: string): string {
    return relative(base, name.replace(/\.svelte:[a-z]+$/, '.svelte'))
        .split(sep)
        .join('/');
}

/** The lines both ends of a clone hold: the smaller of its two extents. */
function heldLines(one: Reported): number {
    return Math.min(
        one.firstFile.end - one.firstFile.start + 1,
        one.secondFile.end - one.secondFile.start + 1
    );
}

/**
 * Every clone two files of one group share that the allow list does not name: the code clones of a
 * run over the whole files, and the markup clones of a run with every script and style block
 * skipped.
 *
 * jscpd reports a clone once, at the line it starts on in each file, however long it runs.
 */
export function copies(
    root: string,
    group: string,
    allow: Pair[] = [...DELIBERATE, ...HELD]
): Copy[] {
    const base = realpathSync(root);
    const found: Copy[] = [];
    const code = detect(base, group, CODE_FORMATS, [IMPORTS]).filter(
        (one) => one.format !== 'css' && one.format !== 'html'
    );
    const markup = detect(base, group, MARKUP_FORMATS, [IMPORTS, ...BLOCKS]).filter(
        (one) => one.format === 'html'
    );
    for (const one of [...code, ...markup]) {
        const left = fileOf(base, one.firstFile.name);
        const right = fileOf(base, one.secondFile.name);
        if (left === right) continue;
        const mark = markOf(one.fragment);
        if (deliberate(allow, left, right, mark)) continue;
        found.push({
            left,
            leftAt: one.firstFile.start,
            right,
            rightAt: one.secondFile.start,
            lines: heldLines(one),
            mark
        });
    }
    return found;
}

/** The copies a group holds, one line each, in a fixed order. */
export function findCopies(root: string, group: string, allow?: Pair[]): string[] {
    return copies(root, group, allow)
        .map(
            (one) =>
                `${one.left}:${one.leftAt} and ${one.right}:${one.rightAt} hold the same ${one.lines} lines (${one.mark})`
        )
        .sort();
}

/** The clones a group shares, as pair and mark, whatever the allow list says. */
export function sharedPairs(root: string, group: string): Set<string> {
    const found = new Set<string>();
    for (const one of copies(root, group, [])) found.add(`${one.left}|${one.right}|${one.mark}`);
    return found;
}

/** A scratch tree with the files a case plants. */
function scratch(files: Record<string, string>): string {
    return plantScratch('oculus-duplication-', files);
}

/** A function of twelve lines and well over fifty tokens. */
function twelve(): string {
    return [
        'export function fold(rows: string[], limit: number): string {',
        '    let held = 0;',
        '    for (const row of rows) {',
        '        if (row.length > limit) continue;',
        '        held += row.length;',
        '    }',
        '    const out = String(held);',
        '    const trimmed = out.trim();',
        "    const padded = trimmed.padStart(8, '0');",
        '    const tail = padded.slice(-limit);',
        '    return tail.toUpperCase();',
        '}'
    ].join('\n');
}

/** The line case 1 reports for a pair holding twelve() at the top of both files. */
function reported(lines = 12): string {
    return `group/one.ts:1 and group/two.ts:1 hold the same ${lines} lines (${markOf(twelve())})`;
}

/** The allow list entry for the clone case 1 plants. */
function listed(): Pair[] {
    return [
        {
            a: 'group/one.ts',
            b: 'group/two.ts',
            mark: markOf(twelve()),
            why: 'the case over the list'
        }
    ];
}

describe('a rule written twice', () => {
    it('is not held anywhere under src/lib', () => {
        expect(findCopies(ROOT, 'src/lib')).toEqual([]);
    });

    it('is not held anywhere under tests', () => {
        expect(findCopies(ROOT, 'tests')).toEqual([]);
    });

    it('reports a shared twelve-line function once, naming both files, the start and the mark', () => {
        const dir = scratch({ 'group/one.ts': twelve(), 'group/two.ts': twelve() });
        expect(findCopies(dir, 'group', [])).toEqual([reported()]);
    });

    it('passes a copy of seven lines, and one of twelve lines under fifty tokens', () => {
        const seven = [
            'export function fold(rows: string[], limit: number): string {',
            '    let held = 0; for (const row of rows) held += row.length > limit ? 0 : row.length;',
            "    const out = String(held).trim().padStart(8, '0');",
            '    const tail = out.slice(-limit).toUpperCase();',
            '    const again = tail.repeat(2).slice(0, limit).toLowerCase();',
            '    return again.length > 0 ? again : tail;',
            '}'
        ].join('\n');
        // Lines of their own on either side, so the copy is held in the middle of each file.
        const short = scratch({
            'group/one.ts': `let aa = 1;\n${seven}\nfunction bb() {}\n`,
            'group/two.ts': `class Cc {}\n${seven}\nlet dd = [1];\n`
        });
        expect(findCopies(short, 'group', [])).toEqual([]);
        const thin = Array.from({ length: 12 }, () => 'f();').join('\n');
        expect(tokensOf(thin)).toHaveLength(48);
        const light = scratch({ 'group/one.ts': thin, 'group/two.ts': thin });
        expect(findCopies(light, 'group', [])).toEqual([]);
    });

    it('passes two files sharing only an import list, on one line each or across several', () => {
        const head = [
            "import { join } from 'node:path';",
            "import { tmpdir } from 'node:os';",
            "import { readFileSync } from 'node:fs';",
            "import { readdirSync } from 'node:fs';",
            "import { writeFileSync } from 'node:fs';",
            "import { mkdirSync } from 'node:fs';",
            "import { rmSync } from 'node:fs';",
            "import { resolve } from 'node:path';"
        ].join('\n');
        const dir = scratch({
            'group/one.ts': `${head}\nexport const one = join(tmpdir(), 'one');\n`,
            'group/two.ts': `${head}\nexport const two = resolve(tmpdir(), 'two');\n`
        });
        expect(findCopies(dir, 'group', [])).toEqual([]);
        const names = ['join', 'resolve', 'relative', 'dirname', 'basename', 'extname', 'sep'];
        const several = `// the paths\nimport {\n${names
            .map((one) => `    ${one},`)
            .join(
                '\n'
            )}\n    normalize,\n    isAbsolute,\n    parse,\n    format,\n    delimiter,\n    posix,\n    win32,\n    toNamespacedPath,\n    matchesGlob\n} from 'node:path';\n`;
        const wrapped = scratch({
            'group/one.ts': `${several}export const one = join('a', 'b');\n`,
            'group/two.ts': `${several}export const two = resolve('c');\n`
        });
        expect(findCopies(wrapped, 'group', [])).toEqual([]);
    });

    it('names a copy in the script of two components by the files and their own lines', () => {
        const script = (tail: string) =>
            `<script lang="ts">\n${twelve()}\n    ${tail}\n</script>\n\n<p>{held}</p>\n`;
        const dir = scratch({
            'group/one.svelte': script('const held = 1;'),
            'group/two.svelte': `<!-- two -->\n${script('export const held = 2;')}`
        });
        expect(findCopies(dir, 'group', [])).toEqual([
            `group/one.svelte:2 and group/two.svelte:3 hold the same 12 lines (${markOf(twelve())})`
        ]);
    });

    it('passes two components sharing only a style block', () => {
        const rule = (name: string) => [
            `    .${name} {`,
            '        display: flex;',
            '        gap: 1px;',
            '        margin: 0;',
            '        padding: 0;',
            '        border: 0;',
            '        color: inherit;',
            '    }'
        ];
        const style = ['<style>', ...rule('row'), ...rule('cell'), '</style>'].join('\n');
        const dir = scratch({
            'group/one.svelte': `<script lang="ts">\n    let one = 1;\n</script>\n\n<p>{one}</p>\n\n${style}\n`,
            'group/two.svelte': `<script lang="ts">\n    let two = 2;\n</script>\n\n<b>{two}</b>\n\n${style}\n`
        });
        expect(findCopies(dir, 'group', [])).toEqual([]);
    });

    it('sees through a comment and extra spaces in the second file, with the mark unchanged', () => {
        const commented = twelve()
            .replace('let held = 0;', 'let  held  =  0; // the running sum')
            .replace('const out = String(held);', 'const   out = String( held );');
        const dir = scratch({ 'group/one.ts': twelve(), 'group/two.ts': commented });
        expect(findCopies(dir, 'group', [])).toEqual([reported()]);
    });

    it('keeps the mark when a comment line is added inside the clone in the first file', () => {
        const commented = twelve().replace(
            '    let held = 0;',
            '    // the running sum\n    let held = 0;'
        );
        const dir = scratch({ 'group/one.ts': commented, 'group/two.ts': twelve() });
        const found = copies(dir, 'group', []);
        expect(found.map((one) => one.mark)).toEqual([markOf(twelve())]);
        expect(findCopies(dir, 'group', listed())).toEqual([]);
    });

    it('silences the listed clone of a pair and not a second one between the same files', () => {
        const once = scratch({ 'group/one.ts': twelve(), 'group/two.ts': twelve() });
        expect(findCopies(once, 'group', listed())).toEqual([]);
        const other = twelve()
            .replace(/fold/g, 'gather')
            .replace(/held/g, 'total')
            .replace(/limit/g, 'cap')
            .replace('toUpperCase', 'toLowerCase');
        const twice = scratch({
            'group/one.ts': `${twelve()}\n\nlet gapOne = [1, 2, 3].map((n) => n * 2);\n\n${other}\n`,
            'group/two.ts': `${twelve()}\n\nfunction gapTwo(): void {}\n\n${other}\n`
        });
        const second = findCopies(twice, 'group', listed());
        expect(second).toHaveLength(1);
        expect(second[0]).toContain(`(${markOf(other)})`);
    });

    it('keeps the groups apart: a file under src/lib and one under tests are not a pair', () => {
        const dir = scratch({ 'src/lib/one.ts': twelve(), 'tests/one.ts': twelve() });
        expect(findCopies(dir, 'src/lib', [])).toEqual([]);
        expect(findCopies(dir, 'tests', [])).toEqual([]);
    });

    it('reports shared markup alone, from its first line, when the scripts and styles differ', () => {
        const markup = [
            '<nav class="rail" aria-label="pages">',
            '    <ul class="list">',
            '        <li class="item"><a href="/one" title="One">One</a></li>',
            '        <li class="item"><a href="/two" title="Two">Two</a></li>',
            '        <li class="item"><a href="/three" title="Three">Three</a></li>',
            '        <li class="item"><a href="/four" title="Four">Four</a></li>',
            '        <li class="item"><a href="/five" title="Five">Five</a></li>',
            '    </ul>',
            '    <footer class="foot"><span class="note">pages</span></footer>',
            '    <p class="hint">Press a page to open it.</p>',
            '</nav>'
        ].join('\n');
        const one = [
            '<script lang="ts">',
            ...twelve().split('\n'),
            '</script>',
            '',
            markup,
            '',
            '<style>',
            '    .rail {',
            '        display: flex;',
            '    }',
            '</style>'
        ].join('\n');
        const two = [
            '<script lang="ts">',
            '    export class Pages {',
            '        private readonly names = new Map<string, number[]>();',
            '        public add(name: string, at: number): void {',
            '            const held = this.names.get(name) ?? [];',
            '            held.push(at * 2 + 1);',
            '            this.names.set(name, held);',
            '        }',
            '    }',
            '</script>',
            '',
            markup,
            '',
            '<style>',
            '    .rail {',
            '        display: grid;',
            '        gap: 2px;',
            '    }',
            '</style>'
        ].join('\n');
        const dir = scratch({ 'group/one.svelte': one, 'group/two.svelte': two });
        expect(findCopies(dir, 'group', [])).toEqual([
            `group/one.svelte:16 and group/two.svelte:12 hold the same 11 lines (${markOf(markup)})`
        ]);
    });

    // Red when the markup run reads components in jscpd's Svelte format, which skips a component
    // whose script and style blocks together hold fewer than fifty tokens.
    it('reports shared markup between two components whose scripts are short and which have no style', () => {
        const markup = [
            '<nav class="rail" aria-label="pages">',
            '    <ul class="list">',
            '        <li class="item"><a href="/one" title="One">One</a></li>',
            '        <li class="item"><a href="/two" title="Two">Two</a></li>',
            '        <li class="item"><a href="/three" title="Three">Three</a></li>',
            '        <li class="item"><a href="/four" title="Four">Four</a></li>',
            '        <li class="item"><a href="/five" title="Five">Five</a></li>',
            '    </ul>',
            '    <footer class="foot"><span class="note">pages</span></footer>',
            '    <p class="hint">Press a page to open it.</p>',
            '</nav>'
        ].join('\n');
        const dir = scratch({
            'group/one.svelte': [
                '<script lang="ts">',
                '    let open = 1;',
                '</script>',
                '',
                markup
            ].join('\n'),
            'group/two.svelte': [
                '<script lang="ts">',
                '    let shut = 2;',
                '</script>',
                '',
                markup
            ].join('\n')
        });
        expect(findCopies(dir, 'group', [])).toEqual([
            `group/one.svelte:5 and group/two.svelte:5 hold the same 11 lines (${markOf(markup)})`
        ]);
    });

    it('passes two components whose scripts differ in one value and whose markup differs', () => {
        const component = (order: number, body: string) =>
            [
                '<script module lang="ts">',
                "    import type { ViewRegistration } from '$lib/registry';",
                '    export const registration: ViewRegistration = {',
                "        id: 'views',",
                "        label: 'views.label',",
                "        glyph: 'views.glyph',",
                "        group: 'views',",
                `        order: ${order},`,
                '        wide: false,',
                '        tinted: true,',
                "        keys: ['open', 'close']",
                '    };',
                '</script>',
                '',
                '<script lang="ts">',
                "    import Pane from '$lib/ui/frame/Pane.svelte';",
                "    import type { ViewProps } from '$lib/registry';",
                '',
                '    let { instance }: ViewProps = $props();',
                '    const label = instance.id.toUpperCase();',
                '</script>',
                '',
                '<!-- The box every view has; this one draws its rows straight into it, so it asks for the tint. -->',
                '<Pane title={label} tinted>',
                '    <div class="view" data-instance={instance.id}>',
                `        ${body}`,
                '    </div>',
                '</Pane>'
            ].join('\n');
        const dir = scratch({
            'group/one.svelte': component(0, '<p class="one">{label}</p>'),
            'group/two.svelte': component(1, '<b>{instance.id}</b>')
        });
        expect(findCopies(dir, 'group', [])).toEqual([]);
    });

    it('names the lines both ends hold when one extent runs a line further', () => {
        const dir = scratch({
            'group/one.ts': `${twelve()}\n\nexport const one = 1;\n`,
            'group/two.ts': `${twelve()}\nexport function two(): void {}\n`
        });
        const found = copies(dir, 'group', []);
        expect(found).toHaveLength(1);
        expect(found[0].lines).toBe(13);
        expect(findCopies(dir, 'group', [])).toEqual([
            `group/one.ts:1 and group/two.ts:1 hold the same 13 lines (${found[0].mark})`
        ]);
    });

    it('passes one file holding the same function twice', () => {
        const other = twelve().replace('fold', 'foldAgain');
        const dir = scratch({ 'group/one.ts': `${twelve()}\n\n${other}\n` });
        expect(findCopies(dir, 'group', [])).toEqual([]);
    });

    it('holds every entry of both lists to a reason', () => {
        const bare = [...DELIBERATE, ...HELD].filter((one) => !isReason(one.why));
        expect(bare.map((one) => `${one.a} and ${one.b}`)).toEqual([]);
        expect(readHeld('a.ts b.ts abc123\n')[0].why).toBe('');
        expect(readHeld('a.ts b.ts abc123 they share the fold\n')[0].why).toBe(
            'they share the fold'
        );
        expect(readHeld('a.ts b.ts abc123\n')[0].mark).toBe('abc123');
        expect(isReason('x')).toBe(false);
        expect(isReason('the two fold the same rule')).toBe(true);
    });

    it('holds the lists to clones that are still shared, so a repaired copy takes its entry with it', () => {
        const sharing = new Set([...sharedPairs(ROOT, 'src/lib'), ...sharedPairs(ROOT, 'tests')]);
        const stale = [...DELIBERATE, ...HELD]
            .filter(
                (one) =>
                    !sharing.has(`${one.a}|${one.b}|${one.mark}`) &&
                    !sharing.has(`${one.b}|${one.a}|${one.mark}`)
            )
            .map((one) => `${one.a} and ${one.b} (${one.mark})`);
        expect(stale).toEqual([]);
    });
});
