// Layer 2, server. The audit's rules and bookkeeping: the thresholds and vocabularies read out of
// the merged configuration, the muted signatures, a finding's signature, the collector a section
// hands its findings to, and the small readers of the disk and of a field every section shares.

import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { findingText } from '../../../data/helpers/finding-text.ts';
import type { AuditFinding, Collection, Project } from '../../../data/model/index.ts';

/** The thresholds and vocabularies the rules read, out of the merged configuration. */
export type AuditRules = {
    /** The soft character limits per manifest field, `read_limits` of config/behavior.yml. */
    readLimits: Record<string, number>;
    /** Whole days a document may be ahead of its own manifest before the manifest is behind. */
    staleLagDays: number;
    /** The domains a project is expected to name a dataset in. */
    dataDomains: Set<string>;
    /** The collection-entry statuses that wait on someone else, so a date is asked for. */
    waitingStatus: Set<string>;
    /** The website's publication feed, hub-relative; the empty string means there is none. */
    publicationsFile: string;
    /** In-flight chips a finished project must not still carry, `lifecycle.live_chips`. */
    liveChips: Set<string>;
    /** The types that are a closed outcome, `lifecycle.terminal_types`. */
    terminalTypes: Set<string>;
    /** The chips one of which marks the author role, `lifecycle.author_chips`. */
    authorChips: string[];
    /** Chip pairs that cannot both be true, `lifecycle.contradictory_chips`. */
    contradictory: [string, string][];
};

/** A list written `['a', 'b']`, the form an audit message quotes a list in. */
export function printed(items: string[]): string {
    return `[${items.map((item) => `'${item}'`).join(', ')}]`;
}

/** A finite number of the merged config, or the fallback when the key is absent or not a number. */
export function number(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** The strings of a configured list, lowercased and trimmed, as a set. */
function wordSet(value: unknown): Set<string> {
    if (!Array.isArray(value)) return new Set();
    return new Set(
        value
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim().toLowerCase())
    );
}

/** The rules the scan runs under, read out of the merged configuration. */
export function auditRules(config: Record<string, unknown>): AuditRules {
    const limits = config.read_limits;
    const readLimits: Record<string, number> = {};
    if (typeof limits === 'object' && limits !== null && !Array.isArray(limits)) {
        for (const [key, value] of Object.entries(limits as Record<string, unknown>)) {
            if (typeof value === 'number' && Number.isFinite(value)) readLimits[key] = value;
        }
    }
    const lifecycle = mapOf(config.lifecycle);
    return {
        readLimits,
        staleLagDays: number(config.stale_lag_days, 1),
        dataDomains: wordSet(config.data_domains),
        waitingStatus: wordSet(config.waiting_status),
        publicationsFile:
            typeof config.publications_file === 'string' ? config.publications_file : '',
        liveChips: new Set(wordList(lifecycle.live_chips)),
        terminalTypes: new Set(wordList(lifecycle.terminal_types)),
        authorChips: wordList(lifecycle.author_chips),
        contradictory: chipPairs(lifecycle.contradictory_chips)
    };
}

/** A map of the merged config, or an empty one for anything that is not one. */
function mapOf(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
}

/** The strings of a configured list, in the order the file writes them. */
function wordList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((one): one is string => typeof one === 'string' && one !== '');
}

/** The two-chip rows of a configured list of pairs; a row that is not a pair is left out. */
function chipPairs(value: unknown): [string, string][] {
    if (!Array.isArray(value)) return [];
    const pairs: [string, string][] = [];
    for (const row of value) {
        const words = wordList(row);
        if (words.length === 2) pairs.push([words[0], words[1]]);
    }
    return pairs;
}

/** The signatures config/behavior.yml's `audit_ignore:` holds, in the order the file lists them. */
export function mutedSignatures(config: Record<string, unknown>): string[] {
    const held = config.audit_ignore;
    if (!Array.isArray(held)) return [];
    return held.filter((one): one is string => typeof one === 'string' && SIGNATURE.test(one));
}

/** What a signature looks like, which is what the write accepts and what the config may hold. */
export const SIGNATURE = /^[0-9a-f]{12}$/;

/**
 * One finding's stable short key: sha1 over the scope, the place, the kind, the catalog key of its
 * message and the arguments the rule filled the message with, twelve hex characters of it. The key
 * and the arguments are in it so two gaps on one file are two findings and a changed marker count
 * comes back as a new one; the rendered sentence is not, so rewording a message in the catalog
 * keeps every mute.
 */
export function signatureOf(
    scope: string,
    where: string,
    kind: string,
    key: string,
    args: readonly (string | number)[]
): string {
    const raw = [scope, where, kind, key, ...args.map(String)].join('\u001f');
    return createHash('sha1').update(raw, 'utf8').digest('hex').slice(0, 12);
}

/** What the scan is run over: the hub on disk, the snapshot's entities, the rules and the words. */
export type AuditInput = {
    hub: string;
    projects: Project[];
    collections: Collection[];
    rules: AuditRules;
    catalog: Record<string, string>;
};

/** The catalog sentence a finding is worded by: its key and the arguments that fill it. */
type Sentence = { key: string; args: readonly (string | number)[] };

/** A rule names its sentence by key, so the key and the arguments are what the signature reads. */
export function sentence(key: string, ...args: (string | number)[]): Sentence {
    return { key, args };
}

/** What a rule hands the collector: where the finding is and which catalog sentence says it. */
export type Raised = Omit<AuditFinding, 'signature' | 'message'> & Sentence;

/** A collector, so a rule adds a finding without knowing how one is keyed or worded. */
export function collector(catalog: Record<string, string>): {
    found: AuditFinding[];
    add: (f: Raised) => void;
} {
    const found: AuditFinding[] = [];
    return {
        found,
        add({ key, args, ...finding }) {
            found.push({
                ...finding,
                message: findingText(catalog, key, ...args),
                signature: signatureOf(finding.scope, finding.where, finding.kind, key, args)
            });
        }
    };
}

/** One file's text, and the empty string for anything that cannot be read. */
export function slurp(path: string): string {
    try {
        return readFileSync(path, 'utf8');
    } catch {
        return '';
    }
}

/** Whether the path is a directory. */
export function isFolder(path: string): boolean {
    try {
        return statSync(path).isDirectory();
    } catch {
        return false;
    }
}

/** A scalar field of an entry as the text it reads as, and the empty string for anything else. */
export function scalar(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
}

/** A field that is one value or a list of them, as a list of the strings in it. */
export function listOf(value: unknown): string[] {
    const items = Array.isArray(value) ? value : [value];
    return items.filter((one): one is string => typeof one === 'string' && one !== '');
}
