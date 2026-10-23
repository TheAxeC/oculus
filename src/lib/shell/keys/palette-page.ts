// Layer 3, shell. The text of docs/palette.md: what the palette lists and takes, written from the
// registry it is handed and the text catalog it is handed, so the page is the palette's own
// vocabulary and no list kept beside it. The registry is made from the palette's modules, its
// prefixes and keys the rows of the palette table (data/helpers/keys/oculus/palette-table.ts), by
// utils/diagrams/palette.mjs (`npm run docs:palette`), which loads this module through Vite's
// server module loading; tests/checks/diagrams/palette.test.ts compares the committed page with a
// fresh generation, and tests/shell/keys/palette-page.test.ts gives this function a small registry.
//
// The page opens with its first paragraph and the contents block every document of the engine opens
// with (a Contents heading, `[TOC]` and a rule), then Markdown tables, one row per entry of the
// registry in the registry's order, and a sentence under each heading. The words are the catalog's:
// `palette_page.*`, and the colon commands' own descriptions.

import {
    KEY_ROWS,
    PREFIX_ROWS,
    type KeyRow,
    type PrefixRow,
    type Press
} from '$lib/data/helpers/keys/oculus/palette-table';

/** The views the palette lists by name. */
export type PaletteViewRow = { id: string; label: string };

/** One colon command: its name, what follows the name, and what it does. */
export type PaletteCommandRow = { name: string; hint: string; description: string };

/** One editor command the palette lists: the editor's action and the chord that runs it. */
export type PaletteEditorRow = { id: string; chord: string };

/**
 * One input form of the palette: what is typed or pressed, one entry for each form it can take,
 * and the catalog key of the words that say what it does. The rows are the palette table's
 * (data/helpers/keys/oculus/palette-table.ts).
 */
export type PaletteInputRow = { input: string[]; word: string };

/** Everything the page lists. */
export type PaletteRegistry = {
    views: PaletteViewRow[];
    commands: PaletteCommandRow[];
    /** The editor's Cmd+K chords and Ctrl+K on macOS, by the action each runs. */
    editor: PaletteEditorRow[];
    /** The words of Pin Editor and Unpin Editor, and the chord that runs them in the editor. */
    pin: { labels: string[]; chord: string };
    /** The words of the commands a Present tab offers. */
    present: string[];
    /** The forms a query takes: the prefixes of the palette table, and Cmd+P's file mode. */
    prefixes: PaletteInputRow[];
    /** The keys of the palette table that open, close and walk the palette. */
    keys: PaletteInputRow[];
};

/** The words of a press as the page writes it: `Cmd+Shift+P`, `F1`, `Enter`. */
function pressText(press: Press): string {
    const key = press.key.length === 1 ? press.key.toUpperCase() : press.key;
    return `${press.command === true ? 'Cmd+' : ''}${press.shift === true ? 'Shift+' : ''}${key}`;
}

/** The rows of the Keys table: the keys of the palette table, each press as the page writes it. */
export function keyInputs(): PaletteInputRow[] {
    return Object.values(KEY_ROWS).map((row: KeyRow) => ({
        input: row.presses.map(pressText),
        word: row.word
    }));
}

/**
 * The rows of the Prefixes table: each prefix as typed with its number form, then each key that
 * opens the palette in a mode no prefix names (Cmd+P's file mode).
 */
export function prefixInputs(): PaletteInputRow[] {
    const typed = Object.values(PREFIX_ROWS).map((row: PrefixRow) => ({
        input: [`${row.prefix}${row.only === undefined ? '' : `<${row.only.name}>`}`],
        word: row.word
    }));
    const opened = Object.values(KEY_ROWS).flatMap((row: KeyRow) =>
        row.mode === undefined ? [] : [{ input: row.presses.map(pressText), word: row.mode }]
    );
    return [...typed, ...opened];
}

/** A table cell: the words with the pipe and any line break taken out of them. */
function cell(words: string): string {
    return words
        .replaceAll('|', '/')
        .replaceAll(/\s*\n\s*/g, ' ')
        .trim();
}

/** A Markdown table of the rows under the headers; no rows give the catalog's empty sentence. */
function table(headers: string[], rows: string[][], none: string): string[] {
    if (rows.length === 0) return [none, ''];
    return [
        `| ${headers.join(' | ')} |`,
        `| ${headers.map(() => '---').join(' | ')} |`,
        ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
        ''
    ];
}

/** The word a catalog key stands for; a missing key is an error, as `t` throws one. */
function word(catalog: Record<string, string>, key: string): string {
    const found = Object.hasOwn(catalog, key) ? catalog[key] : undefined;
    if (found === undefined)
        throw new Error(`text key not in the text catalog (config/text/): ${key}`);
    return found;
}

/** The Markdown page for a registry, in the words of a catalog. */
export function palettePage(registry: PaletteRegistry, catalog: Record<string, string>): string {
    const t = (key: string): string => word(catalog, key);
    const none = t('palette_page.none');
    return [
        `# ${t('palette_page.title')}`,
        '',
        t('palette_page.intro'),
        '',
        `## ${t('palette_page.contents')}`,
        '',
        '[TOC]',
        '',
        '---',
        '',
        `## ${t('palette_page.views')}`,
        '',
        t('palette_page.views_intro'),
        '',
        ...table(
            [t('palette_page.col_view'), t('palette_page.col_id')],
            registry.views.map((view) => [view.label, view.id]),
            none
        ),
        `## ${t('palette_page.commands')}`,
        '',
        t('palette_page.commands_intro'),
        '',
        ...table(
            [
                t('palette_page.col_command'),
                t('palette_page.col_argument'),
                t('palette_page.col_does')
            ],
            registry.commands.map((command) => [
                `\`:${command.name}\``,
                command.hint === '' ? '-' : `\`${command.hint}\``,
                command.description
            ]),
            none
        ),
        `## ${t('palette_page.prefixes')}`,
        '',
        ...table(
            [t('palette_page.col_type'), t('palette_page.col_does')],
            registry.prefixes.map((row) => [
                row.input.map((one) => `\`${one}\``).join(', '),
                t(row.word)
            ]),
            none
        ),
        `## ${t('palette_page.editor')}`,
        '',
        t('palette_page.editor_intro'),
        '',
        ...table(
            [t('palette_page.col_action'), t('palette_page.col_chord')],
            [
                ...registry.editor.map((row) => [row.id, row.chord]),
                ...registry.pin.labels.map((label) => [label, registry.pin.chord])
            ],
            none
        ),
        `## ${t('palette_page.present')}`,
        '',
        t('palette_page.present_intro'),
        '',
        ...table(
            [t('palette_page.col_command')],
            registry.present.map((label) => [label]),
            none
        ),
        `## ${t('palette_page.keys')}`,
        '',
        ...table(
            [t('palette_page.col_key'), t('palette_page.col_does')],
            registry.keys.map((row) => [
                row.input.map((one) => `\`${one}\``).join(', '),
                t(row.word)
            ]),
            none
        )
    ]
        .join('\n')
        .replace(/\n+$/, '\n');
}
