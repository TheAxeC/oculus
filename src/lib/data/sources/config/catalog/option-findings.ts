// Layer 1, data. What is wrong with the options catalog, config/catalogs/options.yml, that only its
// reader can say, as findings on the config channel: a control word the vocabulary lacks, a source
// it does not list, a choice with nothing to choose from, a field without a description, an entry
// under no heading or an unknown one, a range whose minimum is above its maximum, a `whole` that is
// not true, a `form` that is not one of the forms, and a list of slots that is not a list of words.
// Each is a thing a saved edit can introduce while the server runs, where a throw would take the
// page down with it; catalogOf reads the entry as a text option, or under the heading for entries
// with none, and the finding says why. The problems are the reader's own (readCatalog of
// options.ts), so the findings and the entries cannot disagree. They are worded from the merged
// catalog, as languageFindings' are.

import { join } from 'node:path';
import { findingText } from '../../../helpers/finding-text.ts';
import type { Finding } from '../../../model/index.ts';
import { configDir } from '../folder.ts';
import { textCatalog } from '../merge.ts';
import { readCatalog, type OptionProblem } from './options.ts';

/** The key of a finding: the config file, a colon, the key path, and the field after a dot. */
function keyOf(problem: OptionProblem): string {
    const path = problem.field === null ? problem.path : `${problem.path}.${problem.field}`;
    return `${problem.file}:${path}`;
}

/** The sentence of one problem. */
function problemText(problem: OptionProblem, catalog: ReturnType<typeof textCatalog>): string {
    switch (problem.kind) {
        case 'control':
            return findingText(catalog, 'findings.options.control', problem.word);
        case 'control_missing':
            return findingText(catalog, 'findings.options.control_missing');
        case 'source':
            return findingText(catalog, 'findings.options.source', problem.word);
        case 'no_values':
            return findingText(catalog, 'findings.options.no_values');
        case 'no_description':
            return findingText(catalog, 'findings.options.no_description');
        case 'no_fields':
            return findingText(catalog, 'findings.options.no_fields');
        case 'range':
            return findingText(catalog, 'findings.options.range');
        case 'whole':
            return findingText(catalog, 'findings.options.whole');
        case 'form':
            return findingText(catalog, 'findings.options.form', problem.word);
        case 'slots':
            return findingText(catalog, 'findings.options.slots');
        case 'heading_missing':
            return findingText(catalog, 'findings.options.heading_missing');
        case 'heading_unknown':
            return findingText(catalog, 'findings.options.heading_unknown', problem.word);
    }
}

/** One finding for each entry or field of the catalog that cannot be read as it is written. */
export function optionFindings(engine: string, config: Record<string, unknown>): Finding[] {
    const file = join(configDir(engine), 'catalogs', 'options.yml');
    const catalog = textCatalog(config);
    return readCatalog(config).problems.map((problem) => ({
        file,
        key: keyOf(problem),
        message: problemText(problem, catalog)
    }));
}
