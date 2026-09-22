// Layer 4, view test. Over a wallpaper the box a view fills paints nothing, so a view whose content
// draws its text straight into the box would have that text on the picture with nothing between. A
// view like that asks ui/frame/Pane.svelte for the tint; a view that draws cards, lanes or frames
// of its own does not, because its own surfaces are then the one translucent layer.
//
// Which views are which is read off the sources rather than listed here: a view is bare when neither
// it nor any partial it renders declares a wallpaper surface or renders a Card. A partial the view
// renders with `surface={false}` paints nothing for that view, so a view whose only surface was that
// partial's is bare and asks. So a new bare view fails this until it asks for the tint, and a view
// that grows a card of its own fails until it stops asking.
//
// The audit is a function of the sources it is given, so the two sides of the rule are also driven
// over a synthetic pair below rather than only over whatever the tree happens to hold.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = 'src/lib/views';

/** The prop ui/frame/Pane.svelte takes, and the class it puts on the box. */
const PROP = 'tinted';

/** What a view writes on a partial's tag to take that partial's own surface away. */
const BARE_PROP = 'surface={false}';

/** A surface kept over the picture: one of the surface tokens at the wallpaper's fraction. */
const WALL_MIX =
    /background:\s*color-mix\(\s*in\s+srgb\s*,\s*var\(\s*--(?:bg|panel|card|chip)\s*\)\s+var\(\s*--wall-(?:panel|popover)\s*\)\s*,\s*transparent\s*\)/;

/** The body class every wallpaper rule hangs off, in a rule's own selector. */
const WALL = /:global\(body[^)]*\bwall\b[^)]*\)/;

function files(at: string): string[] {
    return readdirSync(at)
        .flatMap((name) => {
            const path = join(at, name);
            return statSync(path).isDirectory() ? files(path) : [path];
        })
        .filter((path) => path.endsWith('.svelte'));
}

