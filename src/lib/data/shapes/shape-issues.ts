// Layer 1, data. What oculus's own catalogs and text files hold that their whole-file shape
// refuses (data/shapes/catalog-files.ts), as findings on the config channel: a key the file does
// not take, a value of the wrong kind, a word outside the ones a key takes, and a text not in the
// form a key takes. Each is worded from the catalog by the kind of the issue, never in the words of
// the library, and names the file and the key. A reader keeps what it reads whatever the shape
// finds, so a wrong key costs that key alone and the server starts.
//
// A row a file's own reader already words when it drops it is the reader's finding, so the shape
// leaves the paths that reader owns (`owned` of the file) to it.

import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import { fileShapeOf } from './catalog-files.ts';

/** One thing a file's shape refuses: where, and of what kind. */
export type ShapeIssue =
    | { kind: 'unknown'; key: string }
    | { kind: 'type'; key: string; expected: string }
    | { kind: 'value'; key: string; allowed: string[] }
    | { kind: 'form'; key: string }
    | { kind: 'other'; key: string };

/** The dotted key of an issue's path, with a number as the step into a list. */
function dotted(path: readonly PropertyKey[]): string {
    return path.map(String).join('.');
}

/** The issues of a file's content against its shape, leaving out what the file's reader owns. */
export function shapeIssues(name: string, content: unknown): ShapeIssue[] {
    const found = fileShapeOf(name);
    if (found === undefined) return [];
    const read = found.shape.safeParse(content ?? {});
    if (read.success) return [];
    const issues: ShapeIssue[] = [];
    for (const issue of read.error.issues) {
        const base = dotted(issue.path);
        const at = (key: string): string => (base === '' ? key : `${base}.${key}`);
        if (issue.code === 'unrecognized_keys') {
            for (const key of issue.keys) {
                if (!found.owned(at(key))) issues.push({ kind: 'unknown', key: at(key) });
            }
            continue;
        }
        if (found.owned(base)) continue;
        if (issue.code === 'invalid_type') {
            issues.push({ kind: 'type', key: base, expected: String(issue.expected) });
        } else if (issue.code === 'invalid_value') {
            issues.push({ kind: 'value', key: base, allowed: issue.values.map(String) });
        } else if (issue.code === 'invalid_format') {
            issues.push({ kind: 'form', key: base });
        } else {
            issues.push({ kind: 'other', key: base });
        }
    }
    return issues;
}

/** The words of the kind of value a key must be. */
function expectedWords(catalog: TextCatalog, expected: string): string {
    switch (expected) {
        case 'array':
            return findingText(catalog, 'findings.schema.is_list');
        case 'object':
        case 'record':
            return findingText(catalog, 'findings.schema.is_map');
        case 'number':
        case 'int':
            return findingText(catalog, 'findings.schema.is_number');
        case 'boolean':
            return findingText(catalog, 'findings.schema.is_flag');
        default:
            return findingText(catalog, 'findings.schema.is_text');
    }
}

/** The sentence of one issue, worded from the catalog. */
export function issueText(catalog: TextCatalog, issue: ShapeIssue): string {
    switch (issue.kind) {
        case 'unknown':
            return findingText(catalog, 'findings.config.shape_unknown', issue.key);
        case 'type':
            return findingText(
                catalog,
                'findings.config.shape_type',
                issue.key,
                expectedWords(catalog, issue.expected)
            );
        case 'value':
            return findingText(
                catalog,
                'findings.config.shape_value',
                issue.key,
                issue.allowed.join(', ')
            );
        case 'form':
            return findingText(catalog, 'findings.config.shape_form', issue.key);
        case 'other':
            return findingText(catalog, 'findings.config.shape_other', issue.key);
    }
}
