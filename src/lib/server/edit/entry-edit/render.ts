// Layer 2, server. Flow-map and collection-entry rendering lives here because output formatting
// changes independently of locating or applying edits.

import {
    isBlockMap,
    isMetalist,
    renderBlockMap,
    renderMetalist,
    renderScalar
} from '../yaml/yaml-values.ts';
import type { FieldValue } from '../yaml/yaml-values.ts';
import { byKey } from '../../../data/helpers/guards.ts';
import { flowScalar, renderFlowList } from './lines.ts';

export function renderFlowMap(record: Record<string, FieldValue>): string {
    const parts = Object.entries(record).map(([key, value]) => `${key}: ${flowScalar(value)}`);
    return parts.length === 0 ? '{}' : `{ ${parts.join(', ')} }`;
}

/**
 * One new entry as the lines it is written on: the identity field on the `- ` line and every other
 * field under it, in the order the file's own schema names them. A field the caller did not give a
 * value for is not written at all, which is what an empty control on the add form means.
 */
export function renderEntry(
    order: string[],
    ident: string,
    fields: Record<string, FieldValue>
): string {
    const names = [ident, ...order.filter((one) => one !== ident)];
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