/** The style blocks of a component, comments removed. */
function css(source: string): string {
    return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
        .map((match) => match[1])
        .join('\n')
        .replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/** What the audit needs of one component: what it paints, what it renders, what it renders it with. */
type Read = {
    /** Whether it keeps a surface of its own over the picture. */
    surface: boolean;
    /** Whether it renders ui/frame/Card.svelte, whose surface is the card's. */
    card: boolean;
    /** Whether it renders the box at all, which is what the tint is a property of. */
    pane: boolean;
    /** Whether the box it renders asks for the tint. */
    asks: boolean;
    /** The view components it renders that paint for it, as absolute paths. */
    partials: string[];
};

/** The path a view's import of another view resolves to, by either spelling the tree uses. */
function partialPath(file: string, specifier: string): string {
    const alias = '$lib/views/';
    return specifier.startsWith(alias)
        ? resolve(ROOT, specifier.slice(alias.length))
        : resolve(dirname(file), specifier);
}

/**
 * The opening tag one component is rendered by in a source, or null when it renders none. The tag
 * ends at the first `>` that is not the head of an arrow, so a prop holding a handler does not cut
 * the tag short and hide the props written after it.
 */
function opening(source: string, name: string): string | null {
    const found = new RegExp(`<${name}\\b[\\s\\S]*?(?<!=)>`).exec(source);
    return found === null ? null : found[0];
}

function read(file: string, source: string): Read {
    const rules = [...css(source).matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    const box = opening(source, 'Pane');
    const imports = [
        ...source.matchAll(/import\s+(\w+)\s+from\s+'((?:\.|\$lib\/views\/)[^']+\.svelte)'/g)
    ];
    return {
        surface: rules.some((rule) => WALL.test(rule[1]) && WALL_MIX.test(rule[2])),
        card: /<Card[\s/>]/.test(source),
        pane: box !== null,
        asks: box !== null && new RegExp(`\\b${PROP}\\b`).test(box),
        partials: imports
            .filter((match) => !(opening(source, match[1]) ?? '').includes(BARE_PROP))
            .map((match) => partialPath(file, match[2]))
    };
}

/**
 * Whether a view draws its text straight into the box: nothing it renders keeps a surface over the
 * picture. A partial outside `views/` is a primitive, and a primitive's surface is its own rule's,
 * not the view's, which is why only the view tree is walked.
 */
function bare(file: string, held: Map<string, Read>, seen = new Set<string>()): boolean {
    const path = resolve(file);
    if (seen.has(path)) return true;
    seen.add(path);
    const source = held.get(path);
    if (source === undefined) return true;
    if (source.surface || source.card) return false;
    return source.partials.every((partial) => bare(partial, held, seen));
}

/** The two ways the rule is broken: a bare view that does not ask, and a surfaced view that does. */
function faults(held: Map<string, Read>): { missing: string[]; extra: string[] } {
    const boxes = [...held.entries()].filter(([, source]) => source.pane);
    return {
        missing: boxes
            .filter(([file, source]) => !source.asks && bare(file, held))
            .map(([file]) => file)
            .sort(),
        extra: boxes
            .filter(([file, source]) => source.asks && !bare(file, held))
            .map(([file]) => file)
            .sort()
    };
}

const sources = new Map(
    files(ROOT).map((file) => [resolve(file), read(file, readFileSync(file, 'utf8'))])
);

describe('the tinted box', () => {
    const boxes = [...sources.entries()].filter(([, source]) => source.pane);
    const asked = boxes.filter(([file]) => bare(file, sources));

    it('finds views on both sides of the rule', () => {
        expect(asked.length).toBeGreaterThan(0);
        expect(boxes.length).toBeGreaterThan(asked.length);
    });

    it('has every bare view ask the box for the tint', () => {
        expect(faults(sources).missing).toEqual([]);
    });

    it('has no view that paints a surface of its own ask for it', () => {
        expect(faults(sources).extra).toEqual([]);
    });

    it('counts the file browser as bare, since its form paints nothing for it', () => {
        const file = resolve(ROOT, 'sources/files/Files.svelte');

        expect(bare(file, sources)).toBe(true);
        expect(sources.get(file)?.asks).toBe(true);
    });

    it('gives the primitive the prop and one wall rule for the box itself', () => {
        const pane = readFileSync('src/lib/ui/frame/Pane.svelte', 'utf8');
        expect(pane).toContain(`${PROP}?: boolean`);
        expect(pane).toContain(`${PROP} = false`);
        const tinted = [...css(pane).matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(
            (rule) => WALL.test(rule[1]) && new RegExp(`\\.pane\\.${PROP}\\s*$`).test(rule[1])
        );
        expect(tinted).toHaveLength(1);
        expect(WALL_MIX.test(tinted[0][2])).toBe(true);
        expect(tinted[0][2]).toContain('backdrop-filter: blur(var(--wall-blur))');
    });
});

/** A partial that keeps a surface of its own over the picture. */
const FORM = [
    '<style>',
    '    :global(body.wall) .form {',
    '        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);',
    '    }',
    '</style>'
].join('\n');

/** A view drawing the box, with the props on its box and the tag it renders the partial as. */
function view(box: string, form: string): string {
    return [
        '<script lang="ts">',
        "    import Pane from '$lib/ui/frame/Pane.svelte';",
        "    import Form from './Form.svelte';",
        '</script>',
        '',
        `<Pane title="One"${box}>`,
        `    ${form}`,
        '</Pane>'
    ].join('\n');
}

/** The audit over a pair of sources of this file's own, read exactly as the tree's are. */
function audit(entries: Record<string, string>): { missing: string[]; extra: string[] } {
    const held = new Map(
        Object.entries(entries).map(([name, source]) => {
            const file = resolve(ROOT, name);
            return [file, read(file, source)];
        })
    );
    return faults(held);
}

describe('the rule over a pair of sources', () => {
    const one = resolve(ROOT, 'One.svelte');

    it('has a view whose partial paints for it leave the box alone', () => {
        expect(audit({ 'Form.svelte': FORM, 'One.svelte': view('', '<Form />') })).toEqual({
            missing: [],
            extra: []
        });
        expect(audit({ 'Form.svelte': FORM, 'One.svelte': view(' tinted', '<Form />') })).toEqual({
            missing: [],
            extra: [one]
        });
    });

    it('has a view whose partial paints nothing for it ask the box', () => {
        expect(
            audit({ 'Form.svelte': FORM, 'One.svelte': view('', '<Form surface={false} />') })
        ).toEqual({ missing: [one], extra: [] });
        expect(
            audit({
                'Form.svelte': FORM,
                'One.svelte': view(' tinted', '<Form surface={false} />')
            })
        ).toEqual({ missing: [], extra: [] });
    });
});
