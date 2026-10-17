// Layer 1, data. The words a finding says what a value must be in, for each kind of problem the
// rule (value-rule.ts) finds: "a number from 1 to 35791", "one of none, latexindent", "a program
// name with no slash or white space". They are lines of config/text/findings.yml, so the sentence
// of a finding is reworded in that file alone.

import { findingText, type TextCatalog } from '../../../helpers/finding-text.ts';
import type { CatalogEntry, Form } from './options.ts';
import type { ValueProblem } from './value-rule.ts';

/** The words for a number's whole or range problem, from the bounds the problem carries. */
function numberWords(
    catalog: TextCatalog,
    whole: boolean,
    min: number | undefined,
    max: number | undefined
): string {
    if (min !== undefined && max !== undefined) {
        return whole
            ? findingText(catalog, 'findings.words.whole_range', min, max)
            : findingText(catalog, 'findings.words.range', min, max);
    }
    if (min !== undefined) {
        return whole
            ? findingText(catalog, 'findings.words.whole_min', min)
            : findingText(catalog, 'findings.words.range_min', min);
    }
    if (max !== undefined) {
        return whole
            ? findingText(catalog, 'findings.words.whole_max', max)
            : findingText(catalog, 'findings.words.range_max', max);
    }
    return whole
        ? findingText(catalog, 'findings.words.whole')
        : findingText(catalog, 'findings.words.number');
}

/** The words for a text of one form. */
function formWords(catalog: TextCatalog, form: Form): string {
    switch (form) {
        case 'program':
            return findingText(catalog, 'findings.words.form_program');
        case 'extension':
            return findingText(catalog, 'findings.words.form_extension');
        case 'bundle_id':
            return findingText(catalog, 'findings.words.form_bundle_id');
    }
}

/** The words for what a problem of a list's item says every item must be. */
function itemWords(catalog: TextCatalog, spec: CatalogEntry, problem: ValueProblem): string | null {
    switch (problem.kind) {
        case 'whole':
            return numberWords(catalog, true, problem.min, problem.max);
        case 'range':
            return numberWords(catalog, spec.whole === true, problem.min, problem.max);
        case 'form':
            return formWords(catalog, problem.form);
        default:
            return null;
    }
}

/**
 * What the entry's value must be, for a problem the rule found with it. The empty choice has its
 * own finding line and is not worded here.
 */
export function mustBe(
    catalog: TextCatalog,
    spec: CatalogEntry,
    problem: Exclude<ValueProblem, { kind: 'empty' }>
): string {
    if (spec.control === 'list') {
        if (problem.kind === 'form' && problem.form === 'program') {
            return findingText(catalog, 'findings.words.form_program_list');
        }
        const each = itemWords(catalog, spec, problem);
        if (each !== null) return findingText(catalog, 'findings.words.list_items', each);
    }
    switch (problem.kind) {
        case 'boolean':
            return findingText(catalog, 'findings.words.boolean');
        case 'number':
            return findingText(catalog, 'findings.words.number');
        case 'whole':
            return numberWords(catalog, true, problem.min, problem.max);
        case 'range':
            return numberWords(catalog, spec.whole === true, problem.min, problem.max);
        case 'text':
            return findingText(catalog, 'findings.words.text');
        case 'form':
            return formWords(catalog, problem.form);
        case 'words':
            return findingText(catalog, 'findings.words.words');
        case 'numbers':
            return findingText(catalog, 'findings.words.numbers');
        case 'strings':
            return findingText(catalog, 'findings.words.strings');
        case 'records':
            return findingText(catalog, 'findings.words.records');
        case 'choice':
            return findingText(catalog, 'findings.words.choice', problem.values.join(', '));
        case 'source':
            return findingText(catalog, 'findings.words.source', problem.sources.join(', '));
        case 'glyph':
            return findingText(catalog, 'findings.words.glyph');
        case 'hue':
            return findingText(catalog, 'findings.words.hue');
        case 'colour':
            return findingText(catalog, 'findings.words.colour');
        case 'path':
            return findingText(catalog, 'findings.words.path');
        case 'hub_path':
            return findingText(catalog, 'findings.words.hub_path');
        case 'slots':
            return problem.slots.length === 1
                ? findingText(catalog, 'findings.words.slots_one')
                : findingText(catalog, 'findings.words.slots', problem.slots.length);
    }
}
