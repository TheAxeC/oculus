// Layer 1, data. What is wrong with the `languages:` map of config/sources.yml that only the reader
// can say, as findings on the config channel: a value that is not a map, a language the editor does
// not colour, a language whose value is not a list, an entry that is not a file name ending, and an
// ending two languages claim. Each is a thing a saved edit can introduce while the server runs,
// where a throw would take the page down with it; the reader drops it and keeps the rest, and the
// finding says what was dropped. The drops are the reader's own (data/helpers/files/languages.ts),
// so the findings and the map cannot disagree. They are worded from the merged catalog, as
// iconFindings' are.

import { join } from 'node:path';
import { findingText } from '../../../helpers/finding-text.ts';
import { readLanguages, type LanguageDrop } from '../../../helpers/files/languages.ts';
import type { Finding } from '../../../model/index.ts';
import { configDir } from '../folder.ts';
import { textCatalog } from '../merge.ts';

/** A catalog of sentences, as textCatalog gives it. */
type Catalog = ReturnType<typeof textCatalog>;

/** The key of sources.yml a drop is about, and its sentence. */
function aboutDrop(drop: LanguageDrop, catalog: Catalog): { key: string; message: string } {
    if (drop.kind === 'not-a-map') {
        return {
            key: 'languages',
            message: findingText(catalog, 'findings.config.languages_not_a_map')
        };
    }
    if (drop.kind === 'claimed') {
        return {
            key: `languages.${drop.second}`,
            message: findingText(
                catalog,
                'findings.config.language_claimed',
                drop.ending,
                drop.first,
                drop.second
            )
        };
    }
    const key = `languages.${drop.language}`;
    if (drop.kind === 'ending') {
        const message =
            drop.entry === ''
                ? findingText(catalog, 'findings.config.language_empty', drop.language)
                : findingText(
                      catalog,
                      'findings.config.language_ending',
                      drop.language,
                      drop.entry
                  );
        return { key, message };
    }
    const message =
        drop.kind === 'unknown'
            ? findingText(catalog, 'findings.config.language_unknown', drop.language)
            : findingText(catalog, 'findings.config.language_not_a_list', drop.language);
    return { key, message };
}

/** One finding for each entry, language or ending the reader of `languages:` drops. */
export function languageFindings(engine: string, config: Record<string, unknown>): Finding[] {
    const file = join(configDir(engine), 'sources.yml');
    const catalog = textCatalog(config);
    return readLanguages(config).drops.map((drop) => ({ file, ...aboutDrop(drop, catalog) }));
}
