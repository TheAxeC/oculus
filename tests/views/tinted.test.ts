// Layer 4, view test. Over a wallpaper the box a view fills paints nothing, so a view whose content
// draws its text straight into the box would have that text on the picture with nothing between. A
// view like that asks ui/Pane.svelte for the tint; a view that draws cards, lanes or frames of its
// own does not, because its own surfaces are then the one translucent layer.
//
// Which views are which is read off the sources rather than listed here: a view is bare when neither
// it nor any partial it renders declares a wallpaper surface or renders a Card. So a new bare view
// fails this until it asks for the tint, and a view that grows a card of its own fails until it
// stops asking.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = 'src/lib/views';

/** The prop ui/Pane.svelte takes, and the class it puts on the box. */
const PROP = 'tinted';

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
    /** Whether it renders ui/Card.svelte, whose surface is the card's. */
    card: boolean;
    /** Whether it renders the box at all, which is what the tint is a property of. */
    pane: boolean;
    /** Whether the box it renders asks for the tint. */
    asks: boolean;
    /** The other view components it renders, as absolute paths. */
    partials: string[];
};

/** The path a view's import of another view resolves to, by either spelling the tree uses. */
function partialPath(file: string, specifier: string): string {
    const alias = '$lib/views/';
    return specifier.startsWith(alias)
        ? resolve(ROOT, specifier.slice(alias.length))
        : resolve(dirname(file), specifier);
}

function read(file: string): Read {
    const source = readFileSync(file, 'utf8');
    const rules = [...css(source).matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    const opening = source.match(/<Pane\b[\s\S]*?>/);
    return {
        surface: rules.some((rule) => WALL.test(rule[1]) && WALL_MIX.test(rule[2])),
        card: /<Card[\s/>]/.test(source),
        pane: opening !== null,
        asks: opening !== null && new RegExp(`\\b${PROP}\\b`).test(opening[0]),
        partials: [...source.matchAll(/from\s+'((?:\.|\$lib\/views\/)[^']+\.svelte)'/g)].map(
            (match) => partialPath(file, match[1])
        )
    };
}

const sources = new Map(files(ROOT).map((file) => [resolve(file), read(file)]));

/**
 * Whether a view draws its text straight into the box: nothing it renders keeps a surface over the
 * picture. A partial outside `views/` is a primitive, and a primitive's surface is its own rule's,
 * not the view's, which is why only the view tree is walked.
 */
function bare(file: string, seen = new Set<string>()): boolean {
    const path = resolve(file);
    if (seen.has(path)) return true;
    seen.add(path);
    const source = sources.get(path);
    if (source === undefined) return true;
    if (source.surface || source.card) return false;
    return source.partials.every((partial) => bare(partial, seen));
}

describe('the tinted box', () => {
    const boxes = [...sources.entries()].filter(([, source]) => source.pane);
    const asked = boxes.filter(([file]) => bare(file));

    it('finds views on both sides of the rule', () => {
        expect(asked.length).toBeGreaterThan(0);
        expect(boxes.length).toBeGreaterThan(asked.length);
    });

    it('has every bare view ask the box for the tint', () => {
        const missing = asked
            .filter(([, source]) => !source.asks)
            .map(([file]) => file)
            .sort();
        expect(missing).toEqual([]);
    });

    it('has no view that paints a surface of its own ask for it', () => {
        const extra = boxes
            .filter(([file, source]) => source.asks && !bare(file))
            .map(([file]) => file)
            .sort();
        expect(extra).toEqual([]);
    });

    it('gives the primitive the prop and one wall rule for the box itself', () => {
        const pane = readFileSync('src/lib/ui/Pane.svelte', 'utf8');
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
