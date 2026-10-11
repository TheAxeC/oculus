// Layer 3, primitive helper. A VS Code file icon theme as the page draws it: the theme file the
// server served (GET /api/app-icons, whose image and font paths are already the addresses of the
// app's files) read into the definitions, fonts and name tables, and the icon a file or a folder
// gets from it.
//
// A name is looked up as VS Code looks up a file icon theme, with every key lower case: the whole
// file name in `fileNames`, then its endings in `fileExtensions` (`a.test.ts` tries `test.ts`, then
// `ts`), then its language in `languageIds`, then `file`. A folder is looked up in `folderNames`
// (`folderNamesExpanded` while open), then `folder` (`folderExpanded`). A light colour theme reads
// each table's `light` entry first and the table's own entry after it. A definition draws as the
// picture of its `iconPath` or as the character `fontCharacter` of its font; a definition that
// gives neither draws nothing.

/** What one definition of the theme draws. */
export type IconFace =
    | { kind: 'image'; src: string }
    | { kind: 'font'; char: string; family: string; colour: string; size: string };

/** The tables of the theme that name an icon, each key to a definition id. */
type Tables = {
    file: string;
    folder: string;
    folderExpanded: string;
    fileNames: ReadonlyMap<string, string>;
    fileExtensions: ReadonlyMap<string, string>;
    languageIds: ReadonlyMap<string, string>;
    folderNames: ReadonlyMap<string, string>;
    folderNamesExpanded: ReadonlyMap<string, string>;
};

/** One definition: a picture, or a character of a font. */
type Definition = { src: string; char: string; fontId: string; colour: string; size: string };

/** A theme file read: its definitions, its fonts' families and its two sets of tables. */
export type IconTheme = {
    definitions: ReadonlyMap<string, Definition>;
    /** The family each font id is drawn under, and the font a definition without `fontId` uses. */
    families: ReadonlyMap<string, string>;
    firstFont: string;
    /** The `@font-face` rules of the theme's fonts. */
    fontCss: string;
    base: Tables;
    light: Tables;
};

