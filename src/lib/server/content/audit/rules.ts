// Layer 2, server. The audit's rules and bookkeeping: the thresholds and vocabularies read out of
// the merged configuration, the muted signatures, a finding's signature, the collector a section
// hands its findings to, and the small readers of the disk and of a field every section shares.

import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { relative } from 'node:path';
import { z } from 'zod';
import { findingText } from '../../../data/helpers/finding-text.ts';
import { isMap, scalar } from '../../../data/helpers/guards.ts';
import type { AuditFinding, Collection, Domain, Project } from '../../../data/model/index.ts';
import { below, realPath } from '../../core/paths.ts';

/** The thresholds and vocabularies the rules read, out of the merged configuration. */
export type AuditRules = {
    /** The soft character limits per manifest field, `read_limits` of config/behavior.yml. */
    readLimits: Record<string, number>;
    /** Whole days a document may be ahead of its own manifest before the manifest is behind. */
    staleLagDays: number;
    /**
     * The domains a project is expected to name a dataset in: the entries of the hub's domains
     * registry marked `expects_datasets: true`.
     */
    dataDomains: Set<string>;
    /** The collection-entry statuses that wait on someone else, so a date is asked for. */
    waitingStatus: Set<string>;
    /** The website's publication feed, hub-relative; the empty string means there is none. */
    publicationsFile: string;
    /** In-flight chips a finished project must not still carry, `lifecycle.live_chips`. */
    liveChips: Set<string>;
    /** The types an archived project is filed under, `lifecycle.archive_outcomes`. */
    archiveOutcomes: Set<string>;
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

/**
 * The items of a list that a shape accepts, in the order the list holds them. A value that is no
 * list is refused.
 */
function keeping<T>(shape: z.ZodType<T>) {
    return z.array(z.unknown()).transform((all) =>
        all.flatMap((one) => {
            const kept = shape.safeParse(one);
            return kept.success ? [kept.data] : [];
        })
    );
}

/** A word of a configured list: text with a character in it. */
const wordShape = z.string().min(1);

/** The strings of a configured list, in the order the file writes them. */
const wordListShape = keeping(wordShape);

/** A field that is one name or a list of names: the names in it, and none for anything else. */
export const namesShape = z
    .union([wordListShape, wordShape.transform((one) => [one])])
    .catch(() => []);

/** The strings of a configured list, lowercased and trimmed, as a set. */
const wordSetShape = keeping(z.string()).transform(
    (all) => new Set(all.map((item) => item.trim().toLowerCase()))
);

/** A pair of chips: a list holding exactly two words, any other item of it left out. */
const chipPairShape = wordListShape.pipe(z.tuple([z.string(), z.string()]));

/** The part of the configuration that names the chips a project's lifecycle reads. */
const lifecycleShape = z.object({
    live_chips: wordListShape.catch(() => []),
    archive_outcomes: wordListShape.catch(() => []),
    terminal_types: wordListShape.catch(() => []),
    author_chips: wordListShape.catch(() => []),
    contradictory_chips: keeping(chipPairShape).catch(() => [])
});

/** A map of any content, answered as it came; `read_limits` is read from its own keys. */
const readLimitsShape = z.custom<Record<string, unknown>>(isMap);

/** A scalar field as the text it reads as, by the shared `scalar`; an absent field reads as ''. */
export const scalarShape = z
    .unknown()
    .optional()
    .transform((value) => scalar(value));

/** A soft limit of `read_limits`: a number. */
const readLimitShape = z.number();

/** `stale_lag_days`: a number. */
const staleLagShape = z.number();

/** `publications_file`: text. */
const publicationsFileShape = z.string();

/**
 * The rules the scan runs under, read out of the merged configuration, and the domains of the
 * hub's registry, whose `expectsDatasets` say where a dataset is expected.
 */
export function auditRules(
    config: Record<string, unknown>,
    domains: readonly Domain[] = []
): AuditRules {
    const limits = readLimitsShape.safeParse(config.read_limits);
    const readLimits: Record<string, number> = {};
    for (const [key, value] of Object.entries(limits.success ? limits.data : {})) {
        const limit = readLimitShape.safeParse(value);
        if (limit.success) readLimits[key] = limit.data;
    }
    const lifecycle = lifecycleShape.safeParse(config.lifecycle);
    const chips = lifecycle.success ? lifecycle.data : lifecycleShape.parse({});
    const lag = staleLagShape.safeParse(config.stale_lag_days);
    const waiting = wordSetShape.safeParse(config.waiting_status);
    const publications = publicationsFileShape.safeParse(config.publications_file);
    return {
        readLimits,
        staleLagDays: lag.success ? lag.data : 1,
        dataDomains: new Set(
            domains.filter((one) => one.expectsDatasets === true).map((one) => one.id)
        ),
        waitingStatus: waiting.success ? waiting.data : new Set(),
        publicationsFile: publications.success ? publications.data : '',
        liveChips: new Set(chips.live_chips),
        archiveOutcomes: new Set(chips.archive_outcomes),
        terminalTypes: new Set(chips.terminal_types),
        authorChips: chips.author_chips,
        contradictory: chips.contradictory_chips
    };
}

/** What a signature looks like, which is what the write accepts and what the config may hold. */
export const SIGNATURE = /^[0-9a-f]{12}$/;

/** The signatures of a configured list, in the order the file lists them. */
const signatureListShape = keeping(z.string().regex(SIGNATURE));

/** The signatures config/behavior.yml's `audit_ignore:` holds, in the order the file lists them. */
export function mutedSignatures(config: Record<string, unknown>): string[] {
    const held = signatureListShape.safeParse(config.audit_ignore);
    return held.success ? held.data : [];
}

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

/**
 * What the scan is run over: the hub on disk, the snapshot's entities, the rules and the words.
 * `root` is the key of a hub other than the primary: its findings carry that key and name their
 * place under it, and the website's publication list, which belongs to the primary hub, is not run
 * over it.
 */
export type AuditInput = {
    hub: string;
    root?: string;
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

/**
 * A collector, so a rule adds a finding without knowing how one is keyed or worded. Given the key
 * of a hub other than the primary it puts the key in front of each finding's scope, which is what
 * the signature reads, and marks the finding with it.
 */
export function collector(
    catalog: Record<string, string>,
    root?: string
): {
    found: AuditFinding[];
    add: (f: Raised) => void;
} {
    const found: AuditFinding[] = [];
    return {
        found,
        add({ key, args, ...finding }) {
            const scope = root === undefined ? finding.scope : `${root}:${finding.scope}`;
            found.push({
                ...finding,
                scope,
                ...(root === undefined ? {} : { root }),
                message: findingText(catalog, key, ...args),
                signature: signatureOf(scope, finding.where, finding.kind, key, args)
            });
        }
    };
}

/** The file of a finding that is about none. */
export const NO_FILE = '';

/**
 * The scope a finding about a project is filed under: the project's hub-relative folder, and the
 * key of its root for a project read from a repository. A repository's folder is an absolute path
 * of this machine, and a muted signature, which reads the scope, is written to the `audit_ignore:`
 * list of config/behavior.yml, a tracked file that must hold no machine path.
 */
export function scopeOf(project: Pick<Project, 'folder' | 'workspaceFolder'>): string {
    return project.workspaceFolder?.root ?? project.folder;
}

/** Whether a project is on the Personal board, which the research rules do not cover. */
export function isPersonal(project: Pick<Project, 'tier'>): boolean {
    return project.tier === 'personal';
}

/**
 * The path of the file a finding is about, relative to `base`: the path given when it names a file
 * on disk whose real path, links followed, lies below the real path of `base`, and the empty text
 * for a folder, a missing path, a link that leaves `base` and anything outside it.
 */
function fileBelow(base: string, path: string): string {
    const real = realPath(path);
    const root = realPath(base);
    if (real === null || root === null || !below(real, root)) return NO_FILE;
    try {
        if (!statSync(real).isFile()) return NO_FILE;
    } catch {
        return NO_FILE;
    }
    return relative(base, path);
}

/** The hub-relative path of the file a finding is about, and the empty text when it names none. */
export function fileOf(hub: string, path: string): string {
    return fileBelow(hub, path);
}

/**
 * The file a finding about a project is about, as the finding carries it: for a project of the
 * hub, the hub-relative path and no `root`; for a project read from a repository, the path
 * relative to the repository and the key of the root that holds it, which the Audit view opens as
 * `{ root, path }`. A path outside the project's root is no file and carries no `root`.
 */
export function fileIn(
    hub: string,
    project: Pick<Project, 'workspaceFolder'>,
    path: string
): Pick<AuditFinding, 'file' | 'root'> {
    const { workspaceFolder } = project;
    if (workspaceFolder === undefined) return { file: fileOf(hub, path) };
    const file = fileBelow(workspaceFolder.dir, path);
    return file === NO_FILE ? { file } : { root: workspaceFolder.root, file };
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
