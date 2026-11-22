// Layer 2, server. What changed between two scans of the session stores, and between two payloads
// of the `sessions` channel.
//
// The scan runs in a worker thread, whose answer is copied to the server's. `createScanner` is the
// worker's half: it remembers the text of each record it answered and of the tree's placements, and
// answers only what differs. `Scanned` is the server's half: it keeps the records as scanned, apart
// from the records as published, since a hook changes a published record and a scan's state
// replaces what the hook put there. A record that did not change keeps its object from one payload
// to the next, so what a message of the channel must hold is found by identity
// (`sessionsDifference`), with no comparison by text.

import {
    joinSessions,
    placedOf,
    type Message,
    type PlacedWorkspace,
    type SessionRecord,
    type SessionsDifference,
    type SessionsPayload,
    type Terminal
} from '../../../data/model/index.ts';
import { readerDigest } from '../cache.ts';
import type { ProjectFolder } from '../group.ts';
import { sessions } from '../index.ts';
import type { HookStore } from './hooks.ts';
import { createStamps } from './stamps.ts';
import type { ScanOptions } from './transcripts.ts';

/** One scan as the worker is asked for it. */
export type ScanAsk = Pick<
    ScanOptions,
    | 'stores'
    | 'codexStores'
    | 'registries'
    | 'cachePath'
    | 'overridesPath'
    | 'windowDays'
    | 'maxSessions'
> & { roots?: string[]; projectFolders: ProjectFolder[] };

/** What one scan found: the path of every record in order, and what differs from the one before. */
export type ScanAnswer = {
    /** Whether it is the first answer of its thread, which holds every record and the tree. */
    whole: boolean;
    order: string[];
    records: SessionRecord[];
    placed?: PlacedWorkspace[];
};

/**
 * The scan of one thread, over the functions every scan is made of. The reader's digest is read
 * once, and the latest record stamps of the subagents' transcripts are kept from scan to scan.
 */
export function createScanner(): (ask: ScanAsk) => ScanAnswer {
    const stamps = createStamps();
    const version = readerDigest();
    let texts: Map<string, string> | null = null;
    let tree = '';
    return (ask) => {
        const { records, workspaces } = sessions({ ...ask, stamps, version });
        const held = texts;
        const found = new Map(records.map((record) => [record.path, JSON.stringify(record)]));
        const placed = placedOf(workspaces);
        const placedText = JSON.stringify(placed);
        const moved = held === null || placedText !== tree;
        texts = found;
        tree = placedText;
        return {
            whole: held === null,
            order: records.map((record) => record.path),
            records: records.filter((record) => held?.get(record.path) !== found.get(record.path)),
            ...(moved ? { placed } : {})
        };
    };
}

/** Whether a published record is the scanned one with this hook on it, its values the same ones. */
function carries(
    published: SessionRecord,
    scanned: SessionRecord,
    hook: SessionRecord['hook']
): boolean {
    const keys = Object.keys(scanned) as (keyof SessionRecord)[];
    return (
        Object.keys(published).length === keys.length &&
        keys.every((key) => published[key] === (key === 'hook' ? hook : scanned[key]))
    );
}

/** The records and the tree as the scans found them, joined over what the channel holds. */
export class Scanned {
    #records: Map<string, SessionRecord>;
    #order: string[] = [];
    #placed: PlacedWorkspace[] = [];

    /** `standing` is what the channel holds already, whose unchanged records are kept. */
    constructor(standing: SessionsPayload | undefined) {
        const records = standing?.records ?? [];
        this.#records = new Map(records.map((one) => [one.path, { ...one, hook: null }]));
    }

    /**
     * Take one answer. A record of a whole answer whose content is what is held keeps the object it
     * has here.
     */
    take(answer: ScanAnswer): void {
        const answered = new Map(answer.records.map((record) => [record.path, record]));
        const next = new Map<string, SessionRecord>();
        for (const path of answer.order) {
            const held = this.#records.get(path);
            const found = answered.get(path);
            const same =
                held !== undefined &&
                found !== undefined &&
                answer.whole &&
                JSON.stringify(held) === JSON.stringify(found);
            const record = found === undefined || same ? held : found;
            if (record !== undefined) next.set(path, record);
        }
        this.#records = next;
        this.#order = answer.order;
        if (answer.placed !== undefined) this.#placed = answer.placed;
    }

    /**
     * The payload of what was scanned, with each session's hook and the terminals on it. A record
     * of the standing payload that carries the same content is the same object in it.
     */
    payload(
        standing: SessionsPayload | undefined,
        hooks: HookStore,
        now: number,
        terminals: Terminal[] | null
    ): SessionsPayload {
        const published = new Map(standing?.records.map((record) => [record.path, record]));
        const records = this.#order.flatMap((path) => {
            const scanned = this.#records.get(path);
            if (scanned === undefined) return [];
            const hook = hooks.latest(scanned.id, now);
            const held = published.get(path);
            return held !== undefined && carries(held, scanned, hook)
                ? [held]
                : [{ ...scanned, hook }];
        });
        const workspaces = joinSessions(records, this.#placed);
        return terminals === null ? { records, workspaces } : { records, workspaces, terminals };
    }
}

/** Whether a payload's list of terminals is another's; one with no list is not one with a list. */
function sameTerminals(one: SessionsPayload, other: SessionsPayload): boolean {
    return (
        one.terminals === other.terminals ||
        JSON.stringify(one.terminals) === JSON.stringify(other.terminals)
    );
}

/** Whether a payload's tree places every session where another's does. */
function samePlaces(one: SessionsPayload, other: SessionsPayload): boolean {
    return (
        one.workspaces === other.workspaces ||
        JSON.stringify(placedOf(one.workspaces)) === JSON.stringify(placedOf(other.workspaces))
    );
}

/** Whether two payloads hold the same record objects in order, the same tree and terminals. */
export function samePayload(one: SessionsPayload, other: SessionsPayload): boolean {
    return (
        one.records.length === other.records.length &&
        one.records.every((record, index) => record === other.records[index]) &&
        samePlaces(one, other) &&
        sameTerminals(one, other)
    );
}

/**
 * What a page that was sent `from` is sent for `to`: the records that are not objects of `from`,
 * the order, and the tree and the terminals when they differ. Null when only the whole payload says
 * it, which is a list of terminals in `from` and none in `to`.
 */
export function sessionsDifference(from: Message, to: Message): SessionsDifference | null {
    const was = from.payload as SessionsPayload;
    const is = to.payload as SessionsPayload;
    if (was.terminals !== undefined && is.terminals === undefined) return null;
    const held = new Set(was.records);
    return {
        base: from.version,
        order: is.records.map((record) => record.path),
        records: is.records.filter((record) => !held.has(record)),
        ...(samePlaces(was, is) ? {} : { placed: placedOf(is.workspaces) }),
        ...(sameTerminals(was, is) ? {} : { terminals: is.terminals })
    };
}