/** The family name a font id is drawn under; the id is the theme's, so it is made safe to quote. */
function familyOf(id: string): string {
    return `oculus-icons-${id.replace(/[^\w-]/g, '_')}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function textOf(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/** The entries of a table whose values are text, with the keys in lower case. */
function tableOf(value: unknown): Map<string, string> {
    const table = new Map<string, string>();
    if (!isRecord(value)) return table;
    for (const [key, id] of Object.entries(value)) {
        if (typeof id === 'string') table.set(key.toLowerCase(), id);
    }
    return table;
}

function tablesOf(value: unknown): Tables {
    const held = isRecord(value) ? value : {};
    return {
        file: textOf(held.file),
        folder: textOf(held.folder),
        folderExpanded: textOf(held.folderExpanded),
        fileNames: tableOf(held.fileNames),
        fileExtensions: tableOf(held.fileExtensions),
        languageIds: tableOf(held.languageIds),
        folderNames: tableOf(held.folderNames),
        folderNamesExpanded: tableOf(held.folderNamesExpanded)
    };
}

/**
 * The character a `fontCharacter` stands for: `\E001` is the code point E001, as the theme files
 * write a CSS escape, and any other text is the character itself.
 */
function characterOf(text: string): string {
    const escaped = /^\\([0-9a-f]{1,6})$/i.exec(text);
    return escaped === null ? text : String.fromCodePoint(parseInt(escaped[1], 16));
}

/**
 * The CSS font format keyword of a source: the `format` the theme names, else the file's ending.
 */
function formatOf(format: string, path: string): string {
    if (format !== '') return format;
    const ending = path.split('?')[0].split('.').at(-1)?.toLowerCase() ?? '';
    return ending === 'ttf' ? 'truetype' : ending === 'otf' ? 'opentype' : ending;
}

/** The `@font-face` rule of one font of the theme, or none for a font with no source. */
function faceRule(font: Record<string, unknown>, id: string): string {
    const sources = (Array.isArray(font.src) ? font.src : []).flatMap((one): string[] => {
        if (!isRecord(one) || textOf(one.path) === '') return [];
        const path = textOf(one.path);
        return [`url("${encodeURI(path)}") format("${formatOf(textOf(one.format), path)}")`];
    });
    if (sources.length === 0) return '';
    const weight = textOf(font.weight) === '' ? 'normal' : textOf(font.weight);
    const style = textOf(font.style) === '' ? 'normal' : textOf(font.style);
    return `@font-face { font-family: "${familyOf(id)}"; src: ${sources.join(', ')}; font-weight: ${weight.replace(/[^\w ]/g, '')}; font-style: ${style.replace(/[^\w ]/g, '')}; }`;
}

/** A theme file read into an IconTheme, or null for a value that is no object with definitions. */
export function readIconTheme(raw: unknown): IconTheme | null {
    if (!isRecord(raw) || !isRecord(raw.iconDefinitions)) return null;
    const families = new Map<string, string>();
    const rules: string[] = [];
    const sizes = new Map<string, string>();
    let firstFont = '';
    for (const font of Array.isArray(raw.fonts) ? raw.fonts : []) {
        if (!isRecord(font) || textOf(font.id) === '') continue;
        const id = textOf(font.id);
        const rule = faceRule(font, id);
        if (rule === '') continue;
        rules.push(rule);
        families.set(id, familyOf(id));
        sizes.set(id, textOf(font.size));
        if (firstFont === '') firstFont = id;
    }
    const definitions = new Map<string, Definition>();
    for (const [id, one] of Object.entries(raw.iconDefinitions)) {
        if (!isRecord(one)) continue;
        const fontId = textOf(one.fontId) === '' ? firstFont : textOf(one.fontId);
        definitions.set(id, {
            src: textOf(one.iconPath),
            char: characterOf(textOf(one.fontCharacter)),
            fontId,
            colour: textOf(one.fontColor),
            size: textOf(one.fontSize) === '' ? (sizes.get(fontId) ?? '') : textOf(one.fontSize)
        });
    }
    return {
        definitions,
        families,
        firstFont,
        fontCss: rules.join('\n'),
        base: tablesOf(raw),
        light: tablesOf(raw.light)
    };
}

/** What a definition draws, or null for one that draws nothing. */
function faceOf(theme: IconTheme, id: string | undefined): IconFace | null {
    const one = id === undefined || id === '' ? undefined : theme.definitions.get(id);
    if (one === undefined) return null;
    if (one.src !== '') return { kind: 'image', src: one.src };
    const family = theme.families.get(one.fontId);
    if (one.char === '' || family === undefined) return null;
    return {
        kind: 'font',
        char: one.char,
        family,
        colour: one.colour.replace(/[^\w#(),.% -]/g, ''),
        size: one.size.replace(/[^\w.% -]/g, '')
    };
}

/** The sets of tables a lookup reads, the first that names an icon deciding. */
function setsOf(theme: IconTheme, dark: boolean): Tables[] {
    return dark ? [theme.base] : [theme.light, theme.base];
}

/** The first definition id a key has in any of the sets' tables. */
function found(
    sets: Tables[],
    table: 'fileNames' | 'fileExtensions' | 'languageIds' | 'folderNames' | 'folderNamesExpanded',
    key: string
): string | undefined {
    return sets.map((one) => one[table].get(key)).find((id) => id !== undefined);
}

/** The endings of a file name VS Code looks up in `fileExtensions`, the longest first. */
function endingsOf(base: string): string[] {
    const parts = base.split('.');
    return parts.slice(1).map((_, at) => parts.slice(at + 1).join('.'));
}

/**
 * The icon a file is drawn with. `name` is a file name or a path, of which the last part is read;
 * `language` is the name of the language the file opens in. A theme that names no icon for the
 * file and has no `file` icon gives null.
 */
export function themedFileIcon(
    theme: IconTheme,
    name: string,
    language: string,
    dark: boolean
): IconFace | null {
    const base = name.slice(name.lastIndexOf('/') + 1).toLowerCase();
    const sets = setsOf(theme, dark);
    const byName = found(sets, 'fileNames', base);
    if (byName !== undefined) return faceOf(theme, byName);
    for (const ending of endingsOf(base)) {
        const byEnding = found(sets, 'fileExtensions', ending);
        if (byEnding !== undefined) return faceOf(theme, byEnding);
    }
    const byLanguage = found(sets, 'languageIds', language.toLowerCase());
    if (byLanguage !== undefined) return faceOf(theme, byLanguage);
    return faceOf(
        theme,
        sets.map((one) => one.file).find((id) => id !== '')
    );
}

/** The icon a folder is drawn with, or null when the theme names none for folders. */
export function themedFolderIcon(
    theme: IconTheme,
    name: string,
    open: boolean,
    dark: boolean
): IconFace | null {
    const base = name.slice(name.lastIndexOf('/') + 1).toLowerCase();
    const sets = setsOf(theme, dark);
    const byName = found(sets, open ? 'folderNamesExpanded' : 'folderNames', base);
    if (byName !== undefined) return faceOf(theme, byName);
    const plain = sets
        .map((one) => (open ? one.folderExpanded : one.folder))
        .find((id) => id !== '');
    return faceOf(theme, plain ?? sets.map((one) => one.folder).find((id) => id !== ''));
}
