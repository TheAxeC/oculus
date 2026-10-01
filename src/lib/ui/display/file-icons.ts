// Layer 3, primitive helper. Which Seti glyph and colour a file name gets, read from seti-ui's own
// files: its table of names and endings (styles/components/icons/mapping.less), the characters of
// its font (styles/_fonts/seti.less) and the values of its colours (styles/ui-variables.less, with
// the one alias default-theme.less adds). The files reach this module as text through Vite's
// `?raw` import, so no icon table is written here and a new release of the package is read as it
// comes.
//
// A name is looked up as VS Code looks up its Seti theme, with every name and every key of the
// table in lower case: the whole name first (the table's `set` and `partial` entries both give
// whole names), then the longest ending that matches (a `set` entry that starts with a dot, as
// VS Code's file extensions do), then the table's default. The table read as a stylesheet would
// let a later, shorter ending override an earlier, longer one (`pom.xml` would get `.xml`'s
// glyph), and a name that only contains or ends in an entry's text (`remix.zzz` holds `mix`,
// `rebuild` ends in `build`) would take that entry's icon; reading it by these three steps gives
// `pom.xml` its own and those names the default.

import mapping from 'seti-ui/styles/components/icons/mapping.less?raw';
import characters from 'seti-ui/styles/_fonts/seti.less?raw';
import variables from 'seti-ui/styles/ui-variables.less?raw';
import theme from 'seti-ui/styles/default-theme.less?raw';

/** What a file name is drawn with: the glyph's name, its character in the font, its colour name. */
export type FileIconFace = { name: string; char: string; colour: string };

type Entry = { pattern: string; name: string; colour: string };

/** The colour name of a Seti colour variable: `@seti-primary` is `primary`, `@blue` is `blue`. */
function colourOf(variable: string): string {
    return variable.replace(/^seti-/, '');
}

/** The entries of one kind in the table (`set`: a name or ending, `partial`: a whole name). */
function entriesOf(kind: 'set' | 'partial'): Entry[] {
    const found = mapping.matchAll(
        new RegExp(`^\\.icon-${kind}\\("([^"]*)",\\s*"([^"]*)",\\s*@([\\w-]+)\\);`, 'gm')
    );
    return [...found].map((one) => ({
        pattern: one[1].toLowerCase(),
        name: one[2],
        colour: colourOf(one[3])
    }));
}

const SET = entriesOf('set');
const ENDINGS = SET.filter((entry) => entry.pattern.startsWith('.'));
const PARTIAL = entriesOf('partial');

/** The default rule of the table: the glyph and colour of a file it has no entry for. */
const DEFAULT: Entry = (() => {
    const found = /\.icon\("([^"]*)",\s*@([\w-]+)\)/.exec(mapping);
    if (found === null) throw new Error('seti-ui: the table has no default icon');
    return { pattern: '', name: found[1], colour: colourOf(found[2]) };
})();

/** The character of each glyph of the font, by the glyph's name. */
const CHARS: Readonly<Record<string, string>> = Object.fromEntries(
    [...characters.matchAll(/^\s*@([\w-]+): '\\([0-9A-Fa-f]+)';/gm)].map((one) => [
        one[1],
        String.fromCodePoint(parseInt(one[2], 16))
    ])
);

/** The value of each colour, by its name: `#519aba` for `blue`. An alias takes its target's. */
const VALUES: ReadonlyMap<string, string> = (() => {
    const direct = new Map<string, string>();
    const alias = new Map<string, string>();
    for (const one of (variables + '\n' + theme).matchAll(
        /^@([\w-]+):\s*(#[0-9a-fA-F]+|@[\w-]+);/gm
    )) {
        if (one[2].startsWith('#')) direct.set(one[1], one[2]);
        else alias.set(one[1], one[2].slice(1));
    }
    const values = new Map<string, string>();
    const resolve = (name: string): string | undefined =>
        direct.get(name) ?? (alias.has(name) ? resolve(alias.get(name) ?? '') : undefined);
    for (const name of [...direct.keys(), ...alias.keys()]) {
        const value = resolve(name);
        if (value !== undefined) values.set(colourOf(name), value);
    }
    return values;
})();

/** Every colour name the table draws with, the default's included, in the order it first uses. */
export const SETI_COLOURS: readonly string[] = [
    ...new Set([DEFAULT, ...SET, ...PARTIAL].map((entry) => entry.colour))
];

/** The value seti-ui gives a colour name, for the theme tokens that hold it. */
export function setiValue(colour: string): string {
    const value = VALUES.get(colour);
    if (value === undefined) throw new Error(`seti-ui: no value for the colour ${colour}`);
    return value;
}

function face(entry: Entry): FileIconFace {
    const char = Object.hasOwn(CHARS, entry.name) ? CHARS[entry.name] : undefined;
    if (char === undefined) throw new Error(`seti-ui: no character for the glyph ${entry.name}`);
    return { name: entry.name, char, colour: entry.colour };
}

/** The longest of the entries, the last of them in the table when two are as long. */
function longest(list: Entry[]): Entry | undefined {
    return list.reduce<Entry | undefined>(
        (best, entry) =>
            best === undefined || entry.pattern.length >= best.pattern.length ? entry : best,
        undefined
    );
}

/**
 * The glyph, character and colour a file is drawn with. `name` is a file name or a path; only its
 * last part is read, in lower case.
 */
export function fileIcon(name: string): FileIconFace {
    const base = name.slice(name.lastIndexOf('/') + 1).toLowerCase();
    const whole = [...SET, ...PARTIAL].filter((entry) => entry.pattern === base).at(-1);
    if (whole !== undefined) return face(whole);
    const ending = longest(ENDINGS.filter((entry) => base.endsWith(entry.pattern)));
    return face(ending ?? DEFAULT);
}
