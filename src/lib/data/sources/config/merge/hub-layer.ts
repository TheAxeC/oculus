// Layer 1, data. The hub's settings file, `<hub>/.oculus/config.yml`, laid over oculus's values:
// the keys of HUB_LIST (data/helpers/hub-names.ts), which describe the hub rather than the reader,
// each replacing oculus's value whole.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { findingText } from '../../../helpers/finding-text.ts';
import { isMap } from '../../../helpers/guards.ts';
import { HUB_FILE, hubFileOf, hubKeys } from '../../../helpers/hub-names.ts';
import { issueText, shapeIssues } from '../../../shapes/shape-issues.ts';
import { readAs } from '../../../shapes/shapes.ts';
import { keysShape, notAMap, unparsed, type PendingFinding } from './text.ts';
import { setAt, valueAt } from './tree.ts';

/**
 * The hub's settings file, read after oculus's config. A value the file holds at a path of HUB_LIST
 * replaces oculus's value at that path whole. A map is walked only while its path is a strict
 * prefix of a listed path, so `slurm: { resource: x, poll_min: 3 }` applies `slurm.resource` and
 * names `slurm.poll_min`. A key outside the list is a finding that names the hub's file and the
 * key, and nothing of it is applied; a file that is empty, is no map or does not parse (a key twice
 * included) is a finding and oculus's values stand. The file is not required, and a hub without it
 * adds nothing. The values applied are checked against the shape of oculus's file their key belongs
 * to. `text` is the file's text to read instead of the disk, null for the file removed.
 */
export function mergeHub(
    hub: string,
    text: string | null | undefined,
    config: Record<string, unknown>,
    from: Record<string, string>,
    pending: PendingFinding[]
): void {
    const file = join(hub, HUB_FILE);
    const listed = hubKeys();
    let parsed: unknown;
    if (text === null) return;
    try {
        parsed = parse(text ?? readFileSync(file, 'utf8'));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
        pending.push(unparsed(file, error));
        return;
    }
    const top = readAs(keysShape, parsed);
    if (top === null) {
        pending.push(notAMap(file));
        return;
    }
    const applied: Record<string, unknown> = {};
    const walk = (node: Record<string, unknown>, prefix: string): void => {
        for (const [key, value] of Object.entries(node)) {
            const path = prefix === '' ? key : `${prefix}.${key}`;
            if (listed.includes(path)) {
                setAt(applied, path, value);
            } else if (listed.some((one) => one.startsWith(`${path}.`))) {
                if (isMap(value)) walk(value, path);
                else {
                    pending.push({
                        file,
                        key: path,
                        words: (catalog) =>
                            findingText(catalog, 'findings.config.hub_key_not_map', path)
                    });
                }
            } else {
                pending.push({
                    file,
                    key: path,
                    words: (catalog) =>
                        findingText(catalog, 'findings.config.hub_key_unknown', path)
                });
            }
        }
    };
    walk(top, '');
    const files = [...new Set(listed.map((key) => hubFileOf(key) ?? ''))];
    for (const name of files) {
        const own: Record<string, unknown> = {};
        for (const key of listed.filter((one) => hubFileOf(one) === name)) {
            const head = key.split('.')[0];
            if (head in applied) own[head] = applied[head];
        }
        for (const issue of shapeIssues(name, own)) {
            pending.push({ file, key: issue.key, words: (catalog) => issueText(catalog, issue) });
        }
    }
    for (const path of listed) {
        const value = valueAt(applied, path);
        if (value === undefined) continue;
        setAt(config, path, value);
        from[path] = HUB_FILE;
    }
}
