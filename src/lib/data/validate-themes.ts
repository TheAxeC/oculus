// Layer 1, data. The theme words of the venue and dataset registries against their listed
// vocabulary: `venue_themes` and `data_themes` of config/vocab.yml, which also carry the label each
// word is drawn with. A word off its list draws its view's facet, and on a venue card its tag, under
// the bare word because no label names it, so it is a finding. It lives beside validate.ts rather
// than in it so that file stays one reader's length; validate calls it once per portfolio, and like
// validate it is pure and repairs nothing.

import type { Finding, RawPortfolio, ValidationRules } from './model.ts';

/**
 * The two registries whose entries carry `themes:`, the name of each file's entry list, the
 * vocabulary that lists its words and the words a finding names that vocabulary by. The list names
 * are the ones sources/registries.ts reads the files under, repeated here because this module
 * reads no file and so cannot import the reader.
 */
const THEMED = [
    { registry: 'venues', list: 'entries', vocab: 'venueThemes', noun: 'venue' },
    { registry: 'datasets', list: 'datasets', vocab: 'dataThemes', noun: 'dataset' }
] as const;

/** The dataset registry's own label map, which the labels of `data_themes` replace. */
const RETIRED_LABELS = 'theme_labels';

/**
 * One finding per theme word of a venue or a dataset that is not on its list, keyed by the entry's
 * position and the word's. An absent list checks nothing. A `themes` value that is not a list, and
 * an item of it that is not a string, is passed over here: the reader keeps the strings of a list
 * and nothing else (`strings` in guards.ts), and neither shape is reported by this check.
 *
 * A dataset registry that still holds a top-level `theme_labels:` is one finding too, since nothing
 * reads that map and the labels it gives are not the ones drawn.
 */
export function checkThemes(raw: RawPortfolio, rules: ValidationRules, findings: Finding[]): void {
    for (const { registry, list, vocab: name, noun } of THEMED) {
        const allowed = rules.vocab[name];
        if (allowed === undefined) continue;
        const known = new Set(allowed);
        raw.registries[registry].entries.forEach((entry, index) => {
            if (!Array.isArray(entry.themes)) return;
            entry.themes.forEach((word: unknown, at: number) => {
                if (typeof word !== 'string' || known.has(word)) return;
                findings.push({
                    file: entry.file,
                    key: `${list}[${index}].themes[${at}]`,
                    message: `theme "${word}" is not one of the ${noun} themes`
                });
            });
        });
    }
    const datasets = raw.registries.datasets;
    if (Object.hasOwn(datasets.meta, RETIRED_LABELS)) {
        findings.push({
            file: rules.datasetsFile ?? '',
            key: RETIRED_LABELS,
            message: 'theme_labels is not read; the labels are data_themes in config/vocab.yml'
        });
    }
}
