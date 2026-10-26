// Layer 1, data. The templates of oculus's docs/templates.md that the make items of the Files view
// write: the fenced block under a heading of the page, the collections the page's config.yml block
// lists with the template of each one's data file, the config.yml a new hub gets with the
// collections the reader ticked, the project.yml a new project gets, and the block of any other
// file by its heading (`fileText`): the hub's `local.yml`, `.gitignore` and `schedules.yml`, and a
// repository's `settings.yml`, `commands.yml`, `launch.yml` and `cpp.yml`.
//
// The page is the one source of these files, so the template a reader copies by hand and the file
// a control writes are the same text. A collection is one line of the commented `collections:`
// list of the config.yml block, `#   - { key: <key>, file: "<path>", ... }`, a YAML flow map read
// with every field it sets (the registry, the flags, the ticker and the words, as
// data/helpers/hub-names.ts's `collectionFiles` reads an entry), and its template is the block
// under the heading `### <path>`; a line whose heading the page lacks is no collection the controls
// offer. A new hub's list writes each chosen line as the page has it. The page is read by the
// caller and handed in, so this module touches no disk.

import { parse } from 'yaml';
import { collectionFiles } from '../../helpers/hub-names.ts';
import type { CollectionEntry } from '../../model/index.ts';

/** The page of templates, relative to oculus's folder. */
export const TEMPLATES_PAGE = 'docs/templates.md';

/** The heading of the hub settings file's template. */
const CONFIG_HEADING = '## config.yml';

/** The heading of the project manifest's template. */
const PROJECT_HEADING = '## project.yml';

/** The commented list line of one collection in the config.yml block: its flow map. */
const COLLECTION_LINE = /^# {3}- (\{ key: .*\})$/;

/** The line that opens the commented collection list in the config.yml block. */
const COLLECTIONS_OPEN = '# collections:';

/**
 * A collection the controls offer: its entry with every field its line sets, the line's flow map
 * as the page writes it, and the template of its data file.
 */
export type CollectionTemplate = CollectionEntry & { line: string; body: string };

/**
 * The first fenced block under the line of the page that reads exactly `heading`, whatever its
 * fence names (`yaml`, `gitignore`), with its final newline, or null when the page has no such
 * heading or no block under it.
 */
function templateBlock(page: string, heading: string): string | null {
    const lines = page.split('\n');
    const at = lines.indexOf(heading);
    if (at < 0) return null;
    const open = lines.findIndex((line, index) => index > at && line.startsWith('```'));
    const close = open < 0 ? -1 : lines.indexOf('```', open + 1);
    if (open < 0 || close < 0) return null;
    return `${lines.slice(open + 1, close).join('\n')}\n`;
}

/** The entry one list line's flow map names, or null for a map that names no key and file. */
function entryOf(line: string): CollectionEntry | null {
    let value: unknown;
    try {
        value = parse(line);
    } catch {
        return null;
    }
    return collectionFiles([value]).at(0) ?? null;
}

/** The collections the config.yml block lists that have a template, in the block's order. */
export function collectionTemplates(page: string): CollectionTemplate[] {
    const block = templateBlock(page, CONFIG_HEADING) ?? '';
    return block.split('\n').flatMap((text) => {
        const found = COLLECTION_LINE.exec(text);
        const entry = found === null ? null : entryOf(found[1]);
        if (found === null || entry === null) return [];
        const body = templateBlock(page, `### ${entry.file}`);
        return body === null ? [] : [{ ...entry, line: found[1], body }];
    });
}

/**
 * The config.yml of a new hub: the page's block, every other key left commented at its default,
 * with the commented collection list replaced by a list of the chosen collections, each line as
 * the page writes it, an empty list when none is chosen.
 */
export function hubConfigText(page: string, chosen: readonly CollectionTemplate[]): string {
    const lines = (templateBlock(page, CONFIG_HEADING) ?? '').split('\n');
    const list =
        chosen.length === 0
            ? ['collections: []']
            : ['collections:', ...chosen.map((one) => `  - ${one.line}`)];
    const start = lines.indexOf(COLLECTIONS_OPEN);
    if (start < 0) return [...lines, ...list, ''].join('\n');
    let end = start + 1;
    while (end < lines.length && COLLECTION_LINE.test(lines[end])) end += 1;
    return [...lines.slice(0, start), ...list, ...lines.slice(end)].join('\n');
}

/** The project.yml of a new project, the page's template, or null when the page has none. */
export function projectText(page: string): string | null {
    return templateBlock(page, PROJECT_HEADING);
}

/**
 * The template of the file whose heading is `## <name>` (`local.yml`, `.gitignore`), or null when
 * the page has none.
 */
export function fileText(page: string, name: string): string | null {
    return templateBlock(page, `## ${name}`);
}
