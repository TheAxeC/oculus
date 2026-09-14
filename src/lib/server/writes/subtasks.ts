// Layer 2, server. The subtask half of the write path, and the one career write beside it: a line
// ticked, reopened, snoozed or taken out, a line added to a host that may have no block yet, and one
// host of CAREER.yml moved along its pipeline.
//
// A subtask hangs under one of two hosts, which is the whole of the difference between the two views
// that draw the block: one manifest by its id, or one entry of one collection. subtaskHost resolves
// either into the file, its text and, for an entry, the lines of that entry inside it.
//
// server/writes.ts is the route and re-exports everything here.

import { readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { isMap } from '../../data/guards.ts';
import { engineDir, loadConfig } from '../../data/sources/config.ts';
import { readManifests } from '../../data/sources/manifests.ts';
import {
    addSubtask,
    deleteSubtask,
    entryRange,
    setHostStatus,
    setSubtask
} from '../entry-edit/index.ts';
import { insideHub } from './manifest.ts';
import { identityOf, readCollection, saved } from './entries.ts';
import type { LineRange } from '../entry-edit/index.ts';
import type { PortfolioConfig } from '../../data/model.ts';
import type { WriteOutcome } from '../writes.ts';

/** What a subtask write hangs under: one manifest, or one entry of one collection. */
export type SubtaskTarget = { id: string; collection?: string };

/** The file a subtask write edits, and the lines of the entry inside it when it is an entry's. */
type SubtaskHost = { file: string; source: string; range: LineRange | null };

function subtaskHost(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget
): SubtaskHost | null {
    if (target.collection !== undefined) {
        const held = readCollection(hub, config, target.collection);
        if (held === null) return null;
        const value = identityOf(held, target.id);
        if (value === null) return null;
        const range = entryRange(held.source, held.ident, value);
        if (range === null) return null;
        return { file: held.file, source: held.source, range };
    }
    const { manifests } = readManifests(hub, config.scan);
    const manifest = manifests.find((one) => one.id === target.id);
    if (manifest === undefined || !insideHub(hub, config, manifest.file)) return null;
    try {
        return { file: manifest.file, source: readFileSync(manifest.file, 'utf8'), range: null };
    } catch {
        return null;
    }
}

/** What one subtask button does to its line. */
export type SubtaskAction = 'done' | 'reopen' | 'snooze' | 'delete';

/** Tick one subtask line, reopen it, snooze it until a date, or take the line out. */
export function writeSubtask(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    key: string,
    action: SubtaskAction,
    value?: string
): WriteOutcome {
    const host = subtaskHost(hub, config, target);
    if (host === null) return { found: false, changed: [], refused: [] };
    const edit =
        action === 'delete'
            ? deleteSubtask(host.source, host.range, key)
            : action === 'snooze'
              ? setSubtask(host.source, host.range, key, { snooze: value ?? null })
              : setSubtask(host.source, host.range, key, { done: action === 'done' });
    return saved(host.file, host.source, edit);
}

/** Add one subtask line to a manifest or to a collection entry. */
export function writeSubtaskAdd(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    fields: Record<string, unknown>
): WriteOutcome {
    const host = subtaskHost(hub, config, target);
    if (host === null) return { found: false, changed: [], refused: [] };
    return saved(host.file, host.source, addSubtask(host.source, host.range, fields));
}

/** The career file and the host statuses, read out of the same merged config every reader reads. */
function careerRules(): { file: string; statuses: string[] } {
    const merged = loadConfig(engineDir()).config;
    const file = typeof merged.career_file === 'string' ? merged.career_file : 'CAREER.yml';
    const held = merged.career_host_status;
    return { file, statuses: isMap(held) ? Object.keys(held) : [] };
}

/** Set one host's status in CAREER.yml. A status outside the vocabulary is refused, never written. */
export function writeHost(hub: string, name: string, status: string): WriteOutcome {
    const rules = careerRules();
    const file = resolve(join(hub, rules.file));
    if (!file.startsWith(resolve(hub) + sep)) return { found: false, changed: [], refused: [] };
    let source: string;
    try {
        source = readFileSync(file, 'utf8');
    } catch {
        return { found: false, changed: [], refused: [] };
    }
    let data: unknown;
    try {
        data = parse(source);
    } catch {
        return {
            found: true,
            changed: [],
            refused: [{ field: '', reason: 'the file does not parse' }]
        };
    }
    const hosts = isMap(data) && Array.isArray(data.hosts) ? data.hosts : [];
    if (!hosts.some((one) => isMap(one) && one.name === name)) {
        return { found: false, changed: [], refused: [] };
    }
    if (!rules.statuses.includes(status)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'status', reason: `${status} is not a career host status` }]
        };
    }
    return saved(file, source, setHostStatus(source, name, status));
}
