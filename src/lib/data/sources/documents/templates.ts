// Layer 1, data. The templates of oculus's docs/templates.md that Make Folder a Hub and Make
// Folder a Project write: the YAML block under a heading of the page, the collections the page's
// config.yml block lists with the template of each one's data file, the config.yml a new hub gets
// with the collections the reader ticked, and the project.yml a new project gets.
//
// The page is the one source of these files, so the template a reader copies by hand and the file
// a control writes are the same text. A collection is one line of the commented `collections:`
// list of the config.yml block, `#   - { key: <key>, file: "<path>" }`, and its template is the
// block under the heading `### <path>`; a line whose heading the page lacks is no collection the
// controls offer. The page is read by the caller and handed in, so this module touches no disk.

/** The page of templates, relative to oculus's folder. */
export const TEMPLATES_PAGE = 'docs/templates.md';

/** The heading of the hub settings file's template. */
const CONFIG_HEADING = '## config.yml';

/** The heading of the project manifest's template. */
const PROJECT_HEADING = '## project.yml';

/** The commented list line of one collection in the config.yml block. */
const COLLECTION_LINE = /^# {3}- \{ key: ([a-z][a-z0-9-]*), +file: "([^"]+)" \}$/;

/** The line that opens the commented collection list in the config.yml block. */
const COLLECTIONS_OPEN = '# collections:';

/** A collection the controls offer: its key, its default data file and that file's template. */
export type CollectionTemplate = { key: string; file: string; body: string };

/**
 * The first YAML block under the line of the page that reads exactly `heading`, with its final
 * newline, or null when the page has no such heading or no block under it.
 */
function templateBlock(page: string, heading: string): string | null {
    const lines = page.split('\n');
    const at = lines.indexOf(heading);
    if (at < 0) return null;
    const open = lines.indexOf('```yaml', at);
    const close = open < 0 ? -1 : lines.indexOf('```', open + 1);
    if (open < 0 || close < 0) return null;
    return `${lines.slice(open + 1, close).join('\n')}\n`;
}

/** The collections the config.yml block lists that have a template, in the block's order. */
export function collectionTemplates(page: string): CollectionTemplate[] {
    const block = templateBlock(page, CONFIG_HEADING) ?? '';
    return block.split('\n').flatMap((line) => {
        const found = COLLECTION_LINE.exec(line);
        if (found === null) return [];
        const body = templateBlock(page, `### ${found[2]}`);
        return body === null ? [] : [{ key: found[1], file: found[2], body }];
    });
}

/**
 * The config.yml of a new hub: the page's block, every other key left commented at its default,
 * with the commented collection list replaced by a list of the chosen collections, an empty list
 * when none is chosen.
 */
export function hubConfigText(page: string, chosen: readonly CollectionTemplate[]): string {
    const lines = (templateBlock(page, CONFIG_HEADING) ?? '').split('\n');
    const list =
        chosen.length === 0
            ? ['collections: []']
            : [
                  'collections:',
                  ...chosen.map((one) => `  - { key: ${one.key}, file: "${one.file}" }`)
              ];
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
