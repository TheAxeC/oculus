// Layer 1, data. What is wrong with the options catalog, the files of config/options/, that only
// its reader can say, as findings on the config channel: a control word the vocabulary lacks, a
// source it does not list, a choice with nothing to choose from, a field without a help line, an
// entry under no heading or an unknown one, a range whose minimum is above its maximum, a `whole`
// that is not true, a `form` that is not one of the forms, a list of slots that is not a list of
// words, a `holds: lists` on a family that is no key/value family or a `holds: record` on one that
// is no family field without a `key` field, a `key` that names no field of the records, and in
// `groups:` a group with no help line, a line for no group, and a `groups:` that is no map. Each is
// a thing a saved edit can introduce while the server runs, where a throw would take the page down
// with it; catalogOf reads the entry as a text option, or under the heading for entries with none,
// and the finding says why. The problems are the reader's own (readCatalog of options.ts), so the
// findings and the entries cannot disagree. They are worded from the merged catalog, as
// languageFindings' are, and name the options file and the key: the entry's path and field, or
// `groups.<group>` for a group line.

import { join } from 'node:path';
import { findingText } from '../../../helpers/finding-text.ts';
import type { Finding } from '../../../model/index.ts';
import { OPTIONS_DIR, configDir } from '../folder.ts';
import { textCatalog } from '../merge/text.ts';
import { groupProblem, readCatalog, type OptionProblem } from './options.ts';

/** The key of a finding: the entry's path and the field after a dot, or the group's line. */
function keyOf(problem: OptionProblem): string {
    if (problem.kind === 'groups') return problem.path;
    if (groupProblem(problem)) return `groups.${problem.path}`;
    return problem.field === null ? problem.path : `${problem.path}.${problem.field}`;
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
        case 'no_help':
            return findingText(catalog, 'findings.options.no_help');
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
        case 'holds':
            return findingText(catalog, 'findings.options.holds', problem.word);
        case 'heading_missing':
            return findingText(catalog, 'findings.options.heading_missing');
        case 'heading_unknown':
            return findingText(catalog, 'findings.options.heading_unknown', problem.word);
        case 'key':
            return findingText(catalog, 'findings.options.key', problem.word);
        case 'groups':
            return findingText(catalog, 'findings.options.groups');
        case 'group_missing':
            return findingText(catalog, 'findings.options.group_missing', problem.path);
        case 'group_unknown':
            return findingText(catalog, 'findings.options.group_unknown', problem.path);
    }
}

/** One finding for each entry, field or group line of the catalog that does not read as written. */
export function optionFindings(engine: string, config: Record<string, unknown>): Finding[] {
    const folder = join(configDir(engine), OPTIONS_DIR);
    const catalog = textCatalog(config);
    return readCatalog(config).problems.map((problem) => ({
        file: join(folder, problem.file),
        key: keyOf(problem),
        message: problemText(problem, catalog)
    }));
}
