// Layer 2, server. Flow-map and collection-entry rendering lives here because output formatting
// changes independently of locating or applying edits.

import {
    isBlockMap,
    isMetalist,
    renderBlockMap,
    renderMetalist
} from '../../core/files/yaml/yaml-values.ts';
import type { FieldValue } from '../../core/files/yaml/yaml-values.ts';
import { renderScalar } from '../../../data/helpers/files/yaml/collection-text.ts';
import { byKey } from '../../../data/helpers/guards.ts';
import { flowScalar, renderFlowList } from './lines.ts';

/**
 * One line of a block as a flow map. A list of texts, the people of a line, is written in the
 * tree's inline form `[a, b]` (`renderFlowList`, which quotes an item holding a comma, a bracket or
 * a brace); every other value is written as `flowScalar` writes it.
 */
export function renderFlowMap(record: Record<string, FieldValue>): string {
    const parts = Object.entries(record).map(([key, value]) => `${key}: ${flowValue(value)}`);
    return parts.length === 0 ? '{}' : `{ ${parts.join(', ')} }`;
}

/** One value of a flow map: a list of texts inline, anything else as a flow scalar. */
function flowValue(value: FieldValue): string {
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
        return renderFlowList(value, []);
    }
    return flowScalar(value);
}

/**
 * One new entry as the lines it is written on, its fields in the order the file's own schema names
 * them, the first on the `- ` line. The file's primary key `ident` goes first when the schema does
 * not name it, as in a file with no schema, and a field the schema does not name goes last. A
 * field the caller did not give a value for is not written at all.
 */
export function renderEntry(
    order: string[],
    ident: string,
    fields: Record<string, FieldValue>
): string {
    const names = order.includes(ident) ? [...order] : [ident, ...order];
    for (const name of Object.keys(fields)) if (!names.includes(name)) names.push(name);
    const lines: string[] = [];
    for (const name of names) {
        const value = byKey(fields, name);
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value) && value.length === 0) continue;
        if (isBlockMap(value)) {
            if (Object.keys(value).length === 0) continue;
            lines.push(`    ${name}:`);
            lines.push(`      ${renderBlockMap(value, 6)}`);
            continue;
        }
        if (isMetalist(value)) {
            lines.push(`    ${name}:`);
            lines.push(`      ${renderMetalist(value, 6)}`);
            continue;
        }
        const rendered = Array.isArray(value) ? renderFlowList(value, []) : renderScalar(value);
        if (rendered.includes('\n')) continue;
        lines.push(lines.length === 0 ? `  - ${name}: ${rendered}` : `    ${name}: ${rendered}`);
    }
    return lines.join('\n');
}
