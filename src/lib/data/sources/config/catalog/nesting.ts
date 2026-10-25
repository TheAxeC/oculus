// Layer 1, data. What is wrong with the `patterns:` map of config/catalogs/file-nesting.yml that
// only the reader can say, as findings on the config channel: a value that is not a map, a pattern
// whose key is empty or holds a slash, and a pattern whose value is not a list of non-empty texts.
// Each is a thing a saved edit can introduce while the server runs, where a throw would take the
// page down with it; the reader drops that pattern and keeps the rest, and the finding says what
// was dropped. The drops are the reader's own (data/helpers/files/nesting.ts), so the findings and
// the nesting cannot disagree. They are worded from the merged catalog, as languageFindings' are,
// and name the file `patterns` was read from (keyPlace): oculus's catalog file, or the open
// workspace file under `settings.patterns` for a value its `settings:` set.

import { findingText } from '../../../helpers/finding-text.ts';
import { readNesting, type NestingDrop } from '../../../helpers/files/nesting.ts';
import type { Finding } from '../../../model/index.ts';
import { keyPlace, type ConfigWhere } from '../merge/merge.ts';
import { textCatalog } from '../merge/text.ts';

/** The key of file-nesting.yml a drop is about, and its sentence. */
function aboutDrop(
    drop: NestingDrop,
    catalog: ReturnType<typeof textCatalog>
): { key: string; message: string } {
    if (drop.kind === 'not-a-map') {
        return {
            key: 'patterns',
            message: findingText(catalog, 'findings.config.nesting_not_a_map')
        };
    }
    const key = `patterns.${drop.key}`;
    return drop.kind === 'key'
        ? { key, message: findingText(catalog, 'findings.config.nesting_key', drop.key) }
        : { key, message: findingText(catalog, 'findings.config.nesting_value', drop.key) };
}

/** One finding for each pattern the reader of `patterns:` drops. */
export function nestingFindings(where: ConfigWhere, config: Record<string, unknown>): Finding[] {
    const catalog = textCatalog(config);
    return readNesting(config).drops.map((drop) => {
        const about = aboutDrop(drop, catalog);
        return { ...about, ...keyPlace(where, about.key) };
    });
}
